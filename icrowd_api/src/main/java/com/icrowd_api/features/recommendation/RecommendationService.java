package com.icrowd_api.features.recommendation;

import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.auth.UserRepository;
import com.icrowd_api.features.cart.CartRepository;
import com.icrowd_api.features.order.OrderItemRepository;
import com.icrowd_api.features.order.OrderRepository;
import com.icrowd_api.features.order.OrderStatus;
import com.icrowd_api.features.order.PaymentStatus;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import com.icrowd_api.features.product.ProductView;
import com.icrowd_api.features.product.ProductViewRepository;
import com.icrowd_api.features.recommendation.dto.FrequentlyBoughtTogetherResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private static final Set<OrderStatus> QUALIFYING_ORDER_STATUSES = Set.of(
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED
    );

    private final ProductRepository productRepository;
    private final ProductViewRepository productViewRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;

    @Autowired
    public RecommendationService(ProductRepository productRepository,
                                 ProductViewRepository productViewRepository,
                                 OrderRepository orderRepository,
                                 OrderItemRepository orderItemRepository,
                                 UserRepository userRepository,
                                 CartRepository cartRepository) {
        this.productRepository = productRepository;
        this.productViewRepository = productViewRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
    }

    // ── 1. Asynchronous/Transactional Interaction Tracking ─────────────────────────
    @Transactional
    public void trackProductView(Long productId, String userEmail, String sessionId, String interactionType) {
        if (productId == null) return;
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return;

        User user = null;
        if (userEmail != null && !userEmail.isBlank()) {
            user = userRepository.findByEmail(userEmail).orElse(null);
        }

        ProductView pv = ProductView.builder()
                .product(product)
                .user(user)
                .sessionId(sessionId)
                .interactionType(interactionType != null ? interactionType.toUpperCase() : "VIEW")
                .build();
        productViewRepository.save(pv);
    }

    // ── 2. Hybrid Personalized Recommendations ──────────────────────────────────
    @Transactional(readOnly = true)
    public List<Product> getPersonalizedRecommendations(String userEmail, String sessionId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 30));
        Set<Long> preferredCategoryIds = new LinkedHashSet<>();
        Set<String> preferredBrands = new LinkedHashSet<>();
        Set<Long> excludeProductIds = new HashSet<>();

        // A. Extract user purchase and cart affinity if authenticated
        if (userEmail != null && !userEmail.isBlank()) {
            userRepository.findByEmail(userEmail).ifPresent(user -> {
                preferredCategoryIds.addAll(orderRepository.findUserPurchasedCategoryIds(user.getId()));
                if (cartRepository != null) {
                    preferredCategoryIds.addAll(cartRepository.findUserCartCategoryIds(user.getId()));
                }

                List<ProductView> views = productViewRepository.findRecentByUserId(user.getId(), PageRequest.of(0, 20));
                for (ProductView pv : views) {
                    if (pv.getProduct() != null) {
                        if (pv.getProduct().getCategory() != null) {
                            preferredCategoryIds.add(pv.getProduct().getCategory().getId());
                        }
                        if (pv.getProduct().getBrand() != null) {
                            preferredBrands.add(pv.getProduct().getBrand().toLowerCase());
                        }
                    }
                }
            });
        } else if (sessionId != null && !sessionId.isBlank()) {
            // Guest session view affinity
            List<ProductView> views = productViewRepository.findRecentBySessionId(sessionId, PageRequest.of(0, 15));
            for (ProductView pv : views) {
                if (pv.getProduct() != null) {
                    if (pv.getProduct().getCategory() != null) {
                        preferredCategoryIds.add(pv.getProduct().getCategory().getId());
                    }
                    if (pv.getProduct().getBrand() != null) {
                        preferredBrands.add(pv.getProduct().getBrand().toLowerCase());
                    }
                }
            }
        }

        List<Product> allActive = productRepository.findAllActiveProductsList();
        if (allActive.isEmpty()) return List.of();

        // If no user signals are present (Cold Start), return trending products
        if (preferredCategoryIds.isEmpty() && preferredBrands.isEmpty()) {
            return getTrendingProducts(30, safeLimit);
        }

        // Score candidates based on category preference, brand preference, rating, and stock
        Map<Product, Double> candidateScores = new HashMap<>();
        for (Product p : allActive) {
            if (excludeProductIds.contains(p.getId())) continue;

            double score = 0.0;
            if (p.getCategory() != null && preferredCategoryIds.contains(p.getCategory().getId())) {
                score += 3.5;
            }
            if (p.getBrand() != null && preferredBrands.contains(p.getBrand().toLowerCase())) {
                score += 2.5;
            }
            if (p.getAverageRating() != null) {
                score += p.getAverageRating() * 0.4;
            }
            if (p.getAvailableStock() != null && p.getAvailableStock() > 0) {
                score += 1.0;
            }

            if (score > 1.0) {
                candidateScores.put(p, score);
            }
        }

        List<Product> ranked = candidateScores.entrySet().stream()
                .sorted(Map.Entry.<Product, Double>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .limit(safeLimit)
                .collect(Collectors.toList());

        // Supplement with trending if fewer than requested
        if (ranked.size() < safeLimit) {
            List<Product> trending = getTrendingProducts(30, safeLimit);
            for (Product t : trending) {
                if (!ranked.contains(t)) {
                    ranked.add(t);
                }
                if (ranked.size() >= safeLimit) break;
            }
        }

        return ranked;
    }

    // ── 3. Multi-Attribute Content-Based Similar Products ────────────────────────
    @Transactional(readOnly = true)
    public List<Product> getSimilarProducts(Long productId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));
        Product target = productRepository.findByIdAndIsActiveTrue(productId)
                .orElse(null);
        if (target == null) return List.of();

        List<Product> allCandidates = productRepository.findAllActiveProductsList();
        Map<Product, Double> similarityScores = new HashMap<>();

        Set<String> targetTags = target.getTags() != null
                ? target.getTags().stream().map(String::toLowerCase).collect(Collectors.toSet())
                : Set.of();

        BigDecimal targetPrice = target.getPrice() != null ? target.getPrice() : BigDecimal.ZERO;

        for (Product candidate : allCandidates) {
            if (candidate.getId().equals(target.getId())) continue;

            double score = 0.0;

            // A. Category Similarity (Weight: 0.35)
            if (target.getCategory() != null && candidate.getCategory() != null &&
                    target.getCategory().getId().equals(candidate.getCategory().getId())) {
                score += 0.35;
            }

            // B. Brand Similarity (Weight: 0.25)
            if (target.getBrand() != null && candidate.getBrand() != null &&
                    target.getBrand().equalsIgnoreCase(candidate.getBrand())) {
                score += 0.25;
            }

            // C. Tag Jaccard Similarity (Weight: 0.25)
            Set<String> candidateTags = candidate.getTags() != null
                    ? candidate.getTags().stream().map(String::toLowerCase).collect(Collectors.toSet())
                    : Set.of();

            if (!targetTags.isEmpty() && !candidateTags.isEmpty()) {
                Set<String> intersection = new HashSet<>(targetTags);
                intersection.retainAll(candidateTags);
                Set<String> union = new HashSet<>(targetTags);
                union.addAll(candidateTags);

                double jaccard = union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
                score += 0.25 * jaccard;
            }

            // D. Price Proximity (Weight: 0.15)
            BigDecimal candPrice = candidate.getPrice() != null ? candidate.getPrice() : BigDecimal.ZERO;
            if (targetPrice.compareTo(BigDecimal.ZERO) > 0 && candPrice.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal maxPrice = targetPrice.max(candPrice);
                BigDecimal diff = targetPrice.subtract(candPrice).abs();
                double proximity = 1.0 - (diff.doubleValue() / maxPrice.doubleValue());
                score += 0.15 * Math.max(0.0, proximity);
            }

            similarityScores.put(candidate, score);
        }

        return similarityScores.entrySet().stream()
                .sorted(Map.Entry.<Product, Double>comparingByValue().reversed())
                .limit(safeLimit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    // ── 4. Frequently Bought Together (FBT) ────────────────────────────────────────
    @Transactional(readOnly = true)
    public FrequentlyBoughtTogetherResponse getFrequentlyBoughtTogether(Long productId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 4));
        Product target = productRepository.findByIdAndIsActiveTrue(productId).orElse(null);
        if (target == null) {
            return FrequentlyBoughtTogetherResponse.builder()
                    .bundledProducts(List.of())
                    .regularTotal(BigDecimal.ZERO)
                    .bundleTotal(BigDecimal.ZERO)
                    .savings(BigDecimal.ZERO)
                    .discountPercentage(0)
                    .isEmpiricalBasket(false)
                    .build();
        }

        List<Product> bundled = new ArrayList<>();
        boolean isEmpirical = false;

        // Step 1: Query historical co-occurrence from order items
        List<Object[]> pairs = orderItemRepository.findFrequentlyBoughtTogetherProductIds(
                productId, QUALIFYING_ORDER_STATUSES, PageRequest.of(0, safeLimit)
        );

        if (!pairs.isEmpty()) {
            for (Object[] pair : pairs) {
                Long partnerId = (Long) pair[0];
                productRepository.findByIdAndIsActiveTrue(partnerId).ifPresent(p -> {
                    if (p.getAvailableStock() != null && p.getAvailableStock() > 0) {
                        bundled.add(p);
                    }
                });
                if (bundled.size() >= safeLimit) break;
            }
            if (!bundled.isEmpty()) {
                isEmpirical = true;
            }
        }

        // Step 2: Complementary Fallback (Cross-category accessory pairing)
        if (bundled.isEmpty()) {
            String targetCat = target.getCategory() != null ? target.getCategory().getName() : "";
            List<String> complementaryCats = getComplementaryCategories(targetCat);

            List<Product> candidates = productRepository.findAllActiveProductsList().stream()
                    .filter(p -> !p.getId().equals(target.getId()))
                    .filter(p -> p.getAvailableStock() != null && p.getAvailableStock() > 0)
                    .filter(p -> p.getCategory() != null && complementaryCats.contains(p.getCategory().getName()))
                    .sorted((p1, p2) -> Double.compare(
                            p2.getAverageRating() != null ? p2.getAverageRating() : 0.0,
                            p1.getAverageRating() != null ? p1.getAverageRating() : 0.0
                    ))
                    .limit(safeLimit)
                    .collect(Collectors.toList());

            bundled.addAll(candidates);
        }

        // Calculate Pricing with 8% bundle savings
        BigDecimal regularTotal = target.getPrice() != null ? target.getPrice() : BigDecimal.ZERO;
        for (Product b : bundled) {
            if (b.getPrice() != null) {
                regularTotal = regularTotal.add(b.getPrice());
            }
        }

        int discountPercent = bundled.isEmpty() ? 0 : 8;
        BigDecimal bundleTotal = regularTotal.multiply(BigDecimal.valueOf(100 - discountPercent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal savings = regularTotal.subtract(bundleTotal);

        return FrequentlyBoughtTogetherResponse.builder()
                .targetProduct(target)
                .bundledProducts(bundled)
                .regularTotal(regularTotal)
                .bundleTotal(bundleTotal)
                .savings(savings)
                .discountPercentage(discountPercent)
                .isEmpiricalBasket(isEmpirical)
                .build();
    }

    private List<String> getComplementaryCategories(String categoryName) {
        if ("Smartphone".equalsIgnoreCase(categoryName)) {
            return List.of("Case", "PowerBank", "Headset");
        } else if ("Headset".equalsIgnoreCase(categoryName)) {
            return List.of("Case", "PowerBank");
        } else if ("PowerBank".equalsIgnoreCase(categoryName)) {
            return List.of("Smartphone", "Case", "Headset");
        } else if ("Case".equalsIgnoreCase(categoryName)) {
            return List.of("Smartphone", "PowerBank");
        }
        return List.of("PowerBank", "Case");
    }

    // ── 5. Time-Decayed Trending & Popular Products ────────────────────────────────
    @Transactional(readOnly = true)
    public List<Product> getTrendingProducts(int days, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 30));
        LocalDateTime cutoff = LocalDateTime.now().minusDays(Math.max(1, days));

        List<com.icrowd_api.features.order.Order> orders = orderRepository.findAllQualifyingOrders(QUALIFYING_ORDER_STATUSES);
        LocalDateTime now = LocalDateTime.now();
        double lambda = Math.log(2) / 7.0; // 7-day half-life decay parameter

        Map<Long, Double> productVelocityMap = new HashMap<>();

        for (com.icrowd_api.features.order.Order order : orders) {
            if (order.getCreatedAt() != null && order.getCreatedAt().isAfter(cutoff)) {
                long daysPast = Math.max(0, Duration.between(order.getCreatedAt(), now).toDays());
                double decayWeight = Math.exp(-lambda * daysPast);

                if (order.getItems() != null) {
                    for (com.icrowd_api.features.order.OrderItem item : order.getItems()) {
                        if (item.getProduct() != null && item.getQuantity() != null) {
                            double addedVelocity = item.getQuantity() * decayWeight;
                            productVelocityMap.merge(item.getProduct().getId(), addedVelocity, Double::sum);
                        }
                    }
                }
            }
        }

        List<Product> trending = new ArrayList<>();
        if (!productVelocityMap.isEmpty()) {
            List<Long> rankedIds = productVelocityMap.entrySet().stream()
                    .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                    .map(Map.Entry::getKey)
                    .limit(safeLimit)
                    .collect(Collectors.toList());

            for (Long id : rankedIds) {
                productRepository.findByIdAndIsActiveTrue(id).ifPresent(trending::add);
            }
        }

        // Fallback / supplement with top-rated and in-stock items
        if (trending.size() < safeLimit) {
            List<Product> fallback = productRepository.findAllActiveProductsList().stream()
                    .filter(p -> !trending.contains(p))
                    .sorted((p1, p2) -> Double.compare(
                            p2.getAverageRating() != null ? p2.getAverageRating() : 0.0,
                            p1.getAverageRating() != null ? p1.getAverageRating() : 0.0
                    ))
                    .limit(safeLimit - trending.size())
                    .collect(Collectors.toList());
            trending.addAll(fallback);
        }

        return trending;
    }

    // ── 6. Recently Viewed Products ───────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<Product> getRecentlyViewed(String userEmail, String sessionId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));
        List<ProductView> views = new ArrayList<>();

        if (userEmail != null && !userEmail.isBlank()) {
            userRepository.findByEmail(userEmail).ifPresent(user -> {
                views.addAll(productViewRepository.findRecentByUserId(user.getId(), PageRequest.of(0, safeLimit * 2)));
            });
        }

        if (views.isEmpty() && sessionId != null && !sessionId.isBlank()) {
            views.addAll(productViewRepository.findRecentBySessionId(sessionId, PageRequest.of(0, safeLimit * 2)));
        }

        Set<Long> seenIds = new HashSet<>();
        List<Product> result = new ArrayList<>();

        for (ProductView pv : views) {
            if (pv.getProduct() != null && Boolean.TRUE.equals(pv.getProduct().getIsActive())) {
                if (seenIds.add(pv.getProduct().getId())) {
                    result.add(pv.getProduct());
                }
            }
            if (result.size() >= safeLimit) break;
        }

        return result;
    }

    // ── 7. Budget-Aware Recommendations ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<Product> getBudgetAwareRecommendations(BigDecimal maxPrice, BigDecimal minPrice, String category, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));
        List<Product> all = productRepository.findAllActiveProductsList();

        return all.stream()
                .filter(p -> {
                    if (p.getPrice() == null) return false;
                    if (maxPrice != null && p.getPrice().compareTo(maxPrice) > 0) return false;
                    if (minPrice != null && p.getPrice().compareTo(minPrice) < 0) return false;
                    if (category != null && !category.isBlank() && p.getCategory() != null) {
                        return p.getCategory().getName().equalsIgnoreCase(category);
                    }
                    return true;
                })
                .sorted((p1, p2) -> {
                    // Highest rating first, then lowest price within budget
                    int rateCmp = Double.compare(
                            p2.getAverageRating() != null ? p2.getAverageRating() : 0.0,
                            p1.getAverageRating() != null ? p1.getAverageRating() : 0.0
                    );
                    if (rateCmp != 0) return rateCmp;
                    return p1.getPrice().compareTo(p2.getPrice());
                })
                .limit(safeLimit)
                .collect(Collectors.toList());
    }
}

