package com.icrowd_api.features.review;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReviewTitleGeneratorTest {

    private final ReviewTitleGenerator generator = new ReviewTitleGenerator();

    @Test
    void returnsNoTitleForNullOrBlankComments() {
        assertEquals("No Title", generator.generateTitle(null));
        assertEquals("No Title", generator.generateTitle("   "));
    }

    @Test
    void removesStopWordsPunctuationAndLimitsTitleToFourWords() {
        String title = generator.generateTitle("The excellent camera, is bright and durable with accessories today");

        assertEquals("Excellent Camera Bright Durable!", title);
    }

    @Test
    void returnsFallbackWhenCommentHasNoMeaningfulWords() {
        assertEquals("Good Product", generator.generateTitle("a an is to"));
    }

    @Test
    void capitalizesMeaningfulWords() {
        assertEquals("Amazing Product!", generator.generateTitle("amazing product"));
    }
}
