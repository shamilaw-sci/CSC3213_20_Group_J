package com.icrowd_api.features.order;

import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.auth.UserRepository;
import com.icrowd_api.features.product.Product;
import com.icrowd_api.features.product.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Seeds realistic demonstration orders across the last 6 months (June - November 2026).
 * Restricted to non-production profiles (@Profile("!prod")).
 */
@Component
@Profile("!prod")
@Order(3)
public class OrderDataLoader implements CommandLineRunner {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (orderRepository.count() > 0) {
            System.out.println("Orders already seeded. Skipping OrderDataLoader.");
            return;
        }

        User customer = userRepository.findByEmail("customer@icrowd.com")
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> "CUSTOMER".equalsIgnoreCase(u.getRole()))
                        .findFirst()
                        .orElse(null));

        if (customer == null) {
            System.out.println("No customer account found for seeding sample orders.");
            return;
        }

        List<Product> products = productRepository.findAll();
        if (products.isEmpty()) {
            System.out.println("No products found for seeding sample orders.");
            return;
        }

        Map<String, Product> productMap = products.stream()
                .filter(p -> p.getSku() != null)
                .collect(Collectors.toMap(Product::getSku, p -> p, (a, b) -> a));

        List<OrderSeedSpec> seedSpecs = buildOrderSeedSpecs();

        int seededCount = 0;
        for (OrderSeedSpec spec : seedSpecs) {
            com.icrowd_api.features.order.Order order = com.icrowd_api.features.order.Order.builder()
                    .user(customer)
                    .checkoutKey(spec.checkoutKey)
                    .orderReference(spec.orderReference)
                    .status(spec.status)
                    .paymentStatus(spec.paymentStatus)
                    .paymentMethod(spec.paymentMethod)
                    .deliveryType(spec.deliveryType)
                    .shippingCost(spec.shippingCost)
                    .shippingFullName("Kamal Perera")
                    .shippingPhone("0771234567")
                    .shippingEmail(customer.getEmail())
                    .shippingAddress("123, Galle Road, Kollupitiya")
                    .shippingDistrict("Colombo")
                    .shippingLat(6.9271)
                    .shippingLng(79.8612)
                    .currency("LKR")
                    .stockAllocated(true)
                    .build();

            for (ItemSeed itemSeed : spec.items) {
                Product product = productMap.get(itemSeed.sku);
                if (product == null && !products.isEmpty()) {
                    product = products.get(0);
                }
                if (product != null) {
                    OrderItem orderItem = OrderItem.builder()
                            .order(order)
                            .product(product)
                            .quantity(itemSeed.quantity)
                            .priceAtTimeOfPurchase(product.getPrice())
                            .costPriceAtTimeOfPurchase(product.getEffectiveCostPrice())
                            .build();
                    order.getItems().add(orderItem);
                }
            }

            BigDecimal subTotal = order.getItems().stream()
                    .map(i -> i.getPriceAtTimeOfPurchase().multiply(BigDecimal.valueOf(i.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            order.setSubTotal(subTotal);
            order.setTotalAmount(subTotal.add(order.getShippingCost()));

            com.icrowd_api.features.order.Order saved = orderRepository.save(order);
            orderRepository.updateOrderCreatedAt(saved.getId(), spec.createdAt);
            seededCount++;
        }

        System.out.println("✅ Successfully seeded " + seededCount + " historical demonstration orders into the database.");
    }

    private static class ItemSeed {
        final String sku;
        final int quantity;
        ItemSeed(String sku, int quantity) {
            this.sku = sku;
            this.quantity = quantity;
        }
    }

    private static class OrderSeedSpec {
        final String orderReference;
        final String checkoutKey;
        final LocalDateTime createdAt;
        final OrderStatus status;
        final PaymentStatus paymentStatus;
        final PaymentMethod paymentMethod;
        final DeliveryType deliveryType;
        final BigDecimal shippingCost;
        final List<ItemSeed> items;

        OrderSeedSpec(String orderReference, String checkoutKey, LocalDateTime createdAt,
                      OrderStatus status, PaymentStatus paymentStatus, PaymentMethod paymentMethod,
                      DeliveryType deliveryType, BigDecimal shippingCost, List<ItemSeed> items) {
            this.orderReference = orderReference;
            this.checkoutKey = checkoutKey;
            this.createdAt = createdAt;
            this.status = status;
            this.paymentStatus = paymentStatus;
            this.paymentMethod = paymentMethod;
            this.deliveryType = deliveryType;
            this.shippingCost = shippingCost;
            this.items = items;
        }
    }

    private List<OrderSeedSpec> buildOrderSeedSpecs() {
        List<OrderSeedSpec> specs = new ArrayList<>();
        BigDecimal stdShipping = new BigDecimal("200.00");
        BigDecimal fastShipping = new BigDecimal("500.00");

        // ── June 2026 ─────────────────────────────────────────────────────────
        specs.add(new OrderSeedSpec("ORD-20260610-001", "SEED-ORD-001",
                LocalDateTime.of(2026, 6, 10, 14, 20),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.CARD,
                DeliveryType.STANDARD, stdShipping,
                List.of(new ItemSeed("SKU-001", 1)))); // Anker PowerBank

        specs.add(new OrderSeedSpec("ORD-20260624-002", "SEED-ORD-002",
                LocalDateTime.of(2026, 6, 24, 11, 45),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.COD,
                DeliveryType.FAST, fastShipping,
                List.of(new ItemSeed("SKU-002", 2), new ItemSeed("SKU-013", 1)))); // Spigen Case x2, Anker 737

        // ── July 2026 ─────────────────────────────────────────────────────────
        specs.add(new OrderSeedSpec("ORD-20260705-003", "SEED-ORD-003",
                LocalDateTime.of(2026, 7, 5, 16, 10),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.CARD,
                DeliveryType.STANDARD, stdShipping,
                List.of(new ItemSeed("SKU-006", 1)))); // AirPods Max

        specs.add(new OrderSeedSpec("ORD-20260718-004", "SEED-ORD-004",
                LocalDateTime.of(2026, 7, 18, 10, 30),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.CARD,
                DeliveryType.STANDARD, stdShipping,
                List.of(new ItemSeed("SKU-005", 1), new ItemSeed("SKU-001", 1)))); // UAG Case, Anker PowerBank

        specs.add(new OrderSeedSpec("ORD-20260729-005", "SEED-ORD-005",
                LocalDateTime.of(2026, 7, 29, 18, 5),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.COD,
                DeliveryType.FAST, fastShipping,
                List.of(new ItemSeed("SKU-025", 1)))); // iPhone 15

        // ── August 2026 ───────────────────────────────────────────────────────
        specs.add(new OrderSeedSpec("ORD-20260804-006", "SEED-ORD-006",
                LocalDateTime.of(2026, 8, 4, 12, 15),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.CARD,
                DeliveryType.STANDARD, stdShipping,
                List.of(new ItemSeed("SKU-009", 1)))); // Bose QC Ultra

        specs.add(new OrderSeedSpec("ORD-20260816-007", "SEED-ORD-007",
                LocalDateTime.of(2026, 8, 16, 15, 40),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.CARD,
                DeliveryType.STANDARD, stdShipping,
                List.of(new ItemSeed("SKU-013", 1), new ItemSeed("SKU-002", 1)))); // Anker 737, Spigen Case

        specs.add(new OrderSeedSpec("ORD-20260827-008", "SEED-ORD-008",
                LocalDateTime.of(2026, 8, 27, 9, 20),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.CARD,
                DeliveryType.FAST, fastShipping,
                List.of(new ItemSeed("SKU-018", 1)))); // Galaxy S24 Ultra

        // ── September 2026 ────────────────────────────────────────────────────
        specs.add(new OrderSeedSpec("ORD-20260905-009", "SEED-ORD-009",
                LocalDateTime.of(2026, 9, 5, 13, 50),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.COD,
                DeliveryType.STANDARD, stdShipping,
                List.of(new ItemSeed("SKU-001", 2)))); // Anker PowerBank x2

        specs.add(new OrderSeedSpec("ORD-20260917-010", "SEED-ORD-010",
                LocalDateTime.of(2026, 9, 17, 17, 35),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.CARD,
                DeliveryType.STANDARD, stdShipping,
                List.of(new ItemSeed("SKU-017", 1), new ItemSeed("SKU-002", 1)))); // iPhone 16 Pro, Spigen Case

        specs.add(new OrderSeedSpec("ORD-20260928-011", "SEED-ORD-011",
                LocalDateTime.of(2026, 9, 28, 11, 0),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.CARD,
                DeliveryType.FAST, fastShipping,
                List.of(new ItemSeed("SKU-006", 1)))); // AirPods Max

        // ── October 2026 ──────────────────────────────────────────────────────
        specs.add(new OrderSeedSpec("ORD-20261004-012", "SEED-ORD-012",
                LocalDateTime.of(2026, 10, 4, 14, 10),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.CARD,
                DeliveryType.STANDARD, stdShipping,
                List.of(new ItemSeed("SKU-022", 1)))); // Xiaomi 14 Ultra

        specs.add(new OrderSeedSpec("ORD-20261012-013", "SEED-ORD-013",
                LocalDateTime.of(2026, 10, 12, 16, 45),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.COD,
                DeliveryType.STANDARD, stdShipping,
                List.of(new ItemSeed("SKU-005", 2), new ItemSeed("SKU-013", 1)))); // UAG Case x2, Anker 737

        // Cancelled order (to test non-qualifying filter exclusion)
        specs.add(new OrderSeedSpec("ORD-20261015-014", "SEED-ORD-014",
                LocalDateTime.of(2026, 10, 15, 10, 0),
                OrderStatus.CANCELLED, PaymentStatus.CANCELLED, PaymentMethod.CARD,
                DeliveryType.STANDARD, stdShipping,
                List.of(new ItemSeed("SKU-017", 1))));

        specs.add(new OrderSeedSpec("ORD-20261022-015", "SEED-ORD-015",
                LocalDateTime.of(2026, 10, 22, 19, 15),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.CARD,
                DeliveryType.FAST, fastShipping,
                List.of(new ItemSeed("SKU-009", 1), new ItemSeed("SKU-001", 1)))); // Bose QC Ultra, Anker PowerBank

        specs.add(new OrderSeedSpec("ORD-20261030-016", "SEED-ORD-016",
                LocalDateTime.of(2026, 10, 30, 12, 30),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.CARD,
                DeliveryType.STANDARD, stdShipping,
                List.of(new ItemSeed("SKU-018", 1), new ItemSeed("SKU-005", 1)))); // Galaxy S24 Ultra, UAG Case

        // ── November 2026 ─────────────────────────────────────────────────────
        specs.add(new OrderSeedSpec("ORD-20261104-017", "SEED-ORD-017",
                LocalDateTime.of(2026, 11, 4, 15, 20),
                OrderStatus.DELIVERED, PaymentStatus.PAID, PaymentMethod.CARD,
                DeliveryType.STANDARD, stdShipping,
                List.of(new ItemSeed("SKU-006", 1)))); // AirPods Max

        specs.add(new OrderSeedSpec("ORD-20261108-018", "SEED-ORD-018",
                LocalDateTime.of(2026, 11, 8, 10, 40),
                OrderStatus.SHIPPED, PaymentStatus.PAID, PaymentMethod.CARD,
                DeliveryType.FAST, fastShipping,
                List.of(new ItemSeed("SKU-025", 1), new ItemSeed("SKU-002", 1)))); // iPhone 15, Spigen Case

        specs.add(new OrderSeedSpec("ORD-20261111-019", "SEED-ORD-019",
                LocalDateTime.of(2026, 11, 11, 17, 5),
                OrderStatus.CONFIRMED, PaymentStatus.PAID, PaymentMethod.COD,
                DeliveryType.STANDARD, stdShipping,
                List.of(new ItemSeed("SKU-001", 1), new ItemSeed("SKU-013", 1)))); // Anker PowerBank, Anker 737

        specs.add(new OrderSeedSpec("ORD-20261112-020", "SEED-ORD-020",
                LocalDateTime.of(2026, 11, 12, 14, 0),
                OrderStatus.PROCESSING, PaymentStatus.PAID, PaymentMethod.CARD,
                DeliveryType.STANDARD, stdShipping,
                List.of(new ItemSeed("SKU-009", 1)))); // Bose QC Ultra

        return specs;
    }
}

