package com.icrowd_api.features.marketing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.*;
public interface EmailDeliveryRepository extends JpaRepository<EmailDelivery,Long> {
    List<EmailDelivery> findTop100ByStatusInAndNextAttemptAtLessThanEqualOrderByIdAsc(List<String> statuses, Instant now);
    long countByLastAttemptAtAfter(Instant since);
    long countByUserIdAndLastAttemptAtAfter(Long userId, Instant since);
    List<EmailDelivery> findTop100ByCampaignIdOrderByIdAsc(Long id);
    long countByCampaignIdAndStatus(Long id, String status);
}
