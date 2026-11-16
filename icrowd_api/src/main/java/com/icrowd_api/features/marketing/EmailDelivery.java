package com.icrowd_api.features.marketing;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Getter @Setter @NoArgsConstructor
@Table(uniqueConstraints=@UniqueConstraint(columnNames={"campaignId","userId"}))
public class EmailDelivery {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    private Long campaignId;
    private Long userId;
    private Long productId;
    private String status = "QUEUED";
    private String reason;
    private int score;
    private int attempts;
    private Instant lastAttemptAt;
    private Instant nextAttemptAt = Instant.EPOCH;
    private String failure;
}
