package com.icrowd_api.features.question;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.product.Product;
@Entity @Getter @Setter @NoArgsConstructor
public class ProductQuestion {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(nullable=false) private Product product;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(nullable=false) private User user;
    @Column(nullable=false,length=1000) private String question;
    @Column(length=2000) private String answer;
    @ManyToOne(fetch=FetchType.LAZY) private User answeredBy;
    private LocalDateTime answeredAt;
    @org.hibernate.annotations.CreationTimestamp private LocalDateTime createdAt;
}
