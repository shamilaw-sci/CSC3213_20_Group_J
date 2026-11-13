package com.icrowd_api.features.marketing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
public interface EmailAttemptRepository extends JpaRepository<EmailAttempt,Long> {
    long countByAttemptedAtAfter(Instant since);
    long countByUserIdAndAttemptedAtAfter(Long userId, Instant since);
}
