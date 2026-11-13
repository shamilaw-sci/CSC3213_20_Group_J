package com.icrowd_api.features.marketing;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Getter @Setter @NoArgsConstructor
public class EmailCampaign {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(unique=true, nullable=false) private String sourceKey;
    private String kind;
    private Long sourceId;
    private Instant createdAt;
    private boolean prepared;
}
