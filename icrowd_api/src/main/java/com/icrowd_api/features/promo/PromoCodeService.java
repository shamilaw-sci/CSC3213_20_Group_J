package com.icrowd_api.features.promo;

import com.icrowd_api.features.auth.User;
import com.icrowd_api.features.auth.UserRepository;
import com.icrowd_api.features.order.Order;
import com.icrowd_api.features.order.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PromoCodeService {

    @Autowired
    private com.icrowd_api.features.marketing.CampaignRecorder campaignRecorder;

    @Autowired
    private PromoCodeRepository promoCodeRepository;

    @Autowired
    private PromoCodeUsageRepository promoCodeUsageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    // â”€â”€ Admin CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Transactional
    public PromoCodeResponse createPromoCode(PromoCodeRequest req) {
        validateRequest(req);
        if (promoCodeRepository.existsByCodeIgnoreCase(req.getCode())) {
            throw new PromoCodeInvalidException("A promo code with that name already exists.");
        }
        PromoCode promo = PromoCode.builder()
                .code(req.getCode().toUpperCase().trim())
                .discountType(req.getDiscountType())
                .discountValue(req.getDiscountValue())
                .maxDiscountAmount(req.getMaxDiscountAmount())
                .minimumOrderAmount(req.getMinimumOrderAmount())
                .startDate(req.getStartDate())
                .expiryDate(req.getExpiryDate())
                .totalUsageLimit(req.getTotalUsageLimit())
                .perCustomerLimit(req.getPerCustomerLimit())
                .customerEligibility(req.getCustomerEligibility() != null
                        ? req.getCustomerEligibility() : CustomerEligibility.ALL)
                .eligibleCustomerEmails(req.getEligibleCustomerEmails() != null
                        ? req.getEligibleCustomerEmails() : new ArrayList<>())
                .active(true)
                .build();
        PromoCode saved = promoCodeRepository.save(promo);
        if (campaignRecorder != null) campaignRecorder.record("PROMO", saved.getId());
        return PromoCodeResponse.from(saved);
    }

    @Transactional
    public PromoCodeResponse updatePromoCode(Long id, PromoCodeRequest req) {
        validateRequest(req);
        PromoCode promo = promoCodeRepository.lockById(id)
                .orElseThrow(() -> new PromoCodeNotFoundException(id));

        // Check uniqueness only if code changed
        String newCode = req.getCode().toUpperCase().trim();
        if (!promo.getCode().equalsIgnoreCase(newCode)
                && promoCodeRepository.existsByCodeIgnoreCase(newCode)) {
            throw new PromoCodeInvalidException("A promo code with that name already exists.");
        }

        promo.setCode(newCode);
        promo.setDiscountType(req.getDiscountType());
        promo.setDiscountValue(req.getDiscountValue());
        promo.setMaxDiscountAmount(req.getMaxDiscountAmount());
        promo.setMinimumOrderAmount(req.getMinimumOrderAmount());
        promo.setStartDate(req.getStartDate());
        promo.setExpiryDate(req.getExpiryDate());
        promo.setTotalUsageLimit(req.getTotalUsageLimit());
        promo.setPerCustomerLimit(req.getPerCustomerLimit());
        promo.setCustomerEligibility(req.getCustomerEligibility() != null
                ? req.getCustomerEligibility() : CustomerEligibility.ALL);
        promo.setEligibleCustomerEmails(req.getEligibleCustomerEmails() != null
                ? req.getEligibleCustomerEmails() : new ArrayList<>());

        return PromoCodeResponse.from(promoCodeRepository.save(promo));
    }

    @Transactional
    public PromoCodeResponse toggleActive(Long id) {
        PromoCode promo = promoCodeRepository.lockById(id)
                .orElseThrow(() -> new PromoCodeNotFoundException(id));
        promo.setActive(!promo.getActive());
        return PromoCodeResponse.from(promoCodeRepository.save(promo));
    }

    @Transactional
    public void deletePromoCode(Long id) {
        if (!promoCodeRepository.existsById(id)) {
            throw new PromoCodeNotFoundException(id);
        }
        promoCodeRepository.deleteById(id);
    }

    public List<PromoCodeResponse> getAllPromoCodes() {
        return promoCodeRepository.findAll().stream()
                .map(PromoCodeResponse::from)
                .collect(Collectors.toList());
    }

    // ── Customer-facing: Available Promotions ──────────────────────────────────

    /**
     * Retrieves all currently active and valid promo codes that a customer is eligible for.
     */
    public List<PromoCodeResponse> getAvailablePromotions(String userEmail) {
        LocalDate today = LocalDate.now();
        List<PromoCode> all = promoCodeRepository.findAll();
        User user = (userEmail != null && !userEmail.trim().isEmpty())
                ? userRepository.findByEmail(userEmail).orElse(null)
                : null;

        return all.stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()))
                .filter(p -> p.getStartDate() == null || !p.getStartDate().isAfter(today))
                .filter(p -> p.getExpiryDate() == null || !p.getExpiryDate().isBefore(today))
                .filter(p -> p.getTotalUsageLimit() == null || promoCodeUsageRepository.countReserved(p, null, null, java.time.LocalDateTime.now().minusHours(24)) < p.getTotalUsageLimit())
                .filter(p -> {
                    // Check customer eligibility
                    if (p.getCustomerEligibility() == CustomerEligibility.NEW_CUSTOMERS) {
                        if (user != null) {
                            long completedOrders = orderRepository.countCompletedOrdersByUserId(user.getId());
                            if (completedOrders > 0) return false;
                        }
                    } else if (p.getCustomerEligibility() == CustomerEligibility.SELECTED_CUSTOMERS) {
                        if (userEmail == null || p.getEligibleCustomerEmails() == null ||
                                p.getEligibleCustomerEmails().stream().noneMatch(e -> e.equalsIgnoreCase(userEmail))) {
                            return false;
                        }
                    }
                    // Check per customer limit
                    if (user != null && p.getPerCustomerLimit() != null) {
                        long usedByCustomer = promoCodeUsageRepository.countReserved(p, user, null, java.time.LocalDateTime.now().minusHours(24));
                        if (usedByCustomer >= p.getPerCustomerLimit()) return false;
                    }
                    return true;
                })
                .map(PromoCodeResponse::from)
                .collect(Collectors.toList());
    }

    public PromoStatsResponse getPromoStats() {
        long active = promoCodeRepository.countByActiveTrue();
        long expired = promoCodeRepository.countExpired();
        long redemptions = promoCodeRepository.sumTotalRedemptions();
        BigDecimal totalDiscount = promoCodeUsageRepository.sumTotalDiscountGiven();
        if (totalDiscount == null) totalDiscount = BigDecimal.ZERO;
        return PromoStatsResponse.builder()
                .activeCodes(active)
                .expiredCodes(expired)
                .totalRedemptions(redemptions)
                .totalDiscountGiven(totalDiscount)
                .build();
    }

    // â”€â”€ Validation (customer-facing) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * Validates a promo code for a given customer and cart subtotal.
     * Returns a PromoValidationResponse â€” does NOT persist anything.
     */
    @Transactional(readOnly = true)
    public List<PromoValidationResponse> availableFor(String email, BigDecimal subtotal) {
        if (subtotal == null || subtotal.signum() <= 0 || userRepository.findByEmail(email).isEmpty()) return List.of();
        return promoCodeRepository.findAll().stream().filter(p -> Boolean.TRUE.equals(p.getActive()))
            .map(p -> validateCode(p.getCode(), email, subtotal)).filter(PromoValidationResponse::isValid).toList();
    }

    public PromoValidationResponse validateCode(String code, String userEmail, BigDecimal cartSubTotal) {
        if (code == null || code.isBlank() || cartSubTotal == null || cartSubTotal.signum() <= 0) return fail("Enter a code and add items to your cart.");
        if (userRepository.findByEmail(userEmail).isEmpty()) return fail("Sign in to use promotions.");
        PromoCode promo = promoCodeRepository.findByCodeIgnoreCase(code.trim()).orElse(null);

        if (promo == null) {
            return fail("This promo code does not exist.");
        }
        if (!promo.getActive()) {
            return fail("This promo code is no longer active.");
        }
        LocalDate today = LocalDate.now();
        if (promo.getStartDate() != null && promo.getStartDate().isAfter(today)) {
            return fail("This promo code is not yet valid.");
        }
        if (promo.getExpiryDate() != null && promo.getExpiryDate().isBefore(today)) {
            return fail("This promo code has expired.");
        }
        long confirmedUsages = promoCodeUsageRepository.countReserved(promo, null, null, java.time.LocalDateTime.now().minusHours(24));
        if (promo.getTotalUsageLimit() != null && confirmedUsages >= promo.getTotalUsageLimit()) {
            return fail("This promo code has reached its usage limit.");
        }
        if (promo.getMinimumOrderAmount() != null
                && cartSubTotal.compareTo(promo.getMinimumOrderAmount()) < 0) {
            return fail("A minimum order of LKR "
                    + promo.getMinimumOrderAmount().toPlainString()
                    + " is required for this code.");
        }

        // Customer eligibility
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user != null) {
            switch (promo.getCustomerEligibility()) {
                case NEW_CUSTOMERS -> {
                    long completedOrders = orderRepository.countCompletedOrdersByUserId(user.getId());
                    if (completedOrders > 0) {
                        return fail("This promo code is only for new customers.");
                    }
                }
                case SELECTED_CUSTOMERS -> {
                    boolean eligible = promo.getEligibleCustomerEmails().stream()
                            .anyMatch(e -> e.equalsIgnoreCase(userEmail));
                    if (!eligible) {
                        return fail("You are not eligible for this promo code.");
                    }
                }
                default -> { /* ALL â€” no extra check */ }
            }

            // Per-customer limit
            if (promo.getPerCustomerLimit() != null) {
                long usedByCustomer = promoCodeUsageRepository.countReserved(promo, user, null, java.time.LocalDateTime.now().minusHours(24));
                if (usedByCustomer >= promo.getPerCustomerLimit()) {
                    return fail("You have already used this promo code the maximum number of times.");
                }
            }
        }

        BigDecimal discount = calculateDiscount(promo, cartSubTotal);
        BigDecimal discountedSubTotal = cartSubTotal.subtract(discount).max(BigDecimal.ZERO);

        return PromoValidationResponse.builder()
                .valid(true)
                .message("Promo code applied successfully!")
                .promoCode(promo.getCode())
                .discountAmount(discount)
                .discountedSubTotal(discountedSubTotal)
                .build();
    }

    /**
     * Records a promo code usage after a successful order.
     * Called by OrderService inside the same transaction.
     */
    @Transactional
    public void applyCodeToOrder(String code, User user, Order order) {
        PromoCode promo = promoCodeRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new PromoCodeNotFoundException(code));

        order.setAppliedPromoCode(promo);
        PromoCodeUsage usage = PromoCodeUsage.builder()
                .promoCode(promo)
                .customer(user)
                .order(order)
                .build();
        promoCodeUsageRepository.save(usage);
        promoCodeRepository.incrementUsageCount(promo.getId());
    }

    // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private BigDecimal calculateDiscount(PromoCode promo, BigDecimal subTotal) {
        if (promo.getDiscountType() == DiscountType.FIXED) {
            return promo.getDiscountValue().max(BigDecimal.ZERO).min(subTotal);
        }
        // PERCENTAGE
        BigDecimal discount = subTotal
                .multiply(promo.getDiscountValue())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        if (promo.getMaxDiscountAmount() != null) {
            discount = discount.min(promo.getMaxDiscountAmount());
        }
        return discount.max(BigDecimal.ZERO).min(subTotal);
    }

    private PromoValidationResponse fail(String message) {
        return PromoValidationResponse.builder()
                .valid(false)
                .message(message)
                .discountAmount(BigDecimal.ZERO)
                .build();
    }

    private void validateRequest(PromoCodeRequest r) {
        if (r == null || r.getCode() == null || r.getCode().isBlank() || r.getCode().trim().length() > 50
                || r.getDiscountType() == null || r.getDiscountValue() == null || r.getDiscountValue().signum() < 0
                || r.getDiscountValue().compareTo(new BigDecimal("99999999.99")) > 0
                || (r.getDiscountType() == DiscountType.PERCENTAGE && r.getDiscountValue().compareTo(new BigDecimal("100")) > 0)
                || (r.getMaxDiscountAmount() != null && r.getMaxDiscountAmount().signum() < 0)
                || (r.getMinimumOrderAmount() != null && r.getMinimumOrderAmount().signum() < 0)
                || (r.getTotalUsageLimit() != null && r.getTotalUsageLimit() < 1)
                || (r.getPerCustomerLimit() != null && r.getPerCustomerLimit() < 1)
                || (r.getStartDate() != null && r.getExpiryDate() != null && r.getStartDate().isAfter(r.getExpiryDate())))
            throw new PromoCodeInvalidException("Enter a valid discount (percentage 0–100), positive limits and an ordered date range.");
        if (r.getCustomerEligibility() == CustomerEligibility.SELECTED_CUSTOMERS &&
                (r.getEligibleCustomerEmails() == null || r.getEligibleCustomerEmails().isEmpty()))
            throw new PromoCodeInvalidException("Select at least one eligible customer.");
    }

    @Transactional
    public PromoValidationResponse lockAndValidateCode(String code, String email, BigDecimal subtotal) {
        promoCodeRepository.lockByCode(code.trim()).orElseThrow(() -> new PromoCodeNotFoundException(code));
        return validateCode(code, email, subtotal);
    }

    // The caller holds the order lock; promotion locks always precede product locks.
    @Transactional
    public boolean confirmReservation(Order order) {
        if (order.getAppliedPromoCode() == null) return true;
        PromoCode p = promoCodeRepository.lockById(order.getAppliedPromoCode().getId()).orElse(null);
        if (p == null || !Boolean.TRUE.equals(p.getActive())) return false;
        LocalDate today = LocalDate.now();
        if ((p.getStartDate() != null && p.getStartDate().isAfter(today))
                || (p.getExpiryDate() != null && p.getExpiryDate().isBefore(today))) return false;
        var cutoff = java.time.LocalDateTime.now().minusHours(24);
        if (p.getTotalUsageLimit() != null && promoCodeUsageRepository.countReserved(p, null, order.getId(), cutoff) >= p.getTotalUsageLimit()) return false;
        if (p.getPerCustomerLimit() != null && promoCodeUsageRepository.countReserved(p, order.getUser(), order.getId(), cutoff) >= p.getPerCustomerLimit()) return false;
        if (p.getCustomerEligibility() == CustomerEligibility.SELECTED_CUSTOMERS &&
                p.getEligibleCustomerEmails().stream().noneMatch(e -> e.equalsIgnoreCase(order.getUser().getEmail()))) return false;
        if (p.getCustomerEligibility() == CustomerEligibility.NEW_CUSTOMERS &&
                orderRepository.countCompletedOrdersByUserId(order.getUser().getId()) > 0) return false;
        return true;
    }
}
