package com.icrowd_api.features.marketing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface EmailCampaignRepository extends JpaRepository<EmailCampaign,Long> {
    List<EmailCampaign> findTop10ByPreparedFalseOrderByIdAsc();
    boolean existsBySourceKey(String key);
    List<EmailCampaign> findByPreparedFalseOrderByIdAsc();
    List<EmailCampaign> findTop30ByOrderByIdDesc();
}
