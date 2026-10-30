package com.icrowd_api.features.order;
import com.icrowd_api.features.order.dto.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.*;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@EnableScheduling
public class PaymentService {
    private final OrderRepository orders;
    private final PaymentRepository payments;
    private final StockAllocationService stock;
    private final PayHereClient gateway;
    private final TransactionTemplate tx;
    @Value("${app.frontend.url:http://localhost:5173}") private String frontendUrl;
    public PaymentService(OrderRepository orders, PaymentRepository payments, StockAllocationService stock,
                          PayHereClient gateway, PlatformTransactionManager manager) {
        this.orders=orders; this.payments=payments; this.stock=stock; this.gateway=gateway;
        tx=new TransactionTemplate(manager);
    }
    public InitiatePaymentResponse initiatePayment(String email, InitiatePaymentRequest request) {
        if(request.getPaymentMethod()!=PaymentMethod.CARD) throw new IllegalArgumentException("Only card checkout uses PayHere");
        gateway.requireConfigured();
        return tx.execute(s -> {
            Order order=orders.findForUpdate(request.getOrderId()).orElseThrow();
            if(!order.getUser().getEmail().equalsIgnoreCase(email)) throw new IllegalArgumentException("Access denied");
            if(order.getPaymentMethod()!=PaymentMethod.CARD || order.isStockAllocated()
                || (order.getStatus()!=OrderStatus.PENDING_PAYMENT && order.getStatus()!=OrderStatus.FAILED))
                throw new IllegalStateException("This order cannot accept another payment");
            Payment p=payments.findByOrderId(order.getId()).stream().filter(x -> "PAYHERE".equals(x.getGateway()) && x.getStatus()==PaymentStatus.INITIATED).findFirst().orElse(null);
            if(p==null) {
                p=Payment.builder().order(order).gateway("PAYHERE").internalPaymentId(UUID.randomUUID().toString())
                    .amount(order.getTotalAmount()).currency(order.getCurrency()).paymentMethod(PaymentMethod.CARD)
                    .status(PaymentStatus.INITIATED).initiatedAt(LocalDateTime.now()).build();
                payments.save(p);
            }
            order.setPaymentStatus(PaymentStatus.INITIATED); order.setStatus(OrderStatus.PENDING_PAYMENT);
            return InitiatePaymentResponse.builder().internalPaymentId(p.getInternalPaymentId()).checkoutUrl(gateway.checkoutUrl())
                .checkoutFields(gateway.checkout(p,order,frontendUrl)).orderId(order.getId()).orderReference(order.getOrderReference())
                .amount(p.getAmount()).currency(p.getCurrency()).paymentMethod("CARD").status(p.getStatus().name()).build();
        });
    }
    public void processNotification(Map<String,String> notification) {
        gateway.verify(notification);
        Payment snapshot=payments.findByInternalPaymentId(notification.get("order_id")).orElseThrow();
        Long orderId=payments.findOrderId(snapshot.getId());
        tx.executeWithoutResult(s -> {
            Order order=orders.findForUpdate(orderId).orElseThrow();
            Payment p=payments.findById(snapshot.getId()).orElseThrow();
            if(!"PAYHERE".equals(p.getGateway()) || !p.getCurrency().equals(notification.get("payhere_currency"))
                || p.getAmount().compareTo(new BigDecimal(notification.get("payhere_amount")))!=0)
                throw new IllegalArgumentException("Payment amount or currency does not match");
            String code=notification.get("status_code");
            if(!Set.of("2","0","-1","-2","-3").contains(code)) throw new IllegalArgumentException("Unknown payment status");
            if(p.getGatewayTransactionRef()!=null && !p.getGatewayTransactionRef().equals(notification.get("payment_id")))
                throw new IllegalArgumentException("Different transaction for this payment: manual reconciliation required");
            if(p.getStatus()==PaymentStatus.SUCCESS || p.getStatus()==PaymentStatus.REFUNDED || p.getStatus()==PaymentStatus.REFUND_PENDING) return;
            if("2".equals(code)) {
                p.setGatewayTransactionRef(notification.get("payment_id"));
                boolean duplicateOrderPayment=order.isStockAllocated();
                if(duplicateOrderPayment || (order.getStatus()!=OrderStatus.PENDING_PAYMENT && order.getStatus()!=OrderStatus.FAILED) || !stock.allocate(order)) {
                    if(!duplicateOrderPayment) { order.setStatus(OrderStatus.STOCK_UNAVAILABLE); order.setPaymentStatus(PaymentStatus.REFUND_PENDING); }
                    p.setStatus(PaymentStatus.REFUND_PENDING);
                } else {
                    p.setStatus(PaymentStatus.SUCCESS); p.setCompletedAt(LocalDateTime.now());
                    order.setStatus(OrderStatus.PROCESSING); order.setPaymentStatus(PaymentStatus.SUCCESS);
                }
            } else if(("-1".equals(code) || "-2".equals(code)) && p.getStatus()==PaymentStatus.INITIATED) {
                p.setStatus(PaymentStatus.FAILED);
                boolean otherPending=payments.findByOrderId(orderId).stream().anyMatch(x -> !x.getId().equals(p.getId()) && x.getStatus()==PaymentStatus.INITIATED);
                if(!order.isStockAllocated() && !otherPending && order.getStatus()==OrderStatus.PENDING_PAYMENT) {
                    order.setStatus(OrderStatus.FAILED); order.setPaymentStatus(PaymentStatus.FAILED);
                }
            }
        });
        attemptRefund(snapshot.getId());
    }
    public void attemptRefund(Long id) {
        if(!gateway.refundsConfigured()) return;
        Long orderId=payments.findOrderId(id);
        String reference=tx.execute(s -> {
            orders.findForUpdate(orderId).orElseThrow();
            Payment p=payments.findById(id).orElseThrow();
            if(!"PAYHERE".equals(p.getGateway()) || p.getStatus()!=PaymentStatus.REFUND_PENDING || p.getGatewayRawResponse()!=null) return null;
            // Durable claim: ambiguous timeouts require merchant verification, never blind retries.
            p.setGatewayRawResponse("REFUND_SUBMITTED_REQUIRES_VERIFICATION");
            return p.getGatewayTransactionRef();
        });
        if(reference==null) return;
        try {
            if(gateway.refund(reference)) tx.executeWithoutResult(s -> {
                Order order=orders.findForUpdate(orderId).orElseThrow();
                Payment p=payments.findById(id).orElseThrow();
                p.setStatus(PaymentStatus.REFUNDED); p.setGatewayRawResponse("REFUND_CONFIRMED");
                if(!order.isStockAllocated()) order.setPaymentStatus(PaymentStatus.REFUNDED);
            });
        } catch(Exception ex) {
            org.slf4j.LoggerFactory.getLogger(getClass()).warn("Payment {} refund needs merchant verification",id);
        }
    }
    @Scheduled(fixedDelayString="${payhere.reconcile-delay-ms:60000}")
    public void recoverPayments() {
        tx.executeWithoutResult(s -> orders.expireUnstarted(LocalDateTime.now().minusHours(24)));
        for(Long id:payments.findRecoverableIds()) {
            try { attemptRefund(id); }
            catch(Exception ex) { org.slf4j.LoggerFactory.getLogger(getClass()).warn("Payment {} awaits review",id); }
        }
    }
}
