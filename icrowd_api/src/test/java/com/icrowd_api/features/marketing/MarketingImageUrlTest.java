package com.icrowd_api.features.marketing;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class MarketingImageUrlTest {
    @Test
    void localCatalogueImageUsesPublicStorefrontOrigin() {
        assertEquals("https://demo.example/images/products/demo-last-01.png",
            MarketingWorker.emailImageUrl("/images/products/demo-last-01.png", "https://demo.example/"));
        assertEquals("https://demo.example/images/products/sku-001.png",
            MarketingWorker.emailImageUrl("/images/products/sku-001.png", "https://demo.example"));
    }

    @Test
    void existingExternalHttpsPhotosArePreserved() {
        String image = "https://cdn.example/photo.jpg?width=800";
        assertEquals(image, MarketingWorker.emailImageUrl(image, "https://demo.example"));
    }

    @Test
    void unusableAndNonHttpsImagesAreOmitted() {
        for (String value : List.of("", "javascript:alert(1)", "http://cdn.example/photo.jpg",
                "//another.example/photo.jpg", "images/photo.jpg", "/bad image.jpg", "https://user:password@cdn.example/photo.jpg")) {
            assertNull(MarketingWorker.emailImageUrl(value, "https://demo.example"), value);
        }
        assertNull(MarketingWorker.emailImageUrl(null, "https://demo.example"));
        assertNull(MarketingWorker.emailImageUrl("/images/products/sku-001.png", "http://localhost:5173"));
    }
}
