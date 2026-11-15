package com.icrowd_api.features.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT p.order.id FROM Payment p WHERE p.id = :id")
    Long findOrderId(@org.springframework.data.repository.query.Param("id") Long id);
    @org.springframework.data.jpa.repository.Query("SELECT p.id FROM Payment p WHERE p.status IN (com.icrowd_api.features.order.PaymentStatus.INITIATED, com.icrowd_api.features.order.PaymentStatus.REFUND_PENDING)")
    List<Long> findRecoverableIds();
    @org.springframework.data.jpa.repository.Query("SELECT p.id FROM Payment p WHERE p.status IN ('INITIATED','REFUND_PENDING') AND (p.nextReconcileAt IS NULL OR p.nextReconcileAt <= :now) ORDER BY p.id")
    List<Long> findDue(@org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now, org.springframework.data.domain.Pageable page);
    org.springframework.data.domain.Page<Payment> findByStatusIn(List<PaymentStatus> statuses, org.springframework.data.domain.Pageable page);
    Optional<Payment> findByInternalPaymentId(String internalPaymentId);
    Optional<Payment> findByGatewayTransactionRef(String gatewayTransactionRef);
    List<Payment> findByOrderId(Long orderId);
}
