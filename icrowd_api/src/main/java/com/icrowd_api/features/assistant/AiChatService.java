package com.icrowd_api.features.assistant;

import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AiChatService {

    private final ProductRepository productRepository;

    public AiChatService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public AiChatResponse processMessage(AiChatRequest request) {
        String userMsg = request != null && request.getMessage() != null
                ? request.getMessage().trim()
                : "";

        if (userMsg.isEmpty()) {
            return AiChatResponse.builder()
                    .reply("ආයුබෝවන්! 👋 මම iCrowd AI සහායකයා. මට ඔබට උදවු කළ හැක්කේ කෙසේද?")
                    .products(Collections.emptyList())
                    .suggestions(List.of("🎧 Headsets", "🔋 PowerBanks", "🛡️ Phone Cases", "🏷️ Best Deals"))
                    .build();
        }

        String lower = userMsg.toLowerCase();
        List<Product> allProducts = productRepository.findAllActiveProductsList();
        Double budget = extractBudget(lower);

        // ─────────────────────────────────────────────────────────────────────────────
        // 1. SPECIFIC INTENT: Phone & Budget Smartphone Inquiries
        // ─────────────────────────────────────────────────────────────────────────────
        boolean isPhoneInquiry = containsWord(lower, "phone", "phones", "smart phone", "smartphone", "mobile", "ෆෝන්", "දුරකථන")
                || containsWord(lower, "brand", "brands", "බ්‍රෑන්ඩ්") && (budget != null || containsWord(lower, "gnna", "ganna", "one", "buy", "miladee"));

        if (isPhoneInquiry) {
            String reply;
            List<String> suggestions;

            if (budget != null && budget <= 65000) {
                reply = "📱 **රු. " + String.format("%,.0f", budget) + " සීමාවේ ලංකාවේ මිලදී ගත හැකි හොඳම Phone Brands & Models:**\n\n"
                        + "1. **Xiaomi / Redmi:** Redmi 13C, Redmi 12 (විශිෂ්ට 5000mAh Battery සහ Smooth 90Hz Display)\n"
                        + "2. **Samsung:** Galaxy A05s, Galaxy A05 (වසර ගණනාවක Software Updates සහ Official Brand Trust)\n"
                        + "3. **Vivo / Oppo:** Vivo Y17s, Oppo A18 (Stylish Slim Design සහ Fast Camera)\n"
                        + "4. **Realme:** Realme C53 (Fast 33W Charging)\n\n"
                        + "⚡ **iCrowd Store එකෙන් ඔබට ලැබෙන වාසිය:**\n"
                        + "අපගේ Store එක මගින් මෙම සියලුම දුරකථන සඳහා අවශ්‍ය **Original Fast Chargers, High-Capacity PowerBanks, සහ Protective Cases** නිල වගකීමක් සහිතව ලබාගත හැක.\n\n"
                        + "ඔබගේ දුරකථනයට ගැළපෙන හොඳම Accessories පහතින් තෝරාගන්න:";
                suggestions = List.of("🔋 140W Fast Chargers", "🔋 20000mAh PowerBanks", "🎧 Earbuds / Headsets", "🛡️ Phone Cases");
            } else if (budget != null && budget > 65000 && budget <= 160000) {
                reply = "📱 **රු. " + String.format("%,.0f", budget) + " සීමාවේ Mid-Range Flagship Phone Brands:**\n\n"
                        + "1. **Samsung:** Galaxy A35 5G / Galaxy A55 5G (Super AMOLED, Water Resistance IP67)\n"
                        + "2. **Xiaomi:** Redmi Note 13 Pro+ / Poco X6 Pro (120W HyperCharge, 200MP Camera)\n"
                        + "3. **Google:** Pixel 7a / Pixel 8a (Best Computational Photography & Stock Android)\n\n"
                        + "🛡️ මෙම වටිනා දුරකථන ආරක්ෂා කරගැනීමට අවශ්‍ය High-End Accessories අප සතුව ඇත:";
                suggestions = List.of("🔋 Fast Chargers", "🛡️ Heavy-Duty Cases", "🎧 Noise Cancelling Headsets");
            } else {
                reply = "📱 **ලංකාවේ වඩාත්ම ජනප්‍රිය Phone Brands සහ Flagship Models:**\n\n"
                        + "• **Apple:** iPhone 15 Pro / 15 / 14 Series (iOS Premium Ecosystem)\n"
                        + "• **Samsung:** Galaxy S24 Ultra / Galaxy A Series (AMOLED Display & AI Features)\n"
                        + "• **Xiaomi / Redmi:** Note 13 Series / 13C (Best Value for Money & Fast Charging)\n"
                        + "• **Google Pixel:** Pixel 8 Pro / 7a (Top Tier Camera Quality)\n\n"
                        + "⚡ **iCrowd Store විශේෂත්වය:**\n"
                        + "මෙම සියලුම Flagship හා Budget දුරකථන සඳහා අවශ්‍ය **Apple / Anker / Sony Original Accessories (Headsets, Fast Chargers, MagSafe Covers)** අප සතුව ඇත. පහත නිර්දේශිත භාණ්ඩ බලන්න:";
                suggestions = List.of("🎧 Sony Headsets", "🔋 Anker Chargers", "🛡️ MagSafe Cases", "🚚 Delivery Info");
            }

            // Return top versatile accessories
            List<Product> recommendedAccessories = getCuratedAccessories(allProducts, budget);
            return AiChatResponse.builder()
                    .reply(reply)
                    .products(recommendedAccessories)
                    .suggestions(suggestions)
                    .build();
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 2. Delivery / Shipping FAQs
        // ─────────────────────────────────────────────────────────────────────────────
        if (containsWord(lower, "delivery", "shipping", "dawas", "diliwari", "ඩිලිවරි", "ගෙනැවිත්", "එන්න කොච්චර", "කල් යනවද")) {
            return AiChatResponse.builder()
                    .reply("🚚 **iCrowd Island-wide Delivery තොරතුරු:**\n\n"
                            + "• **බෙදාහැරීමේ කාලය:** දිවයිනේ ඕනෑම තැනකට දින 2-4ක් (2-4 Working Days) ඇතුළත ආරක්ෂිතව නිවසටම ගෙනවිත් දෙනු ලැබේ.\n"
                            + "• **Cash on Delivery (COD):** භාණ්ඩය ලැබුණු පසු මුදල් ගෙවීමේ පහසුකම ඇත.\n"
                            + "• **Tracking:** ඇණවුම යැවූ පසු SMS හා Email මගින් Live Tracking අංකයක් ලැබේ.\n"
                            + "• **Delivery ගාස්තු:** රු. 350/= (දිවයින පුරා ස්ථාවර ගාස්තුව).")
                    .products(Collections.emptyList())
                    .suggestions(List.of("🛡️ Warranty තොරතුරු", "💳 Payment ක්‍රම", "🎧 Browse Accessories"))
                    .build();
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 3. Warranty FAQs
        // ─────────────────────────────────────────────────────────────────────────────
        if (containsWord(lower, "warranty", "guarantee", "waranthi", "වොරන්ටි", "ගැරන්ටි", "වගකීම", "guaranty")) {
            return AiChatResponse.builder()
                    .reply("🛡️ **iCrowd Official Warranty සහතිකය:**\n\n"
                            + "• අපගේ සියලුම Headsets, PowerBanks, සහ Fast Chargers සඳහා **වසර 1ක (1 Year) නිල Brand Warranty** එකක් හිමිවේ.\n"
                            + "• මිලදී ගත් දින සිට දින 7ක් ඇතුළත කිසියම් නිෂ්පාදන දෝෂයක් හඳුනාගතහොත් **Instant Replacement** පහසුකම පවතී.\n"
                            + "• Warranty Claim කිරීම සඳහා Invoice එක හෝ Order ID එක ඉදිරිපත් කිරීම පමණක් ප්‍රමාණවත්ය.")
                    .products(Collections.emptyList())
                    .suggestions(List.of("🚚 Delivery තොරතුරු", "🔋 PowerBanks", "🎧 Headsets"))
                    .build();
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 4. Payment FAQs
        // ─────────────────────────────────────────────────────────────────────────────
        if (containsWord(lower, "payment", "card", "pay", "kramaya", "gewanna", "මුදල් ගෙවීම", "ගෙවීම්", "cod", "koko", "mintpay", "installment")) {
            return AiChatResponse.builder()
                    .reply("💳 **ගෙවීම් ක්‍රම (Payment Options):**\n\n"
                            + "• **Cash on Delivery (COD):** භාණ්ඩය අතට ලැබුණු පසු මුදල් ගෙවන්න.\n"
                            + "• **Credit / Debit Cards:** Visa & MasterCard මගින් 100% ආරක්ෂිතව Online ගෙවන්න.\n"
                            + "• **Koko / Mintpay:** පොලී රහිතව මාස 3ක පහසු වාරික මගින් ගෙවීමේ පහසුකම.\n"
                            + "• **Bank Transfer:** සෘජු බැංකු තැන්පතු මගින් ගෙවීම් කිරීමේ හැකියාව.")
                    .products(Collections.emptyList())
                    .suggestions(List.of("🎧 Headsets", "🔋 PowerBanks", "🏷️ Best Deals"))
                    .build();
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 5. Store Location / Contact FAQs
        // ─────────────────────────────────────────────────────────────────────────────
        if (containsWord(lower, "contact", "address", "call", "hotline", "office", "shop eka koheda", "store location", "ලිපිනය", "දුරකථන", "තැන කොහෙද", "location")) {
            return AiChatResponse.builder()
                    .reply("📍 **iCrowd Store & Support විස්තර:**\n\n"
                            + "• **ලිපිනය:** No. 120, Galle Road, Colombo 03, Sri Lanka.\n"
                            + "• **Customer Care Hotline:** 📞 +94 77 123 4567 (පෙ.ව. 9:00 - ප.ව. 8:00)\n"
                            + "• **Email:** support@icrowd.lk\n"
                            + "• **වෙබ් අඩවිය:** www.icrowd.lk")
                    .products(Collections.emptyList())
                    .suggestions(List.of("🎧 Headsets", "🔋 PowerBanks", "🚚 Delivery Info"))
                    .build();
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 6. Strict Greeting (Only if short / purely greeting)
        // ─────────────────────────────────────────────────────────────────────────────
        boolean isGreeting = containsWord(lower, "hi", "hello", "hey", "hola", "ayubowan", "aayubowan", "ආයුබෝවන්", "kohomada", "subha dawasak", "good morning", "good evening");
        if (isGreeting && lower.length() < 30 && !containsWord(lower, "phone", "headset", "powerbank", "charger", "case", "cover", "sony", "anker", "price", "mila", "adu")) {
            return AiChatResponse.builder()
                    .reply("ආයුබෝවන්! 👋 මම iCrowd AI සහායකයා. අප සතුව ඇති Sony & Anker Headsets, High-Capacity PowerBanks, සහ Protective Cases පිළිබඳ විස්තර ලබාගැනීමට මම සූදානම්. ඔබ සොයන්නේ කුමන ආකාරයේ Accessory එකක්ද?")
                    .products(getTopPicks(allProducts, 3))
                    .suggestions(List.of("🎧 Headsets", "🔋 PowerBanks", "🛡️ Phone Cases", "🏷️ Best Deals"))
                    .build();
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 7. Category / Brand / Accessories Search
        // ─────────────────────────────────────────────────────────────────────────────
        String categoryQueried = null;
        String brandQueried = null;

        if (containsWord(lower, "headset", "headsets", "headphone", "headphones", "earphone", "earphones", "airpod", "airpods", "earbud", "earbuds", "audio", "sound", "music", "හෙඩ්සෙට්", "හෙඩ්ෆෝන්", "කන්පෙති")) {
            categoryQueried = "Headset";
        } else if (containsWord(lower, "powerbank", "powerbanks", "power bank", "charger", "chargers", "fast charging", "battery", "140w", "adapter", "පවර්බෑන්ක්", "චාජර්", "බැටරි")) {
            categoryQueried = "PowerBank";
        } else if (containsWord(lower, "case", "cases", "cover", "covers", "magsafe", "protect", "protective", "silicone", "කේස්", "කවර්")) {
            categoryQueried = "Case";
        }

        if (containsWord(lower, "sony", "සෝනි")) {
            brandQueried = "Sony";
        } else if (containsWord(lower, "anker", "ඇන්කර්")) {
            brandQueried = "Anker";
        } else if (containsWord(lower, "apple", "iphone", "ඇපල්")) {
            brandQueried = "Apple";
        } else if (containsWord(lower, "samsung", "සැම්සුන්ග්")) {
            brandQueried = "Samsung";
        }

        final String finalCategory = categoryQueried;
        final String finalBrand = brandQueried;

        List<Product> matched = allProducts.stream()
                .filter(p -> {
                    if (finalCategory != null && (p.getCategory() == null || !p.getCategory().getName().equalsIgnoreCase(finalCategory))) {
                        return false;
                    }
                    if (finalBrand != null && (p.getBrand() == null || !p.getBrand().equalsIgnoreCase(finalBrand))) {
                        return false;
                    }
                    if (finalCategory == null && finalBrand == null) {
                        return matchesProductKeywords(p, lower);
                    }
                    return true;
                })
                .collect(Collectors.toList());

        // Price / Budget Sorting
        boolean isBudgetQuery = budget != null || containsWord(lower, "cheap", "budget", "under", "adu", "labama", "මිල අඩු", "අඩුම", "ලාභම", "best deal", "discount", "offer", "offers");
        if (isBudgetQuery) {
            matched.sort(Comparator.comparing(p -> p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO));
        }

        if (matched.isEmpty()) {
            matched = allProducts.stream()
                    .filter(p -> matchesProductKeywords(p, lower))
                    .collect(Collectors.toList());
        }

        if (matched.isEmpty()) {
            matched = getTopPicks(allProducts, 3);
            return AiChatResponse.builder()
                    .reply("ඔබ සෙවූ වචනයට සෘජුවම ගැළපෙන භාණ්ඩයක් හමු නොවුණත්, අපගේ Store එකේ වැඩිම ඉල්ලුමක් ඇති මෙම Top Accessories බලන්න:")
                    .products(matched)
                    .suggestions(List.of("🎧 Headsets", "🔋 PowerBanks", "🛡️ Phone Cases", "🏷️ Best Deals"))
                    .build();
        }

        List<Product> topResults = matched.stream().limit(4).collect(Collectors.toList());

        String replyMessage;
        if (categoryQueried != null && brandQueried != null) {
            replyMessage = String.format("මෙන්න ඔබ වෙනුවෙන් තෝරාගත් **%s** සන්නාමයේ **%s** නිෂ්පාදන:", brandQueried, categoryQueried);
        } else if (categoryQueried != null) {
            replyMessage = String.format("මෙන්න ඔබ සොයන උසස් තත්ත්වයේ **%s** මාදිලි:", categoryQueried);
        } else if (brandQueried != null) {
            replyMessage = String.format("මෙන්න **%s** සන්නාමයේ අප සතුව ඇති විශේෂිත Accessories:", brandQueried);
        } else if (isBudgetQuery) {
            replyMessage = "මෙන්න අප සතුව ඇති හොඳම මිල ගණන් සහිත (Best Value Deals) Accessories:";
        } else {
            replyMessage = "මෙන්න ඔබගේ සෙවීමට ගැළපෙන හොඳම Accessories:";
        }

        return AiChatResponse.builder()
                .reply(replyMessage)
                .products(topResults)
                .suggestions(List.of("🎧 Headsets", "🔋 PowerBanks", "🛡️ Phone Cases", "🚚 Delivery Info"))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Helper Methods
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Checks if text contains any of the target words as distinct tokens / word boundaries.
     * Prevents false positives like 'thiyana' matching 'hi'.
     */
    private boolean containsWord(String text, String... words) {
        if (text == null || text.isEmpty()) return false;
        for (String word : words) {
            if (word.isEmpty()) continue;
            // If keyword contains Sinhala or special characters, check substring or token match
            if (word.matches(".*[\u0D80-\u0DFF].*")) {
                if (text.contains(word)) return true;
            } else {
                // Word boundary check for English/Singlish
                Pattern p = Pattern.compile("(?i)(?:^|[^a-zA-Z0-9])" + Pattern.quote(word) + "(?:$|[^a-zA-Z0-9])");
                if (p.matcher(text).find()) {
                    return true;
                }
            }
        }
        return false;
    }

    private Double extractBudget(String text) {
        if (text == null) return null;

        // E.g. "50k", "150k", "30 k"
        Pattern kPattern = Pattern.compile("(?i)(\\d+)\\s*k\\b");
        Matcher kMatcher = kPattern.matcher(text);
        if (kMatcher.find()) {
            try {
                return Double.parseDouble(kMatcher.group(1)) * 1000;
            } catch (Exception ignored) {}
        }

        // E.g. "50000", "50000ka", "50000ta", "50000ට", "rs 50000"
        Pattern numPattern = Pattern.compile("(?i)(?:rs\\.?\\s*|රු\\.?\\s*)?(\\d{4,7})(?:\\s*ka|\\s*ta|\\s*ට|\\s*ක)?");
        Matcher numMatcher = numPattern.matcher(text);
        if (numMatcher.find()) {
            try {
                return Double.parseDouble(numMatcher.group(1));
            } catch (Exception ignored) {}
        }
        return null;
    }

    private List<Product> getCuratedAccessories(List<Product> allProducts, Double budget) {
        List<Product> inStock = allProducts.stream()
                .filter(p -> p.getAvailableStock() > 0)
                .collect(Collectors.toList());

        // Pick one PowerBank, one Headset, one Case
        List<Product> curated = new ArrayList<>();
        findFirstOfCategory(inStock, "PowerBank").ifPresent(curated::add);
        findFirstOfCategory(inStock, "Headset").ifPresent(curated::add);
        findFirstOfCategory(inStock, "Case").ifPresent(curated::add);

        if (curated.isEmpty()) {
            return getTopPicks(allProducts, 3);
        }
        return curated;
    }

    private Optional<Product> findFirstOfCategory(List<Product> products, String categoryName) {
        return products.stream()
                .filter(p -> p.getCategory() != null && p.getCategory().getName().equalsIgnoreCase(categoryName))
                .findFirst();
    }

    private boolean matchesProductKeywords(Product p, String query) {
        String name = (p.getName() != null ? p.getName() : "").toLowerCase();
        String desc = (p.getDescription() != null ? p.getDescription() : "").toLowerCase();
        String brand = (p.getBrand() != null ? p.getBrand() : "").toLowerCase();
        String cat = (p.getCategory() != null && p.getCategory().getName() != null ? p.getCategory().getName() : "").toLowerCase();

        String[] tokens = query.split("\\s+");
        for (String token : tokens) {
            if (token.length() >= 3) {
                if (name.contains(token) || desc.contains(token) || brand.contains(token) || cat.contains(token)) {
                    return true;
                }
            }
        }
        return false;
    }

    private List<Product> getTopPicks(List<Product> allProducts, int limit) {
        return allProducts.stream()
                .filter(p -> p.getAvailableStock() > 0)
                .limit(limit)
                .collect(Collectors.toList());
    }
}
