package com.icrowd_api.features.auth;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonIgnore
    private Customer customer;

    @Column(length = 100)
    private String recipientName;

    @Column(length = 20)
    private String phone;

    @NotBlank(message = "Address line 1 is required")
    @Column(nullable = false, length = 255)
    private String addressLine1;

    @Column(length = 255)
    private String addressLine2;

    @NotBlank(message = "City is required")
    @Column(nullable = false, length = 100)
    private String city;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    private String province;

    @Column(length = 20)
    private String postalCode;

    @Builder.Default
    @Column(length = 100)
    private String country = "Sri Lanka";

    @Builder.Default
    @Column(length = 50)
    private String addressType = "HOME"; // HOME, WORK, OFFICE, OTHER, etc.

    @Builder.Default
    private Boolean isDefault = false;

    private Double latitude;

    private Double longitude;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
