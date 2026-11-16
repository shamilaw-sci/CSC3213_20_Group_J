package com.icrowd_api.features.product;

import com.icrowd_api.features.category.Category;
import com.icrowd_api.features.category.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@org.springframework.context.annotation.Profile({"local", "demo"})
@Configuration
public class ProductDataLoader {

    private Category findOrCreateCategory(CategoryRepository repo, String name, String description) {
        return repo.findByName(name)
                .orElseGet(() -> repo.save(
                        Category.builder().name(name).description(description).build()
                ));
    }

    @Bean
    @org.springframework.core.annotation.Order(2)
    CommandLineRunner loadProductData(ProductRepository productRepository, CategoryRepository categoryRepository) {
        return args -> {
            // 1. Ensure Categories exist
            Category headsetCat    = findOrCreateCategory(categoryRepository, "Headset",    "High-fidelity headphones, earbuds, and audio accessories");
            Category powerBankCat  = findOrCreateCategory(categoryRepository, "PowerBank",  "Portable power banks, GaN fast chargers, and wireless pads");
            Category caseCat       = findOrCreateCategory(categoryRepository, "Case",       "Military-grade protective phone cases, MagSafe covers, and sleeves");
            Category smartphoneCat = findOrCreateCategory(categoryRepository, "Smartphone", "Flagship smartphones, 5G devices, and camera flagships");

            List<Product> products = new ArrayList<>();

            // ── Product 1 (SKU-001) ──────────────────────────────────────────
            Map<String, String> s1 = new LinkedHashMap<>();
            s1.put("Capacity", "20,000mAh (72Wh)");
            s1.put("Max Output", "200W Total");
            s1.put("USB-C Ports", "2x USB-C (100W Max Each)");
            s1.put("USB-A Ports", "1x USB-A (65W Max)");
            s1.put("Weight", "540g");
            s1.put("Dimensions", "12.7 x 5.4 x 4.9 cm");
            products.add(Product.builder()
                    .sku("SKU-001")
                    .name("Anker Prime 20,000mAh Power Bank (200W Output)")
                    .description("Ultra-powerful multi-device power bank with dual 100W USB-C ports and one 65W USB-A port totaling 200W output. Smart TFT display shows real-time wattage, voltage, and remaining recharge time.")
                    .category(powerBankCat)
                    .price(BigDecimal.valueOf(38500.00))
                    .availableStock(45)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80",
                            "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80"
                    ))
                    .tags(List.of("powerbank", "anker", "fast-charging", "200w", "usb-c"))
                    .brand("Anker")
                    .warranty("18 Months Official Anker Warranty")
                    .deliveryInfo("Island-wide delivery within 2-3 business days")
                    .features(List.of(
                            "200W Total Output with dual 100W USB-C ports",
                            "20,000mAh airline-approved flight capacity",
                            "Smart TFT Color Display with real-time analytics",
                            "ActiveShield 2.0 temperature monitoring",
                            "Recharges fully in just 75 minutes at 100W"
                    ))
                    .specifications(s1)
                    .build());

            // ── Product 2 (SKU-002) ──────────────────────────────────────────
            Map<String, String> s2 = new LinkedHashMap<>();
            s2.put("Material", "Polycarbonate + Flexible TPU");
            s2.put("Compatibility", "iPhone 16 Pro Max");
            s2.put("MagSafe", "Built-in Magnetic Ring");
            s2.put("Drop Standard", "MIL-STD 810G-516.6");
            s2.put("Weight", "42g");
            products.add(Product.builder()
                    .sku("SKU-002")
                    .name("Spigen Ultra Hybrid MagFit Case for iPhone 16 Pro Max")
                    .description("Crystal clear hybrid back with an integrated magnetic ring fully compatible with all MagSafe accessories. Features Air Cushion Technology on all four corners for military-grade drop defense.")
                    .category(caseCat)
                    .price(BigDecimal.valueOf(8900.00))
                    .availableStock(60)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=800&q=80",
                            "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80"
                    ))
                    .tags(List.of("case", "spigen", "iphone", "magsafe", "protection"))
                    .brand("Spigen")
                    .warranty("6 Months Official Spigen Warranty")
                    .deliveryInfo("Island-wide delivery within 1-3 business days")
                    .features(List.of(
                            "Built-in MagSafe magnetic ring with strong hold",
                            "Air Cushion Technology military-grade drop defense",
                            "Anti-yellowing crystal clear polycarbonate back",
                            "Raised bezels safeguard camera lenses and screen",
                            "Tactile button covers with crisp feedback"
                    ))
                    .specifications(s2)
                    .build());

            // ── Product 3 (SKU-003) ──────────────────────────────────────────
            Map<String, String> s3 = new LinkedHashMap<>();
            s3.put("Driver Unit", "30mm Carbon Fiber Composite");
            s3.put("Frequency Response", "4Hz - 40,000Hz");
            s3.put("Battery Life", "30h (ANC ON) / 40h (ANC OFF)");
            s3.put("Weight", "250g");
            s3.put("Bluetooth", "v5.2 (LDAC, AAC, SBC)");
            s3.put("Charging", "USB-C Fast Charging");
            products.add(Product.builder()
                    .sku("SKU-003")
                    .name("Sony WH-1000XM5 Wireless Noise-Cancelling Headphones")
                    .description("Industry-leading noise cancellation powered by two processors and 8 microphones. Specially engineered 30mm carbon fiber driver unit delivers breathtaking Hi-Res audio with LDAC.")
                    .category(headsetCat)
                    .price(BigDecimal.valueOf(119900.00))
                    .availableStock(25)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
                            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
                            "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80"
                    ))
                    .tags(List.of("headphones", "sony", "anc", "wireless", "audiophile"))
                    .brand("Sony")
                    .warranty("1 Year Official Sony Warranty")
                    .deliveryInfo("Island-wide delivery within 1-2 business days")
                    .features(List.of(
                            "Industry-Leading ANC with Auto NC Optimizer",
                            "Up to 30-hour battery life (3 min quick charge for 3 hrs)",
                            "Ultra-comfortable soft-fit synthetic leather",
                            "Crystal-clear hands-free calling with 4 beamforming mics",
                            "Multipoint connection pairs two devices simultaneously"
                    ))
                    .specifications(s3)
                    .build());

            // ── Product 4 (SKU-004) ──────────────────────────────────────────
            Map<String, String> s4 = new LinkedHashMap<>();
            s4.put("Capacity", "20,000mAh / 74Wh");
            s4.put("Max Output", "100W PD");
            s4.put("Ports", "2x USB-C, 2x USB-A");
            s4.put("Dimensions", "16.2 x 14.3 x 1.8 cm");
            s4.put("Weight", "490g");
            products.add(Product.builder()
                    .sku("SKU-004")
                    .name("Baseus Blade 100W Ultra-Slim Laptop Power Bank")
                    .description("Razor-thin 18mm laptop-grade power bank engineered for mobile professionals. Charges MacBook Pro, Dell XPS, ThinkPad, and high-performance devices at full 100W speed.")
                    .category(powerBankCat)
                    .price(BigDecimal.valueOf(24900.00))
                    .availableStock(35)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&q=80",
                            "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80"
                    ))
                    .tags(List.of("powerbank", "baseus", "100w", "laptop", "slim"))
                    .brand("Baseus")
                    .warranty("1 Year Official Baseus Warranty")
                    .deliveryInfo("Island-wide delivery within 2-3 business days")
                    .features(List.of(
                            "Ultra-slim 18mm profile fits flat in laptop sleeve",
                            "100W Power Delivery 3.0 charges MacBooks at full speed",
                            "Four ports (2x USB-C + 2x USB-A) charge 4 devices at once",
                            "Large precision LED status display shows wattage and time",
                            "Full multi-layer thermal and voltage protection"
                    ))
                    .specifications(s4)
                    .build());

            // ── Product 5 (SKU-005) ──────────────────────────────────────────
            Map<String, String> s5 = new LinkedHashMap<>();
            s5.put("Drop Rating", "25 Feet (7.6 Meters)");
            s5.put("Materials", "DuPont Kevlar, Polycarbonate, Alloy Metal");
            s5.put("Wireless Charging", "Qi & Magnetic Compatible");
            s5.put("Compatibility", "Samsung Galaxy S24 Ultra");
            s5.put("Weight", "56g");
            products.add(Product.builder()
                    .sku("SKU-005")
                    .name("UAG Monarch Pro Kevlar Rugged Case for Galaxy S24 Ultra")
                    .description("The ultimate rugged protection crafted with genuine DuPont Kevlar. Built with a 5-layer defense structure and integrated magnetic module for wireless charging and car mounts.")
                    .category(caseCat)
                    .price(BigDecimal.valueOf(17500.00))
                    .availableStock(18)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&q=80",
                            "https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=800&q=80"
                    ))
                    .tags(List.of("case", "uag", "samsung", "rugged", "kevlar"))
                    .brand("Urban Armor Gear")
                    .warranty("1 Year Official UAG Warranty")
                    .deliveryInfo("Island-wide delivery within 1-3 business days")
                    .features(List.of(
                            "5 Layers of defense with genuine DuPont Kevlar",
                            "25 ft (7.6m) drop tested beyond military standards",
                            "Integrated magnetic module for Qi wireless chargers",
                            "Oversized tactile buttons with crisp responsive click",
                            "Sculpted traction grip along edges for non-slip hold"
                    ))
                    .specifications(s5)
                    .build());

            // ── Product 6 (SKU-006) ──────────────────────────────────────────
            Map<String, String> s6 = new LinkedHashMap<>();
            s6.put("Processor", "Apple H1 Chip (each ear cup)");
            s6.put("Battery Life", "Up to 20 Hours (ANC ON)");
            s6.put("Charging", "USB Type-C Fast Charge");
            s6.put("Weight", "384.8g");
            s6.put("Connectivity", "Bluetooth 5.0");
            products.add(Product.builder()
                    .sku("SKU-006")
                    .name("Apple AirPods Max (USB-C) - Space Gray")
                    .description("High-fidelity audio with pro-level Active Noise Cancellation, Transparency mode, and Personalized Spatial Audio with dynamic head tracking. Anodized aluminum ear cups with breathable mesh canopy.")
                    .category(headsetCat)
                    .price(BigDecimal.valueOf(219000.00))
                    .availableStock(15)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
                    ))
                    .tags(List.of("apple", "airpods", "headphones", "spatial-audio", "premium"))
                    .brand("Apple")
                    .warranty("1 Year Official Apple Warranty")
                    .deliveryInfo("Free island-wide priority delivery within 24 hours")
                    .features(List.of(
                            "Apple-designed 40mm dynamic driver for high-fidelity audio",
                            "Pro-level Active Noise Cancellation blocks external noise",
                            "Transparency mode lets you hear and interact with surroundings",
                            "Personalized Spatial Audio with dynamic head tracking",
                            "Universal USB-C charging with 20 hours listening time"
                    ))
                    .specifications(s6)
                    .build());

            // ── Product 7 (SKU-007) ──────────────────────────────────────────
            Map<String, String> s7 = new LinkedHashMap<>();
            s7.put("Capacity", "10,000mAh (38.5Wh)");
            s7.put("Wireless Output", "15W Max Qi2");
            s7.put("USB-C Output", "30W Max PD");
            s7.put("Weight", "250g");
            products.add(Product.builder()
                    .sku("SKU-007")
                    .name("Anker MagGo Qi2 10,000mAh Magnetic Wireless Power Bank")
                    .description("Certified Qi2 15W wireless charging power bank with built-in foldable kickstand. Snaps magnetically onto iPhone 12 through 16 series with ultra-strong hold and smart display.")
                    .category(powerBankCat)
                    .price(BigDecimal.valueOf(21500.00))
                    .availableStock(40)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80",
                            "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80"
                    ))
                    .tags(List.of("powerbank", "anker", "magsafe", "qi2", "wireless"))
                    .brand("Anker")
                    .warranty("18 Months Official Anker Warranty")
                    .deliveryInfo("Island-wide delivery within 1-3 business days")
                    .features(List.of(
                            "Certified Qi2 delivers 15W ultra-fast wireless speed",
                            "Smart digital screen shows real-time battery % and recharge time",
                            "Built-in fold-out kickstand props phone in portrait or landscape",
                            "10,000mAh capacity provides 1.8 full charges for iPhone 15 Pro",
                            "Bi-directional 30W USB-C port for fast cable charging"
                    ))
                    .specifications(s7)
                    .build());

            // ── Product 8 (SKU-008) ──────────────────────────────────────────
            Map<String, String> s8 = new LinkedHashMap<>();
            s8.put("Thickness", "0.75mm");
            s8.put("Weight", "13g");
            s8.put("Material", "100% Genuine 1500D Aramid Fiber");
            s8.put("MagSafe", "Full MagSafe Compatible");
            products.add(Product.builder()
                    .sku("SKU-008")
                    .name("Pitaka MagEZ Case 5 Aramid Fiber Case for iPhone 16 Pro")
                    .description("Ultra-thin 0.75mm aerospace-grade 1500D aramid fiber case crafted with patented Amber Magnet Film technology for seamless MagSafe integration with zero extra bulk.")
                    .category(caseCat)
                    .price(BigDecimal.valueOf(19900.00))
                    .availableStock(22)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80",
                            "https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=800&q=80"
                    ))
                    .tags(List.of("case", "pitaka", "iphone", "aramid-fiber", "minimalist"))
                    .brand("Pitaka")
                    .warranty("1 Year Official Pitaka Warranty")
                    .deliveryInfo("Island-wide delivery within 1-3 business days")
                    .features(List.of(
                            "Aerospace-grade 1500D Aramid Fiber 5x stronger than steel",
                            "Featherlight 0.75mm thickness and weighs only 13 grams",
                            "3D grip texture provides silky smooth yet non-slip hold",
                            "Amber Magnet Film embeds ultra-strong MagSafe magnets invisibly",
                            "Chamfered camera lip protects lenses against surface contact"
                    ))
                    .specifications(s8)
                    .build());

            // ── Product 9 (SKU-009) ──────────────────────────────────────────
            Map<String, String> s9 = new LinkedHashMap<>();
            s9.put("Bluetooth Version", "5.3");
            s9.put("Codecs", "Snapdragon Sound, aptX Adaptive, AAC, SBC");
            s9.put("Battery Life", "Up to 24 Hours");
            s9.put("Weight", "252g");
            products.add(Product.builder()
                    .sku("SKU-009")
                    .name("Bose QuietComfort Ultra Wireless Noise-Cancelling Headphones")
                    .description("World-class noise cancellation and breakthrough spatialized audio with Bose Immersive Audio. CustomTune technology personalizes sound performance to the exact shape of your ears.")
                    .category(headsetCat)
                    .price(BigDecimal.valueOf(139500.00))
                    .availableStock(20)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80",
                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
                    ))
                    .tags(List.of("headphones", "bose", "anc", "comfort", "spatial-audio"))
                    .brand("Bose")
                    .warranty("1 Year Official Bose Warranty")
                    .deliveryInfo("Island-wide delivery within 2-3 business days")
                    .features(List.of(
                            "Bose Immersive Audio pushes boundaries of spatial listening",
                            "Quiet, Aware, and Immersion modes with CustomTune tech",
                            "Plush protein leather ear cushions and lightweight headband",
                            "Up to 24 hours playtime (up to 18 hours with Immersive Audio)",
                            "Advanced beamforming microphones for crystal-clear calls"
                    ))
                    .specifications(s9)
                    .build());

            // ── Product 10 (SKU-010) ─────────────────────────────────────────
            Map<String, String> s10 = new LinkedHashMap<>();
            s10.put("Capacity", "10,000mAh (37Wh)");
            s10.put("Ports", "2x USB-A, 1x USB-C, 1x Micro-USB");
            s10.put("Dimensions", "9.0 x 6.4 x 2.4 cm");
            s10.put("Weight", "200g");
            products.add(Product.builder()
                    .sku("SKU-010")
                    .name("Xiaomi 22.5W 10,000mAh Ultra-Compact Fast Power Bank")
                    .description("Pocket-sized powerhouse featuring 22.5W two-way fast charging, dual USB-A and USB-C output, and high-density lithium polymer battery cells in a durable matte finish.")
                    .category(powerBankCat)
                    .price(BigDecimal.valueOf(7990.00))
                    .availableStock(70)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&q=80",
                            "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80"
                    ))
                    .tags(List.of("powerbank", "xiaomi", "compact", "budget", "fast-charge"))
                    .brand("Xiaomi")
                    .warranty("6 Months Official Xiaomi Warranty")
                    .deliveryInfo("Island-wide delivery within 2-4 business days")
                    .features(List.of(
                            "Ultra-compact pocket design fits in your palm",
                            "22.5W maximum fast charging output",
                            "3-Port simultaneous output (2x USB-A + 1x USB-C)",
                            "Low-current charging mode for smart bands and earbuds",
                            "9-layer circuit protection against short-circuit and overheating"
                    ))
                    .specifications(s10)
                    .build());

            // ── Product 11 (SKU-011) ─────────────────────────────────────────
            Map<String, String> s11 = new LinkedHashMap<>();
            s11.put("Drop Protection", "12 Feet");
            s11.put("Ring Rotation", "360 Degrees");
            s11.put("MagSafe", "Yes (18N Strength)");
            s11.put("Weight", "48g");
            products.add(Product.builder()
                    .sku("SKU-011")
                    .name("Torras 360 Spin Magnetic Stand Case for iPhone 15 Pro")
                    .description("Revolutionary 360-degree rotating ring stand integrated flush into a slim MagSafe protective case. Props your phone vertically, horizontally, or acts as a finger ring grip.")
                    .category(caseCat)
                    .price(BigDecimal.valueOf(11500.00))
                    .availableStock(30)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=800&q=80",
                            "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&q=80"
                    ))
                    .tags(List.of("case", "torras", "iphone", "stand", "magsafe"))
                    .brand("Torras")
                    .warranty("6 Months Official Torras Warranty")
                    .deliveryInfo("Island-wide delivery within 1-3 business days")
                    .features(List.of(
                            "360-degree rotating aerospace aluminum stand ring",
                            "Tested to withstand 30,000+ open-and-close cycles",
                            "Halbach magnet array with powerful 18N magnetic strength",
                            "X-Shock 3.0 patented 4-corner air cushioning for 12ft drops",
                            "Velvety matte translucent back resists fingerprints and smudges"
                    ))
                    .specifications(s11)
                    .build());

            // ── Product 12 (SKU-012) ─────────────────────────────────────────
            Map<String, String> s12 = new LinkedHashMap<>();
            s12.put("Drivers", "40mm Dynamic");
            s12.put("Frequency Range", "20Hz - 20,000Hz");
            s12.put("Playtime", "80+ Hours");
            s12.put("Weight", "165g");
            s12.put("Bluetooth", "v5.0");
            products.add(Product.builder()
                    .sku("SKU-012")
                    .name("Marshall Major IV Wireless Bluetooth On-Ear Headphones")
                    .description("Iconic Marshall vintage design meets 80+ solid hours of wireless playtime, wireless Qi charging, and an ergonomic custom fit. Delivers roaring bass, smooth mids, and brilliant treble.")
                    .category(headsetCat)
                    .price(BigDecimal.valueOf(48500.00))
                    .availableStock(28)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
                    ))
                    .tags(List.of("headphones", "marshall", "vintage", "bluetooth", "80h-battery"))
                    .brand("Marshall")
                    .warranty("1 Year Official Marshall Warranty")
                    .deliveryInfo("Island-wide delivery within 2-4 business days")
                    .features(List.of(
                            "Signature Marshall sound with custom-tuned 40mm dynamic drivers",
                            "80+ hours of continuous wireless playtime on a single charge",
                            "Wireless Qi charging capability and USB-C fast charging",
                            "Multi-directional brass control knob for playback and calls",
                            "Rugged collapsible vintage design with textured black vinyl"
                    ))
                    .specifications(s12)
                    .build());

            // ── Product 13 (SKU-013) ─────────────────────────────────────────
            Map<String, String> s13 = new LinkedHashMap<>();
            s13.put("Capacity", "24,000mAh (86.4Wh)");
            s13.put("Total Output", "140W");
            s13.put("Ports", "2x USB-C (140W max), 1x USB-A (18W)");
            s13.put("Weight", "630g");
            products.add(Product.builder()
                    .sku("SKU-013")
                    .name("Anker 737 Power Bank (PowerCore 24K) 140W")
                    .description("The legendary 24,000mAh 3-port power bank with Power Delivery 3.1 and bi-directional 140W ultra-fast charging technology. Refills itself up to 7 times faster than standard power banks.")
                    .category(powerBankCat)
                    .price(BigDecimal.valueOf(44900.00))
                    .availableStock(16)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80",
                            "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80"
                    ))
                    .tags(List.of("powerbank", "anker", "140w", "powercore", "macbook"))
                    .brand("Anker")
                    .warranty("18 Months Official Anker Warranty")
                    .deliveryInfo("Island-wide delivery within 1-2 business days")
                    .features(List.of(
                            "Ultra-powerful 140W two-way fast charging with PD 3.1",
                            "Smart digital display provides real-time wattage and health",
                            "Huge 24,000mAh capacity charges MacBook Pro 16 to 50% in 40 min",
                            "ActiveShield 2.0 intelligent temperature defense system",
                            "Simultaneously charges 3 power-hungry devices"
                    ))
                    .specifications(s13)
                    .build());

            // ── Product 14 (SKU-014) ─────────────────────────────────────────
            Map<String, String> s14 = new LinkedHashMap<>();
            s14.put("Material", "Thermoplastic Polyurethane (TPU)");
            s14.put("Drop Protection", "Air Cushion Mil-Grade");
            s14.put("Color", "Matte Black");
            s14.put("Weight", "35g");
            products.add(Product.builder()
                    .sku("SKU-014")
                    .name("Spigen Liquid Air Shock Absorption Case for Google Pixel 8 Pro")
                    .description("Sleek modern geometric pattern embossed on flexible, durable TPU. Offers pocket-friendly everyday defense with military-grade shock absorption and anti-slip grip.")
                    .category(caseCat)
                    .price(BigDecimal.valueOf(6900.00))
                    .availableStock(42)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80",
                            "https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=800&q=80"
                    ))
                    .tags(List.of("case", "spigen", "pixel", "matte", "slim"))
                    .brand("Spigen")
                    .warranty("6 Months Official Spigen Warranty")
                    .deliveryInfo("Island-wide delivery within 2-4 business days")
                    .features(List.of(
                            "Signature geometric matte pattern provides fingerprint resistance",
                            "Slim, form-fitting and lightweight profile slips easily in pockets",
                            "Air Cushion Technology absorbs shocks from unexpected drops",
                            "Precise camera visor cutout with raised lips for lens safety",
                            "Wireless charging compatible with responsive button feedback"
                    ))
                    .specifications(s14)
                    .build());

            // ── Product 15 (SKU-015) ─────────────────────────────────────────
            Map<String, String> s15 = new LinkedHashMap<>();
            s15.put("Driver Unit", "8.4mm Dynamic Driver X");
            s15.put("Weight", "5.9g per earbud");
            s15.put("Battery", "8h (buds) + 16h (case)");
            s15.put("Water Resistance", "IPX4");
            s15.put("Bluetooth", "v5.3 (Multipoint)");
            products.add(Product.builder()
                    .sku("SKU-015")
                    .name("Sony WF-1000XM5 True Wireless Noise-Cancelling Earbuds")
                    .description("The best noise-cancelling true wireless earbuds with dual proprietary processors, dual feedback microphones, and the specially engineered Dynamic Driver X for wide frequency reproduction and deep bass.")
                    .category(headsetCat)
                    .price(BigDecimal.valueOf(89900.00))
                    .availableStock(32)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
                            "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&q=80"
                    ))
                    .tags(List.of("earbuds", "sony", "anc", "tws", "ldac"))
                    .brand("Sony")
                    .warranty("1 Year Official Sony Warranty")
                    .deliveryInfo("Island-wide delivery within 1-2 business days")
                    .features(List.of(
                            "Top-tier ANC with Integrated Processor V2 and QN2e chip",
                            "Hi-Res Audio Wireless and LDAC support for lossless sound",
                            "AI noise reduction algorithm with bone-conduction voice pickup",
                            "IPX4 water resistance against sweat, splashes, and rain",
                            "Up to 24 hours battery life with wireless charging case"
                    ))
                    .specifications(s15)
                    .build());

            // ── Product 16 (SKU-016) ─────────────────────────────────────────
            Map<String, String> s16 = new LinkedHashMap<>();
            s16.put("Capacity", "10,000mAh (38Wh)");
            s16.put("Wireless Output", "15W / 10W / 7.5W");
            s16.put("USB-C Output", "20W Max PD");
            s16.put("Weight", "208g");
            products.add(Product.builder()
                    .sku("SKU-016")
                    .name("Baseus Magnetic Mini 10,000mAh Wireless Power Bank (20W)")
                    .description("Compact magnetic wireless power bank designed with strong 3500Gs magnets and 20W PD fast cable output. Ergonomic curved body doesn't block phone cameras while charging.")
                    .category(powerBankCat)
                    .price(BigDecimal.valueOf(13900.00))
                    .availableStock(55)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&q=80",
                            "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80"
                    ))
                    .tags(List.of("powerbank", "baseus", "magsafe", "compact", "wireless"))
                    .brand("Baseus")
                    .warranty("1 Year Official Baseus Warranty")
                    .deliveryInfo("Island-wide delivery within 2-3 business days")
                    .features(List.of(
                            "Strong 3500Gs magnetic alignment snaps firmly to phone back",
                            "Compact design leaves camera lenses completely unblocked",
                            "20W PD Fast Charging via USB-C + 15W wireless charging",
                            "LED indicator lights show accurate battery level at a glance",
                            "Safe for airplane travel with smart temperature regulation"
                    ))
                    .specifications(s16)
                    .build());

            // ── Product 17 (SKU-017) ─────────────────────────────────────────
            Map<String, String> s17 = new LinkedHashMap<>();
            s17.put("Display", "6.3-inch Super Retina XDR OLED (2622 x 1206, 120Hz)");
            s17.put("Processor", "Apple A18 Pro Bionic");
            s17.put("Storage", "256GB NVMe");
            s17.put("Rear Cameras", "48MP Main + 48MP Ultra-Wide + 12MP 5x Telephoto");
            s17.put("Weight", "199g");
            products.add(Product.builder()
                    .sku("SKU-017")
                    .name("Apple iPhone 16 Pro 256GB - Natural Titanium")
                    .description("Engineered with Grade 5 Titanium and the powerhouse A18 Pro chip. Features Camera Control, 48MP Fusion camera with 5x Telephoto optical zoom, and groundbreaking battery life.")
                    .category(smartphoneCat)
                    .price(BigDecimal.valueOf(389000.00))
                    .availableStock(14)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80",
                            "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80"
                    ))
                    .tags(List.of("iphone", "apple", "titanium", "a18-pro", "flagship"))
                    .brand("Apple")
                    .warranty("1 Year Official Apple International & Local Warranty")
                    .deliveryInfo("Free island-wide VIP insured delivery within 24 hours")
                    .features(List.of(
                            "Grade 5 Titanium design with next-generation Ceramic Shield",
                            "A18 Pro chip with 6-core GPU delivers desktop-grade gaming",
                            "48MP Fusion camera with 5x Telephoto optical zoom",
                            "Camera Control button for instant access to photographic tools",
                            "Super Retina XDR display with 120Hz ProMotion and Always-On"
                    ))
                    .specifications(s17)
                    .build());

            // ── Product 18 (SKU-018) ─────────────────────────────────────────
            Map<String, String> s18 = new LinkedHashMap<>();
            s18.put("Display", "6.8-inch QHD+ Dynamic AMOLED 2X (1-120Hz, 2600 nits)");
            s18.put("Processor", "Snapdragon 8 Gen 3 for Galaxy (4nm)");
            s18.put("RAM/Storage", "12GB RAM + 512GB Storage");
            s18.put("Cameras", "200MP + 50MP 5x + 10MP 3x + 12MP UW");
            s18.put("Battery", "5000mAh with 45W Fast Charging");
            s18.put("Weight", "232g");
            products.add(Product.builder()
                    .sku("SKU-018")
                    .name("Samsung Galaxy S24 Ultra 5G 512GB - Titanium Gray")
                    .description("Welcome to the era of Galaxy AI. Titanium exterior, flat 6.8-inch Dynamic AMOLED 2X display with anti-reflective Corning Gorilla Armor, and built-in S Pen stylus.")
                    .category(smartphoneCat)
                    .price(BigDecimal.valueOf(369900.00))
                    .availableStock(12)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80",
                            "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80"
                    ))
                    .tags(List.of("samsung", "galaxy", "s24-ultra", "ai", "flagship"))
                    .brand("Samsung")
                    .warranty("1 Year Samsung Sri Lanka Official Company Warranty")
                    .deliveryInfo("Free island-wide priority delivery within 24-48 hours")
                    .features(List.of(
                            "Galaxy AI: Circle to Search, Live Call Translation, and Note Assist",
                            "200MP Quad Telephoto Camera system with 100x Space Zoom",
                            "Snapdragon 8 Gen 3 for Galaxy processor with large vapor chamber",
                            "Corning Gorilla Armor reduces reflections by 75%",
                            "Built-in S Pen for effortless note taking and sketching"
                    ))
                    .specifications(s18)
                    .build());

            // ── Product 19 (SKU-019) ─────────────────────────────────────────
            Map<String, String> s19 = new LinkedHashMap<>();
            s19.put("Display", "6.3-inch LTPO OLED 120Hz (3000 nits peak)");
            s19.put("Processor", "Google Tensor G4 + Titan M2 security");
            s19.put("RAM/Storage", "16GB RAM + 128GB");
            s19.put("Cameras", "50MP Wide + 48MP Macro UW + 48MP 5x Telephoto");
            s19.put("Battery", "4700mAh with fast wireless charging");
            products.add(Product.builder()
                    .sku("SKU-019")
                    .name("Google Pixel 9 Pro 128GB - Obsidian")
                    .description("Google's most powerful flagship phone featuring the Google Tensor G4 chip, on-device Gemini AI, Super Actua 120Hz display, and award-winning pro camera system.")
                    .category(smartphoneCat)
                    .price(BigDecimal.valueOf(295000.00))
                    .availableStock(15)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80",
                            "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80"
                    ))
                    .tags(List.of("pixel", "google", "tensor-g4", "gemini-ai", "camera"))
                    .brand("Google")
                    .warranty("1 Year International & Store Warranty")
                    .deliveryInfo("Island-wide delivery within 2-3 business days")
                    .features(List.of(
                            "Google Tensor G4 with 16GB RAM built for advanced Gemini AI",
                            "Pro triple camera with 30x Super Res Zoom and 8K Video Boost",
                            "6.3-inch Super Actua LTPO OLED with 3000 nits peak brightness",
                            "7 Years of verified OS upgrades and Pixel Feature Drops",
                            "Thermometer sensor and satellite SOS emergency features"
                    ))
                    .specifications(s19)
                    .build());

            // ── Product 20 (SKU-020) ─────────────────────────────────────────
            Map<String, String> s20 = new LinkedHashMap<>();
            s20.put("Processor", "Snapdragon 8 Gen 3 (4nm)");
            s20.put("Display", "6.82-inch QHD+ 120Hz LTPO 4.0 AMOLED");
            s20.put("RAM/Storage", "12GB RAM + 256GB UFS 4.0");
            s20.put("Battery", "5400mAh with 100W wired / 50W wireless");
            s20.put("Weight", "220g");
            products.add(Product.builder()
                    .sku("SKU-020")
                    .name("OnePlus 12 5G 256GB - Silky Black")
                    .description("Powered by Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera System, 2K 120Hz ProXDR display, and blazing-fast 100W SUPERVOOC charging that refills in 26 minutes.")
                    .category(smartphoneCat)
                    .price(BigDecimal.valueOf(245000.00))
                    .availableStock(18)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80",
                            "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80"
                    ))
                    .tags(List.of("oneplus", "snapdragon8gen3", "hasselblad", "fast-charge", "flagship"))
                    .brand("OnePlus")
                    .warranty("1 Year Official OnePlus Warranty")
                    .deliveryInfo("Island-wide delivery within 2-3 business days")
                    .features(List.of(
                            "100W Wired SUPERVOOC charging refills battery in 26 minutes",
                            "4th Gen Hasselblad Camera with 64MP 3x Periscope Telephoto",
                            "2K 120Hz ProXDR Display with revolutionary 4500 nits brightness",
                            "Dual Cryo-velocity VC cooling system for lag-free gaming",
                            "Aqua Touch technology ensures flawless response with wet fingers"
                    ))
                    .specifications(s20)
                    .build());

            // ── Product 21 (SKU-021) ─────────────────────────────────────────
            Map<String, String> s21 = new LinkedHashMap<>();
            s21.put("Drivers", "40mm double-layer diaphragm");
            s21.put("Bluetooth", "v5.3");
            s21.put("Battery Life", "65h (ANC OFF) / 50h (ANC ON)");
            s21.put("Codecs", "LDAC, AAC, SBC");
            s21.put("Weight", "292g");
            products.add(Product.builder()
                    .sku("SKU-021")
                    .name("Anker Soundcore Space Q45 Adaptive ANC Headphones")
                    .description("Upgraded noise cancellation system reduces noise by up to 98%. Enjoy ultra-long 65-hour playtime, Hi-Res wireless audio with LDAC, and AI-enhanced calling.")
                    .category(headsetCat)
                    .price(BigDecimal.valueOf(34900.00))
                    .availableStock(40)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
                            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80"
                    ))
                    .tags(List.of("headphones", "anker", "soundcore", "anc", "long-battery"))
                    .brand("Anker")
                    .warranty("18 Months Official Anker Warranty")
                    .deliveryInfo("Island-wide delivery within 2-3 business days")
                    .features(List.of(
                            "98% Noise reduction with adaptive 3-stage ANC system",
                            "65 hours playtime in standard mode (50 hours with ANC ON)",
                            "Hi-Res Audio certified with LDAC lossless wireless codec",
                            "Dual microphones with AI algorithm for clear voice calls",
                            "Ultra-soft protein leather earcups with seamless contour fit"
                    ))
                    .specifications(s21)
                    .build());

            // ── Product 22 (SKU-022) ─────────────────────────────────────────
            Map<String, String> s22 = new LinkedHashMap<>();
            s22.put("Display", "6.73-inch WQHD+ AMOLED (3000 nits, 120Hz LTPO)");
            s22.put("Cameras", "50MP 1-inch + 50MP 3.2x + 50MP 5x + 50MP 122° UW");
            s22.put("Processor", "Snapdragon 8 Gen 3");
            s22.put("Storage", "16GB RAM + 512GB UFS 4.0");
            s22.put("Battery", "5000mAh with 90W HyperCharge");
            products.add(Product.builder()
                    .sku("SKU-022")
                    .name("Xiaomi 14 Ultra 5G 512GB - Black Vegan Leather")
                    .description("Legendary optical craftsmanship co-engineered with Leica. Quad 50MP camera system featuring a 1-inch LYT-900 sensor and stepless physical variable aperture f/1.63 - f/4.0.")
                    .category(smartphoneCat)
                    .price(BigDecimal.valueOf(349000.00))
                    .availableStock(10)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80",
                            "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80"
                    ))
                    .tags(List.of("xiaomi", "leica", "1-inch-sensor", "camera-phone", "flagship"))
                    .brand("Xiaomi")
                    .warranty("1 Year Official Xiaomi Warranty")
                    .deliveryInfo("Island-wide delivery within 1-2 business days")
                    .features(List.of(
                            "Leica Quad Camera with 1-inch Sony LYT-900 sensor",
                            "Stepless variable physical aperture f/1.63 - f/4.0",
                            "Dual telephoto lenses: 75mm floating (3.2x) & 120mm periscope (5x)",
                            "Snapdragon 8 Gen 3 with Xiaomi Dual-Channel IceLoop liquid cooling",
                            "90W wired HyperCharge and 80W wireless HyperCharge"
                    ))
                    .specifications(s22)
                    .build());

            // ── Product 23 (SKU-023) ─────────────────────────────────────────
            Map<String, String> s23 = new LinkedHashMap<>();
            s23.put("Material", "Dual Layer TPU + Polycarbonate");
            s23.put("Design", "3D Hexa Cube Geometric");
            s23.put("Drop Tested", "Military-Grade Certified");
            s23.put("Weight", "38g");
            products.add(Product.builder()
                    .sku("SKU-023")
                    .name("Caseology Parallax 3D Ergonomic Case for iPhone 16")
                    .description("Iconic 3D Hexa Cube geometric back design offers enhanced ergonomics and tactile built-in textured grip on both sides. Certified military-grade drop defense.")
                    .category(caseCat)
                    .price(BigDecimal.valueOf(7500.00))
                    .availableStock(48)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=800&q=80",
                            "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80"
                    ))
                    .tags(List.of("case", "caseology", "iphone", "3d-grip", "protection"))
                    .brand("Caseology")
                    .warranty("6 Months Official Warranty")
                    .deliveryInfo("Island-wide delivery within 2-4 business days")
                    .features(List.of(
                            "Iconic 3D Hexa Cube pattern offers enhanced tactile grip",
                            "Integrated TPU side grips prevent accidental slips",
                            "Raised bezels protect camera visor and touchscreen",
                            "Dual-layer military-grade drop protection",
                            "Wireless charging compatible with slim profile"
                    ))
                    .specifications(s23)
                    .build());

            // ── Product 24 (SKU-024) ─────────────────────────────────────────
            Map<String, String> s24 = new LinkedHashMap<>();
            s24.put("Drivers", "40mm Dynamic");
            s24.put("Frequency Response", "10Hz - 40,000Hz (Passive)");
            s24.put("Battery Life", "Up to 50 Hours (ANC OFF)");
            s24.put("Bluetooth", "v5.3 (LE Audio)");
            s24.put("Weight", "278g");
            products.add(Product.builder()
                    .sku("SKU-024")
                    .name("JBL Tour One M2 Wireless Noise Cancelling Headphones")
                    .description("True Adaptive Noise Cancelling technology with 4-mic noise sensing monitors surroundings in real time. Dynamic 40mm drivers tuned with legendary JBL Pro Sound and immersive spatial audio.")
                    .category(headsetCat)
                    .price(BigDecimal.valueOf(68000.00))
                    .availableStock(24)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
                            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80"
                    ))
                    .tags(List.of("headphones", "jbl", "anc", "pro-sound", "wireless"))
                    .brand("JBL")
                    .warranty("1 Year Official JBL Warranty")
                    .deliveryInfo("Island-wide delivery within 1-3 business days")
                    .features(List.of(
                            "True Adaptive Noise Cancelling with Smart Ambient mode",
                            "JBL Pro Sound with custom-tuned 40mm dynamic drivers",
                            "Up to 50 hours playtime (30 hours with ANC enabled)",
                            "4-Mic crystal call technology with VoiceAware control",
                            "Spatial sound immerses you in games, movies, and music"
                    ))
                    .specifications(s24)
                    .build());

            // ── Product 25 (SKU-025) ─────────────────────────────────────────
            Map<String, String> s25 = new LinkedHashMap<>();
            s25.put("Display", "6.1-inch Super Retina XDR OLED (2556 x 1179)");
            s25.put("Processor", "Apple A16 Bionic");
            s25.put("Storage", "128GB");
            s25.put("Cameras", "48MP Main + 12MP Ultra-Wide");
            s25.put("Connector", "USB-C");
            s25.put("Weight", "171g");
            products.add(Product.builder()
                    .sku("SKU-025")
                    .name("Apple iPhone 15 128GB - Black")
                    .description("Features the Dynamic Island, 48MP Main camera with 2x Telephoto, color-infused glass back with contoured aluminum edges, and universal USB-C connectivity.")
                    .category(smartphoneCat)
                    .price(BigDecimal.valueOf(249000.00))
                    .availableStock(20)
                    .imageUrls(List.of(
                            "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80",
                            "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80"
                    ))
                    .tags(List.of("iphone", "apple", "a16-bionic", "dynamic-island", "usb-c"))
                    .brand("Apple")
                    .warranty("1 Year Official Apple Warranty")
                    .deliveryInfo("Free island-wide priority delivery within 24 hours")
                    .features(List.of(
                            "Dynamic Island bubbles up alerts and Live Activities",
                            "48MP Main camera with 2x optical-quality Telephoto",
                            "A16 Bionic chip powers next-level computational photography",
                            "Color-infused durable glass with contoured aluminum enclosure",
                            "Universal USB-C connector for effortless charging"
                    ))
                    .specifications(s25)
                    .build());

            // 2. Upsert each product so existing IDs are preserved
            for (Product p : products) {
                if (p.getCostPrice() == null && p.getPrice() != null) {
                    p.setCostPrice(p.getPrice().multiply(new BigDecimal("0.58")).setScale(2, java.math.RoundingMode.HALF_UP));
                }
                if (p.getLeadTimeDays() == null) {
                    p.setLeadTimeDays(7);
                }

                if (!productRepository.existsBySku(p.getSku())) productRepository.save(p);
            }

            System.out.println("All 25 Real Tech Products seeded when absent; existing inventory preserved.");
        };
    }
}
