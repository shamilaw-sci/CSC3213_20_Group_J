package com.icrowd_api.features.marketing;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Getter @Setter @NoArgsConstructor
public class EmailPreference {
    @Id private Long userId;
    private boolean subscribed;
    private Instant consentAt;
    private Instant confirmedAt;
    @Column(unique=true, length=64) private String confirmationTokenHash;
    private Instant confirmationExpiresAt;
    private Instant confirmationRequestedAt;
    private Instant updatedAt;
    @Column(length=500) private String interests = "";
    @Column(length=500) private String brands = "";
    @Column(unique=true, nullable=false) private String unsubscribeToken;
}
