package com.icrowd_api.features.order;
import com.icrowd_api.features.auth.UserService;
import com.icrowd_api.features.audit.AuditService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/api/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
public class PaymentReviewController {
    private final PaymentRepository payments;
    private final PaymentService service;
    private final UserService users;
    private final AuditService audit;
    public PaymentReviewController(PaymentRepository payments, PaymentService service, UserService users, AuditService audit) {
        this.payments=payments; this.service=service; this.users=users; this.audit=audit;
    }
    public record Review(Long id, Long orderId, String reference, String status, java.math.BigDecimal amount, String currency) {}
    public record Resolution(String password, String outcome, String note) {}
    @GetMapping("/review") @Transactional(readOnly=true)
    public Page<Review> reviews(@RequestParam(defaultValue="0") int page) {
        return payments.findByStatusIn(List.of(PaymentStatus.REVIEW_REQUIRED, PaymentStatus.REFUND_PENDING, PaymentStatus.CHARGEBACK),
            PageRequest.of(Math.max(0,page),20,Sort.by("id"))).map(p -> new Review(p.getId(),p.getOrder().getId(),
                p.getOrder().getOrderReference(),p.getStatus().name(),p.getAmount(),p.getCurrency()));
    }
    @PostMapping("/{id}/resolve") @Transactional
    public Map<String,String> resolve(@PathVariable Long id, @RequestBody Resolution input, Principal principal) {
        users.validateAdminPassword(principal.getName(),input.password());
        service.resolveReview(id,input.outcome(),input.note());
        audit.log(principal.getName(),"PAYMENT_RECONCILED","PAYMENT",id,input.outcome()+": "+input.note());
        return Map.of("message","Merchant verification recorded.");
    }
}
