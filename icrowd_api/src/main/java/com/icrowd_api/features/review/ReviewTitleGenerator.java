package com.icrowd_api.features.review;

import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ReviewTitleGenerator {

    private static final List<String> STOP_WORDS = Arrays.asList(
            "the", "is", "at", "which", "on", "a", "an", "and", "or", "but", "in", "to", "for", "with"
    );

    public String generateTitle(String comment) {
        if (comment == null || comment.trim().isEmpty()) {
            return "No Title";
        }

        // 1. Clean and split the comment into words
        String[] words = comment.replaceAll("[^a-zA-Z ]", "").toLowerCase().split("\\s+");

        // 2. Filter out stop words and take the first 4 meaningful words
        String title = Arrays.stream(words)
                .filter(word -> !STOP_WORDS.contains(word) && word.length() > 2)
                .limit(4)
                .map(this::capitalize)
                .collect(Collectors.joining(" "));

        if (title.isEmpty()) {
            return "Good Product"; // Fallback if no meaningful words are found
        }

        return title + "!";
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
