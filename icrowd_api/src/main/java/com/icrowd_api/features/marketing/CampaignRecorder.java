package com.icrowd_api.features.marketing;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
@Service @RequiredArgsConstructor
public class CampaignRecorder {
    private final EmailCampaignRepository campaigns;
    @Transactional
    public void record(String kind, Long sourceId) {
        String key = kind + ":" + sourceId;
        if (campaigns.existsBySourceKey(key)) return;
        EmailCampaign campaign = new EmailCampaign();
        campaign.setSourceKey(key); campaign.setKind(kind); campaign.setSourceId(sourceId);
        campaign.setCreatedAt(Instant.now()); campaigns.save(campaign);
    }
}
