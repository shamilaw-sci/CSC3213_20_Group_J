package com.icrowd_api.features.storefront;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class StorefrontHero {
    @Id private Long id = 1L;
    private String headline = "Upgrade your everyday.";
    private String subtitle = "Discover smartphones, audio and accessories made for the way you live.";
    @Column(columnDefinition = "bytea") private byte[] image;
    private String contentType;
    private String imageVersion;
}
