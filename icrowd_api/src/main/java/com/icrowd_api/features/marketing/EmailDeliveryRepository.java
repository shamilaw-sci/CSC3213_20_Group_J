package com.icrowd_api.features.marketing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.*;
public interface EmailDeliveryRepository extends JpaRepository<EmailDelivery,Long> {
    List<EmailDelivery> findTop100ByStatusInAndNextAttemptAtLessThanEqualOrderByIdAsc(List<String> statuses, Instant now);
    @org.springframework.data.jpa.repository.Query("select d.campaignId,d.status,count(d) from EmailDelivery d where d.campaignId in :ids group by d.campaignId,d.status")
    List<Object[]> countCampaignStatuses(@org.springframework.data.repository.query.Param("ids") List<Long> ids);
    long countByLastAttemptAtAfter(Instant since);
    long countByUserIdAndLastAttemptAtAfter(Long userId, Instant since);
    List<EmailDelivery> findTop100ByCampaignIdOrderByIdAsc(Long id);
    long countByCampaignIdAndStatus(Long id, String status);
}
