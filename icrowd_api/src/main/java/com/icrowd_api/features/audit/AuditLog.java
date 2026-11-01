package com.icrowd_api.features.audit;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String actorEmail;

    @Column(nullable = false)
    private String action; // ROLE_PROMOTION, ROLE_DEMOTION, ACCOUNT_DEACTIVATION, ACCOUNT_REACTIVATION, PRICE_CHANGE, STOCK_ADJUSTMENT

    @Column(nullable = false)
    private String entityType; // USER, PRODUCT

    @Column(nullable = false)
    private Long entityId;

    @Column(length = 1000)
    private String details;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime timestamp;
}
