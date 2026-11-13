package com.icrowd_api.features.marketing;
import jakarta.persistence.*;
import lombok.*;
@Entity @Getter @Setter @NoArgsConstructor
public class EmailQueueLock { @Id private Long id = 1L; }
