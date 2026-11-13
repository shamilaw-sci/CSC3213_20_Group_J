package com.icrowd_api.features.assistant;

import com.icrowd_api.features.order.ShippingPolicy;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AiChatService {

    public static final int MAX_MESSAGE_LENGTH = 500;
    public static final int RATE_LIMIT_MAX_REQUESTS = 25;
    public static final long RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
    public static final long CACHE_TTL_MS = 60_000; // 1 minute
    public static final int MAX_SESSIONS = 5000;
    public static final long SESSION_EXPIRY_MS = 30 * 60 * 1000L; // 30 minutes

    private final ProductRepository productRepository;
    private final ShippingPolicy shippingPolicy;

    // Rate limiting tracking per session / client ID
    private final Map<String, Deque<Long>> rateLimitStore = new ConcurrentHashMap<>();

    // Bounded conversation memory per session
    private final Map<String, ChatSessionContext> sessionStore = new ConcurrentHashMap<>();

    // In-memory catalog cache to eliminate loading all products on every chat message
    private volatile List<Product> cachedProducts;
    private volatile long lastCacheTimestamp = 0;

    @org.springframework.beans.factory.annotation.Autowired
    public AiChatService(ProductRepository productRepository, ShippingPolicy shippingPolicy) {
        this.productRepository = productRepository;
        this.shippingPolicy = shippingPolicy != null ? shippingPolicy : new ShippingPolicy();
    }

    // Single-arg constructor for test compatibility
    public AiChatService(ProductRepository productRepository) {
        this(productRepository, new ShippingPolicy());
    }

    public AiChatResponse processMessage(AiChatRequest request) {
        String sessionId = request != null && request.getSessionId() != null && !request.getSessionId().isBlank()
                ? request.getSessionId().trim()
                : "anon_" + UUID.randomUUID().toString().substring(0, 8);

        // ── 1. Availability Guardrail: Rate Limiting / Throttling ─────────────────
        if (isRateLimited(sessionId)) {
            return AiChatResponse.builder()
                    .reply("⚠️ **ඉතා කෙටි කාලයක් තුළ පණිවිඩ වැඩි ප්‍රමාණයක් ලැබී ඇත.** කරුණාකර තත්පර කිහිපයක් රැඳී සිට නැවත උත්සාහ කරන්න.\n\n(Too many messages sent. Please wait a moment before sending another message.)")
                    .products(Collections.emptyList())
                    .suggestions(List.of("🎧 Headsets", "🔋 PowerBanks", "🛡️ Phone Cases", "🚚 Delivery Info"))
                    .build();
        }

        String rawMsg = request != null && request.getMessage() != null
                ? request.getMessage().trim()
                : "";

        // ── 2. Availability Guardrail: Message-Length Limit ─────────────────────────
        if (rawMsg.length() > MAX_MESSAGE_LENGTH) {
            return AiChatResponse.builder()
                    .reply(String.format("⚠️ **පණිවිඩය ඉතා දිගුය.** උපරිම අකුරු සීමාව %d කි (ඔබගේ පණිවිඩයේ අකුරු %d ක් ඇත). කරුණාකර වඩාත් සංක්ෂිප්ත ප්‍රශ්නයක් යොමු කරන්න.",
                            MAX_MESSAGE_LENGTH, rawMsg.length()))
                    .products(Collections.emptyList())
                    .suggestions(List.of("🎧 Headsets", "🔋 PowerBanks", "🛡️ Phone Cases", "🚚 Delivery Info"))
                    .build();
        }

        if (rawMsg.isEmpty()) {
            return AiChatResponse.builder()
                    .reply("ආයුබෝවන්! 👋 මම iCrowd AI ස්මාර්ට් සහායකයා. මට ඔබට උදවු කළ හැක්කේ කෙසේද?")
                    .products(Collections.emptyList())
                    .suggestions(List.of("🎧 Headsets", "🔋 PowerBanks", "🛡️ Phone Cases", "🏷️ Best Deals"))
                    .build();
        }

        // Retrieve or initialize conversation session context
        ChatSessionContext session = getOrCreateSession(sessionId);
        session.recordUserQuery(rawMsg);

        String lower = rawMsg.toLowerCase();
        List<Product> allProducts = getCachedActiveProducts();
        Double budget = extractBudget(lower);
        if (budget != null) {
            session.setLastBudget(budget);
        }

        // ── 3. Device Compatibility Check (e.g. Lightning vs USB-C on iPhone 15) ──
        if (isLightningIphone15Incompatible(lower)) {
            List<Product> usbCItems = allProducts.stream()
                    .filter(p -> p.getAvailableStock() != null && p.getAvailableStock() > 0)
                    .filter(p -> {
                        String name = (p.getName() != null ? p.getName() : "").toLowerCase();
                        String desc = (p.getDescription() != null ? p.getDescription() : "").toLowerCase();
                        return (name.contains("usb-c") || desc.contains("usb-c") || name.contains("charger") || desc.contains("fast charger"));
                    })
                    .limit(3)
                    .collect(Collectors.toList());

            session.setLastCategory("PowerBank");
            session.setLastDeviceModel("iPhone 15");
            session.setLastRecommendedProducts(usbCItems);

            return AiChatResponse.builder()
                    .reply("⚠️ **සැලකිය යුතු ගැළපුම් තොරතුරක් (Device Compatibility Note):**\n\n"
                            + "Apple **iPhone 15 / 15 Pro** මාදිලි සඳහා පැරණි **Lightning කේබල් ගැළපෙන්නේ නැත**. iPhone 15 ශ්‍රේණිය සඳහා නව **USB-C (Type-C)** පෝට් එක භාවිතා වේ.\n\n"
                            + "ඔබගේ iPhone 15 දුරකථනයට 100% ගැළපෙන අපගේ Anker & Apple Original **USB-C Fast Chargers සහ Braided Cables** පහතින් තෝරාගන්න:")
                    .products(usbCItems)
                    .suggestions(List.of("🔋 140W Anker Chargers", "🛡️ iPhone 15 Cases", "🚚 Delivery Info"))
                    .build();
        }

        // ── 4. Meaningful Conversation Memory: Stock Availability Follow-up ─────────
        if (isStockAvailabilityInquiry(lower)) {
            if (!session.getLastRecommendedProducts().isEmpty()) {
                List<Product> prevProducts = session.getLastRecommendedProducts();
                StringBuilder sb = new StringBuilder("📦 **ඔබ කලින් විමසූ භාණ්ඩවල වත්මන් තොග තොරතුරු (Stock Status):**\n\n");
                boolean anyInStock = false;

                for (Product p : prevProducts) {
                    int stock = p.getAvailableStock() != null ? p.getAvailableStock() : 0;
                    if (stock > 0) {
                        anyInStock = true;
                        sb.append(String.format("• **%s:** තොග ඇත (%d units available) ✅\n", p.getName(), stock));
                    } else {
                        sb.append(String.format("• **%s:** මේ වන විට තාවකාලිකව අවසන් වී ඇත (Out of Stock) ❌\n", p.getName()));
                    }
                }

                if (anyInStock) {
                    sb.append("\nභාණ්ඩය මිලදී ගැනීම සඳහා දැන්ම Add to Cart කර Checkout වෙත යන්න.");
                } else {
                    sb.append("\nඅලුත් තොග ලැබුණු වහාම දැනුම් දිය හැක.");
                }

                return AiChatResponse.builder()
                        .reply(sb.toString())
                        .products(prevProducts.stream().filter(p -> p.getAvailableStock() != null && p.getAvailableStock() > 0).collect(Collectors.toList()))
                        .suggestions(List.of("💳 Payment Options", "🚚 Delivery Info", "🏷️ Other Deals"))
                        .build();
            }
        }

        // ── 5. Shared Authoritative Policies: Delivery / Shipping FAQs ──────────────
        if (containsWord(lower, "delivery", "shipping", "dawas", "diliwari", "ඩිලිවරි", "ගෙනැවිත්", "එන්න කොච්චර", "කල් යනවද", "ගාස්තු", "fee", "cost")) {
            session.setLastIntent("DELIVERY");
            String deliveryReply = String.format("🚚 **iCrowd Island-wide Delivery තොරතුරු (නිල ප්‍රතිපත්තිය):**\n\n"
                            + "• **Standard Delivery (සාමාන්‍ය බෙදාහැරීම):** රු. %s/= (%s ඇතුළත දිවයිනේ ඕනෑම තැනකට නිවසටම)\n"
                            + "• **Fast / Express Delivery (ක්ෂණික බෙදාහැරීම):** රු. %s/= (%s ඇතුළත කඩිනම් බෙදාහැරීම)\n"
                            + "• **Cash on Delivery (COD):** භාණ්ඩය ලැබුණු පසු මුදල් ගෙවීමේ පහසුකම දිවයින පුරා ඇත.\n"
                            + "• **Live Tracking:** ඇණවුම යැවූ පසු SMS හා Email මගින් Live Tracking අංකයක් ලැබේ.\n"
                            + "*(Checkout හිදී ඔබට කැමති Delivery ක්‍රමය තෝරාගත හැක.)*",
                    ShippingPolicy.STANDARD_DELIVERY_FEE.toPlainString(),
                    ShippingPolicy.STANDARD_DELIVERY_TIMELINE,
                    ShippingPolicy.FAST_DELIVERY_FEE.toPlainString(),
                    ShippingPolicy.FAST_DELIVERY_TIMELINE);

            return AiChatResponse.builder()
                    .reply(deliveryReply)
                    .products(Collections.emptyList())
                    .suggestions(List.of("🛡️ Warranty තොරතුරු", "💳 Payment ක්‍රම", "🎧 Browse Accessories"))
                    .build();
        }

        // ── 6. Shared Authoritative Policies: Warranty & Guarantee FAQs ─────────────
        if (containsWord(lower, "warranty", "guarantee", "waranthi", "වොරන්ටි", "ගැරන්ටි", "වගකීම", "guaranty")) {
            session.setLastIntent("WARRANTY");
            String warrantyReply = String.format("🛡️ **iCrowd Official Warranty & Guarantee සහතිකය:**\n\n"
                            + "• %s\n"
                            + "• මිලදී ගත් දින සිට දින 7ක් ඇතුළත කිසියම් නිෂ්පාදන දෝෂයක් හඳුනාගතහොත් **Instant Replacement** පහසුකම හිමිවේ.\n"
                            + "• Warranty Claim කිරීම සඳහා Invoice එක හෝ Order Reference අංකය පමණක් ප්‍රමාණවත්ය.",
                    ShippingPolicy.WARRANTY_POLICY);

            return AiChatResponse.builder()
                    .reply(warrantyReply)
                    .products(Collections.emptyList())
                    .suggestions(List.of("🚚 Delivery තොරතුරු", "🔋 PowerBanks", "🎧 Headsets"))
                    .build();
        }

        // ── 7. Shared Authoritative Policies: Payment Methods FAQs ──────────────────
        if (containsWord(lower, "payment", "card", "pay", "kramaya", "gewanna", "මුදල් ගෙවීම", "ගෙවීම්", "cod", "koko", "mintpay", "installment")) {
            session.setLastIntent("PAYMENT");
            String paymentReply = String.format("💳 **ගෙවීම් ක්‍රම (Payment Options):**\n\n"
                            + "• **Cash on Delivery (COD):** භාණ්ඩය නිවසට ලැබුණු පසු මුදල් ගෙවන්න.\n"
                            + "• **Credit / Debit Cards:** Visa & MasterCard මගින් 100%% සුරක්ෂිතව Online ගෙවන්න.\n"
                            + "• **Bank Transfer:** සෘජු බැංකු තැන්පතු මගින් ගෙවීම් කිරීමේ හැකියාව.\n"
                            + "• %s",
                    ShippingPolicy.PAYMENT_POLICY);

            return AiChatResponse.builder()
                    .reply(paymentReply)
                    .products(Collections.emptyList())
                    .suggestions(List.of("🎧 Headsets", "🔋 PowerBanks", "🏷️ Best Deals"))
                    .build();
        }

        // ── 8. Store Contact & Location FAQs ─────────────────────────────────────────
        if (containsWord(lower, "contact", "address", "call", "hotline", "office", "shop eka koheda", "store location", "ලිපිනය", "දුරකථන", "තැන කොහෙද", "location")) {
            session.setLastIntent("CONTACT");
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

        // ── 9. Ambiguous Request Handling (Clarifying Guidance) ─────────────────────
        if (isAmbiguousRequest(lower)) {
            return AiChatResponse.builder()
                    .reply("ඔබට වඩාත් නිවැරදි තොරතුරු ලබාදීමට කරුණාකර ඔබ සොයන Category එක හෝ Device මාදිලිය සඳහන් කරන්න:\n\n"
                            + "1. 🎧 **Headsets / Earbuds** (Sony, Apple, Anker)\n"
                            + "2. 🔋 **PowerBanks & Fast Chargers** (200W, 140W, 20000mAh)\n"
                            + "3. 🛡️ **Phone Cases & MagSafe Covers** (iPhone 15, Samsung S24)\n"
                            + "4. 🚚 **Delivery හෝ Warranty විස්තර**")
                    .products(getTopPicks(allProducts, 3))
                    .suggestions(List.of("🎧 Headsets", "🔋 PowerBanks", "🛡️ Phone Cases", "🚚 Delivery Info"))
                    .build();
        }

        // ── 10. Greetings ───────────────────────────────────────────────────────────
        boolean isGreeting = containsWord(lower, "hi", "hello", "hey", "hola", "ayubowan", "aayubowan", "ආයුබෝවන්", "kohomada", "machan", "subha dawasak", "good morning", "good evening");
        if (isGreeting && lower.length() < 30 && !containsWord(lower, "phone", "headset", "powerbank", "charger", "case", "cover", "sony", "anker", "price", "mila", "adu")) {
            return AiChatResponse.builder()
                    .reply("ආයුබෝවන්! 👋 මම iCrowd AI සහායකයා. අප සතුව ඇති Sony & Anker Headsets, High-Capacity PowerBanks, සහ Protective Cases පිළිබඳ විස්තර ලබාගැනීමට මම සූදානම්. ඔබ සොයන්නේ කුමන ආකාරයේ Accessory එකක්ද?")
                    .products(getTopPicks(allProducts, 3))
                    .suggestions(List.of("🎧 Headsets", "🔋 PowerBanks", "🛡️ Phone Cases", "🏷️ Best Deals"))
                    .build();
        }

        // ── 11. Structured Intent & Entity Parsing with Conversation Memory ─────────
        String deviceModel = extractDeviceModel(lower);
        if (deviceModel != null) {
            session.setLastDeviceModel(deviceModel);
        } else {
            deviceModel = session.getLastDeviceModel();
        }

        String categoryQueried = extractCategory(lower);
        if (categoryQueried != null) {
            session.setLastCategory(categoryQueried);
        } else if (budget != null || containsWord(lower, "adu", "cheap", "best", "deal", "pennanna", "show")) {
            // Carry over category from session history if this is a follow-up query
            categoryQueried = session.getLastCategory();
        }

        String brandQueried = extractBrand(lower);
        if (brandQueried != null) {
            session.setLastBrand(brandQueried);
        } else if (categoryQueried == null && session.getLastBrand() != null) {
            brandQueried = session.getLastBrand();
        }

        // Special handling for Phone vs Accessories
        boolean isPhoneInquiry = containsWord(lower, "phone", "phones", "smart phone", "smartphone", "mobile", "ෆෝන්", "දුරකථන")
                && (categoryQueried == null || "Smartphone".equalsIgnoreCase(categoryQueried));

        if (isPhoneInquiry) {
            boolean hasStorePhoneInBudget = budget != null && allProducts.stream()
                    .anyMatch(p -> p.getCategory() != null && "Smartphone".equalsIgnoreCase(p.getCategory().getName())
                            && p.getPrice() != null && p.getPrice().doubleValue() <= budget);

            if (!hasStorePhoneInBudget) {
                return handlePhoneInquiry(brandQueried, budget, allProducts, session);
            }
        }

        final String finalCategory = categoryQueried;
        final String finalBrand = brandQueried;
        final String finalDevice = deviceModel;
        final Double finalBudget = budget;

        // Structured filtering: Category + Brand + Device Compatibility + In-Stock Priority
        List<Product> matched = allProducts.stream()
                .filter(p -> {
                    // Category filter
                    if (finalCategory != null && (p.getCategory() == null || !p.getCategory().getName().equalsIgnoreCase(finalCategory))) {
                        return false;
                    }
                    // Brand filter
                    if (finalBrand != null && (p.getBrand() == null || !p.getBrand().equalsIgnoreCase(finalBrand))) {
                        return false;
                    }
                    // Budget filter
                    if (finalBudget != null && p.getPrice() != null && p.getPrice().doubleValue() > finalBudget) {
                        return false;
                    }
                    // Device model keyword filter if specified
                    if (finalDevice != null && finalCategory != null && finalCategory.equalsIgnoreCase("Case")) {
                        String name = (p.getName() != null ? p.getName() : "").toLowerCase();
                        String desc = (p.getDescription() != null ? p.getDescription() : "").toLowerCase();
                        if (!name.contains(finalDevice.toLowerCase()) && !desc.contains(finalDevice.toLowerCase())) {
                            return false;
                        }
                    }
                    // Fallback keyword matching if no category/brand
                    if (finalCategory == null && finalBrand == null && finalBudget == null) {
                        return matchesProductKeywords(p, lower);
                    }
                    return true;
                })
                .collect(Collectors.toList());

        // Sort: In-stock first, then price/popularity
        matched.sort((a, b) -> {
            int aStock = a.getAvailableStock() != null ? a.getAvailableStock() : 0;
            int bStock = b.getAvailableStock() != null ? b.getAvailableStock() : 0;
            if (aStock > 0 && bStock == 0) return -1;
            if (aStock == 0 && bStock > 0) return 1;
            BigDecimal aPrice = a.getPrice() != null ? a.getPrice() : BigDecimal.ZERO;
            BigDecimal bPrice = b.getPrice() != null ? b.getPrice() : BigDecimal.ZERO;
            return aPrice.compareTo(bPrice);
        });

        if (matched.isEmpty()) {
            // If budget was too low or specific query yielded 0, suggest closest alternatives
            List<Product> fallbacks = allProducts.stream()
                    .filter(p -> p.getAvailableStock() != null && p.getAvailableStock() > 0)
                    .filter(p -> finalCategory == null || (p.getCategory() != null && p.getCategory().getName().equalsIgnoreCase(finalCategory)))
                    .limit(3)
                    .collect(Collectors.toList());

            session.setLastRecommendedProducts(fallbacks);

            String noMatchReply = finalBudget != null
                    ? String.format("රු. %,.0f ට අඩු ඔබ සෙවූ භාණ්ඩ මේ මොහොතේ හමු නොවීය. අප සතුව ඇති හොඳම මිල ගණන් සහිත විකල්ප භාණ්ඩ මෙන්න:", finalBudget)
                    : "ඔබ සෙවූ වචනයට සෘජුවම ගැළපෙන භාණ්ඩයක් හමු නොවුණත්, අපගේ Store එකේ වැඩිම ඉල්ලුමක් ඇති මෙම Top Accessories බලන්න:";

            return AiChatResponse.builder()
                    .reply(noMatchReply)
                    .products(fallbacks.isEmpty() ? getTopPicks(allProducts, 3) : fallbacks)
                    .suggestions(List.of("🎧 Headsets", "🔋 PowerBanks", "🛡️ Phone Cases", "🏷️ Best Deals"))
                    .build();
        }

        List<Product> topResults = matched.stream().limit(4).collect(Collectors.toList());
        session.setLastRecommendedProducts(topResults);

        String replyMessage;
        if (deviceModel != null && categoryQueried != null) {
            replyMessage = String.format("මෙන්න **%s** සඳහා ගැළපෙන හොඳම **%s** මාදිලි:", deviceModel.toUpperCase(), categoryQueried);
        } else if (categoryQueried != null && brandQueried != null) {
            replyMessage = String.format("මෙන්න ඔබ වෙනුවෙන් තෝරාගත් **%s** සන්නාමයේ **%s** නිෂ්පාදන:", brandQueried, categoryQueried);
        } else if (categoryQueried != null) {
            replyMessage = String.format("මෙන්න ඔබ සොයන උසස් තත්ත්වයේ **%s** මාදිලි:", categoryQueried);
        } else if (brandQueried != null) {
            replyMessage = String.format("මෙන්න **%s** සන්නාමයේ අප සතුව ඇති විශේෂිත Accessories:", brandQueried);
        } else if (budget != null) {
            replyMessage = String.format("මෙන්න රු. %,.0f සීමාවේ අප සතුව ඇති හොඳම Deals:", budget);
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
    // Helper & Logic Methods
    // ─────────────────────────────────────────────────────────────────────────────

    private boolean isRateLimited(String sessionId) {
        long now = System.currentTimeMillis();
        Deque<Long> timestamps = rateLimitStore.computeIfAbsent(sessionId, k -> new ConcurrentLinkedDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && (now - timestamps.peekFirst()) > RATE_LIMIT_WINDOW_MS) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= RATE_LIMIT_MAX_REQUESTS) {
                return true;
            }
            timestamps.addLast(now);
            return false;
        }
    }

    private ChatSessionContext getOrCreateSession(String sessionId) {
        long now = System.currentTimeMillis();
        ChatSessionContext context = sessionStore.computeIfAbsent(sessionId, id -> new ChatSessionContext(id, now));
        context.setLastAccessTime(now);

        // Evict stale sessions if capacity exceeds MAX_SESSIONS
        if (sessionStore.size() > MAX_SESSIONS) {
            sessionStore.entrySet().removeIf(e -> (now - e.getValue().getLastAccessTime()) > SESSION_EXPIRY_MS);
        }
        return context;
    }

    private List<Product> getCachedActiveProducts() {
        long now = System.currentTimeMillis();
        if (cachedProducts == null || (now - lastCacheTimestamp) > CACHE_TTL_MS) {
            synchronized (this) {
                if (cachedProducts == null || (now - lastCacheTimestamp) > CACHE_TTL_MS) {
                    cachedProducts = productRepository.findAllActiveProductsList();
                    lastCacheTimestamp = now;
                }
            }
        }
        return cachedProducts;
    }

    public void refreshProductCache() {
        synchronized (this) {
            cachedProducts = productRepository.findAllActiveProductsList();
            lastCacheTimestamp = System.currentTimeMillis();
        }
    }

    private boolean isLightningIphone15Incompatible(String lower) {
        boolean mentionsLightning = containsWord(lower, "lightning", "ලයිට්නින්ග්", "ලයිට්නින්");
        boolean mentionsIphone15 = lower.contains("iphone 15") || lower.contains("15 pro") || lower.contains("15 plus");
        return mentionsLightning && mentionsIphone15;
    }

    private boolean isStockAvailabilityInquiry(String lower) {
        return containsWord(lower, "stock", "stok", "available", "badu thiyenawada", "thiyenawada", "ස්ටොක්", "තියෙනවද", "තොග තියෙනවද", "in stock");
    }

    private boolean isAmbiguousRequest(String lower) {
        return lower.equals("help") || lower.equals("help me") || lower.equals("details please") ||
                lower.equals("mata one") || lower.equals("hoda ekak one") || lower.equals("something") ||
                lower.equals("koheda thiyenne") || lower.equals("info");
    }

    private String extractCategory(String lower) {
        if (containsWord(lower, "headset", "headsets", "headphone", "headphones", "earphone", "earphones", "airpod", "airpods", "earbud", "earbuds", "audio", "sound", "music", "හෙඩ්සෙට්", "හෙඩ්ෆෝන්", "කන්පෙති")) {
            return "Headset";
        }
        if (containsWord(lower, "powerbank", "powerbanks", "power bank", "power banks", "power-bank", "power-banks", "charger", "chargers", "fast charging", "battery", "batteries", "140w", "200w", "adapter", "adapters", "පවර්බෑන්ක්", "චාජර්", "බැටරි")) {
            return "PowerBank";
        }
        if (containsWord(lower, "case", "cases", "cover", "covers", "magsafe", "protect", "protective", "silicone", "කේස්", "කවර්")) {
            return "Case";
        }
        if (containsWord(lower, "phone", "phones", "smartphone", "smartphones", "දුරකථන", "ෆෝන්")) {
            return "Smartphone";
        }
        return null;
    }

    private String extractBrand(String lower) {
        if (containsWord(lower, "sony", "සෝනි")) return "Sony";
        if (containsWord(lower, "anker", "ඇන්කර්")) return "Anker";
        if (containsWord(lower, "apple", "iphone", "ඇපල්")) return "Apple";
        if (containsWord(lower, "samsung", "සැම්සුන්ග්")) return "Samsung";
        if (containsWord(lower, "xiaomi", "redmi", "ශිරෝමි")) return "Xiaomi";
        return null;
    }

    private String extractDeviceModel(String lower) {
        if (lower.contains("iphone 15 pro max")) return "iphone 15 pro max";
        if (lower.contains("iphone 15 pro")) return "iphone 15 pro";
        if (lower.contains("iphone 15 plus")) return "iphone 15 plus";
        if (lower.contains("iphone 15")) return "iphone 15";
        if (lower.contains("iphone 14")) return "iphone 14";
        if (lower.contains("iphone 13")) return "iphone 13";
        if (lower.contains("s24 ultra") || lower.contains("galaxy s24")) return "samsung s24";
        if (lower.contains("pixel 8")) return "pixel 8";
        if (lower.contains("redmi note 13")) return "redmi note 13";
        return null;
    }

    private AiChatResponse handlePhoneInquiry(String brand, Double budget, List<Product> allProducts, ChatSessionContext session) {
        String reply;
        List<String> suggestions;

        if ("Apple".equalsIgnoreCase(brand)) {
            reply = "🍎 **Apple iPhone මාදිලි (iCrowd Official Lineup):**\n\n"
                    + "1. **iPhone 16 Pro Max / 16 Pro:** නවතම A18 Pro Bionic Chip, Grade 5 Titanium නිමාව, Action Button & Camera Control. (iCrowd මිල: රු. 389,000/=) ✅ තොග ඇත\n"
                    + "2. **iPhone 15 / 15 Plus:** Dynamic Island, USB-C Port, 48MP Main Camera, සහ A16 Bionic. (iCrowd මිල: රු. 249,000/=) ✅ තොග ඇත\n"
                    + "3. **iPhone 14 / 13 Series:** විශිෂ්ට Battery Life සහ Super Retina XDR OLED Display සහිත Budget Flagship විකල්ප.\n"
                    + "4. **iPhone SE (3rd Gen):** A15 Bionic සහිත Compact ආර්ථික iPhone මාදිලිය.\n\n"
                    + "⚡ **Apple Original Accessories අප සතුව ඇත:**\n"
                    + "• Apple MagSafe Silicone Cases (රු. 14,500/=)\n"
                    + "• Apple Original USB-C Fast Chargers & Cables\n"
                    + "• Apple AirPods Max Wireless Headset (රු. 195,000/=)\n\n"
                    + "සියලුම iPhone සඳහා වසරක Official Apple Warranty සහ දිවයින පුරා නොමිලේ VIP Insured Delivery හිමිවේ.";
            suggestions = List.of("📱 iPhone 16 Pro Max", "📱 iPhone 15", "🛡️ MagSafe Cases", "🚚 Delivery Info");
        } else if ("Samsung".equalsIgnoreCase(brand)) {
            reply = "📱 **Samsung Galaxy Smartphone මාදිලි (iCrowd Lineup):**\n\n"
                    + "1. **Galaxy S24 Ultra (Flagship):** Galaxy AI, 200MP Camera, Titanium Frame, S-Pen Support, Snapdragon 8 Gen 3. (iCrowd මිල: රු. 369,900/=) ✅ තොග ඇත\n"
                    + "2. **Galaxy A55 / A35 5G:** Super AMOLED 120Hz Display, IP67 ජල ප්‍රතිරෝධීතාව සහිත Mid-Range Kings.\n"
                    + "3. **Galaxy A05s / A05:** රු. 40,000 - 55,000 සීමාවේ විශ්වාසනීය Budget Smartphones.\n\n"
                    + "⚡ Samsung සඳහා Fast Chargers, Cases සහ Screen Protectors අප සතුව ඇත.";
            suggestions = List.of("📱 Galaxy S24 Ultra", "🔋 Fast Chargers", "🛡️ Phone Cases", "🚚 Delivery Info");
        } else if ("Xiaomi".equalsIgnoreCase(brand)) {
            reply = "📱 **Xiaomi / Redmi Smartphone මාදිලි (iCrowd Lineup):**\n\n"
                    + "1. **Xiaomi 14 Ultra (Flagship):** Leica Quad Camera, 1-inch sensor, 90W HyperCharge. (iCrowd මිල: රු. 349,000/=) ✅ තොග ඇත\n"
                    + "2. **Redmi Note 13 Pro+:** 200MP Camera, AMOLED 120Hz, 120W HyperCharge.\n"
                    + "3. **Redmi 13C / Redmi 12:** රු. 45,000 - 55,000 සීමාවේ හොඳම Budget Smartphones.\n\n"
                    + "⚡ Xiaomi සඳහා Fast Chargers සහ Protective Accessories අප සතුව ඇත.";
            suggestions = List.of("📱 Xiaomi 14 Ultra", "🔋 Fast Chargers", "🛡️ Phone Cases", "🚚 Delivery Info");
        } else if (budget != null && budget <= 65000) {
            reply = "📱 **රු. " + String.format("%,.0f", budget) + " සීමාවේ ලංකාවේ මිලදී ගත හැකි හොඳම Phone Brands & Models:**\n\n"
                    + "1. **Xiaomi / Redmi:** Redmi 13C, Redmi 12 (5000mAh Battery & 90Hz Display)\n"
                    + "2. **Samsung:** Galaxy A05s, Galaxy A05 (Official Brand Trust & Regular Updates)\n"
                    + "3. **Vivo / Oppo:** Vivo Y17s, Oppo A18 (Slim Design & Fast Camera)\n"
                    + "4. **Realme:** Realme C53 (Fast 33W Charging)\n\n"
                    + "⚡ **iCrowd Store එකෙන් ඔබට ලැබෙන වාසිය:**\n"
                    + "අපගේ Store එක මගින් මෙම සියලුම දුරකථන සඳහා අවශ්‍ය **Original Fast Chargers, High-Capacity PowerBanks, සහ Protective Cases** නිල වගකීමක් සහිතව ලබාගත හැක.\n\n"
                    + "ඔබගේ දුරකථනයට ගැළපෙන හොඳම Accessories පහතින් තෝරාගන්න:";
            suggestions = List.of("🔋 Fast Chargers", "🔋 PowerBanks", "🎧 Earbuds / Headsets", "🛡️ Phone Cases");
        } else if (budget != null && budget > 65000 && budget <= 160000) {
            reply = "📱 **රු. " + String.format("%,.0f", budget) + " සීමාවේ Mid-Range Flagship Phone Brands:**\n\n"
                    + "1. **Samsung:** Galaxy A35 5G / Galaxy A55 5G (Super AMOLED, Water Resistance IP67)\n"
                    + "2. **Xiaomi:** Redmi Note 13 Pro+ / Poco X6 Pro (120W HyperCharge, 200MP Camera)\n"
                    + "3. **Google:** Pixel 7a / Pixel 8a (Best Computational Photography & Stock Android)\n\n"
                    + "🛡️ මෙම වටිනා දුරකථන ආරක්ෂා කරගැනීමට අවශ්‍ය High-End Accessories අප සතුව ඇත:";
            suggestions = List.of("🔋 Fast Chargers", "🛡️ Heavy-Duty Cases", "🎧 Noise Cancelling Headsets");
        } else {
            reply = "📱 **ලංකාවේ වඩාත්ම ජනප්‍රිය Phone Brands සහ Flagship Models:**\n\n"
                    + "• **Apple:** iPhone 16 Pro Max / 15 / 14 Series (iOS Premium Ecosystem)\n"
                    + "• **Samsung:** Galaxy S24 Ultra / Galaxy A Series (AMOLED Display & AI Features)\n"
                    + "• **Xiaomi / Redmi:** 14 Ultra / Note 13 Series (Best Value for Money & Fast Charging)\n"
                    + "• **OnePlus:** OnePlus 12 5G (Hasselblad Camera & 100W Fast Charging)\n\n"
                    + "⚡ **iCrowd Store විශේෂත්වය:**\n"
                    + "මෙම සියලුම Flagship හා Budget දුරකථන සඳහා අවශ්‍ය **Apple / Anker / Sony Original Accessories** අප සතුව ඇත. පහත නිර්දේශිත භාණ්ඩ බලන්න:";
            suggestions = List.of("📱 iPhone 16 Pro Max", "📱 Galaxy S24 Ultra", "🎧 Sony Headsets", "🔋 Anker Chargers");
        }

        List<Product> brandMatches = new ArrayList<>();
        if (brand != null && !brand.isEmpty()) {
            brandMatches = allProducts.stream()
                    .filter(p -> p.getAvailableStock() != null && p.getAvailableStock() > 0)
                    .filter(p -> p.getBrand() != null && p.getBrand().equalsIgnoreCase(brand))
                    .limit(3)
                    .collect(Collectors.toList());
        }
        List<Product> recommendedProducts = !brandMatches.isEmpty() ? brandMatches : getCuratedAccessories(allProducts, budget);
        session.setLastRecommendedProducts(recommendedProducts);

        return AiChatResponse.builder()
                .reply(reply)
                .products(recommendedProducts)
                .suggestions(suggestions)
                .build();
    }

    private boolean containsWord(String text, String... words) {
        if (text == null || text.isEmpty()) return false;
        for (String word : words) {
            if (word.isEmpty()) continue;
            if (word.matches(".*[\u0D80-\u0DFF].*")) {
                if (text.contains(word)) return true;
            } else {
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
        String clean = text.replace(",", "");

        Pattern kPattern = Pattern.compile("(?i)(\\d+)\\s*k\\b");
        Matcher kMatcher = kPattern.matcher(clean);
        if (kMatcher.find()) {
            try {
                return Double.parseDouble(kMatcher.group(1)) * 1000;
            } catch (Exception ignored) {}
        }

        Pattern numPattern = Pattern.compile("(?i)(?:rs\\.?\\s*|රු\\.?\\s*)?(\\d{4,7})(?:\\s*ka|\\s*ta|\\s*kata|\\s*ට|\\s*ක)?");
        Matcher numMatcher = numPattern.matcher(clean);
        if (numMatcher.find()) {
            try {
                return Double.parseDouble(numMatcher.group(1));
            } catch (Exception ignored) {}
        }
        return null;
    }

    private List<Product> getCuratedAccessories(List<Product> allProducts, Double budget) {
        if (allProducts == null) return Collections.emptyList();

        List<Product> inStock = allProducts.stream()
                .filter(p -> p.getAvailableStock() != null && p.getAvailableStock() > 0)
                .collect(Collectors.toList());

        List<Product> candidatePool = inStock;
        if (budget != null && budget > 0) {
            List<Product> underBudget = inStock.stream()
                    .filter(p -> p.getPrice() != null && p.getPrice().doubleValue() <= budget)
                    .collect(Collectors.toList());
            if (!underBudget.isEmpty()) {
                candidatePool = underBudget;
            }
        }

        List<Product> curated = new ArrayList<>();
        findFirstOfCategory(candidatePool, "PowerBank").ifPresent(curated::add);
        findFirstOfCategory(candidatePool, "Case").ifPresent(curated::add);
        findFirstOfCategory(candidatePool, "Headset").ifPresent(curated::add);

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
        if (allProducts == null) return Collections.emptyList();
        return allProducts.stream()
                .filter(p -> p.getAvailableStock() != null && p.getAvailableStock() > 0)
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Getter
    @Setter
    public static class ChatSessionContext {
        private final String sessionId;
        private long lastAccessTime;
        private String lastCategory;
        private String lastBrand;
        private String lastDeviceModel;
        private Double lastBudget;
        private List<Product> lastRecommendedProducts = new ArrayList<>();
        private String lastIntent;
        private final Deque<String> recentQueries = new ArrayDeque<>();

        public ChatSessionContext(String sessionId, long now) {
            this.sessionId = sessionId;
            this.lastAccessTime = now;
        }

        public void recordUserQuery(String query) {
            if (recentQueries.size() >= 10) {
                recentQueries.pollFirst();
            }
            recentQueries.addLast(query);
            this.lastAccessTime = System.currentTimeMillis();
        }
    }
}
