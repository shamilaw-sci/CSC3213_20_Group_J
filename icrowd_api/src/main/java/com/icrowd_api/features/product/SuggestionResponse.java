package com.icrowd_api.features.product;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class SuggestionResponse {
    private List<String> terms;
    private List<String> categories;
    private List<Product> products;
}