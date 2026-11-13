package com.icrowd_api.features.marketing;
import lombok.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
@Component @ConfigurationProperties(prefix="app.marketing") @Getter @Setter
public class MarketingProperties {
    private boolean enabled = false;
    private String from = "";
    private String frontendUrl = "http://localhost:5173";
    private String publicApiUrl = "http://localhost:8080";
    private int dailyLimit = 100;
    private int weeklyCustomerLimit = 2;
}
