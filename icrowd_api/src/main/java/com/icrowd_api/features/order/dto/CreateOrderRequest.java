package com.icrowd_api.features.order.dto;

import com.icrowd_api.features.order.DeliveryType;
import com.icrowd_api.features.order.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    @jakarta.validation.constraints.Size(max = 100)
    private String checkoutKey;
    private String promoCode;

    @NotBlank(message = "Recipient full name is required")
    private String shippingFullName;

    @NotBlank(message = "Phone number is required")
    private String shippingPhone;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String shippingEmail;

    @NotBlank(message = "Street address is required")
    private String shippingAddress;

    @NotBlank(message = "District is required")
    private String shippingDistrict;

    private Double shippingLat;
    private Double shippingLng;

    @NotNull(message = "Delivery type is required")
    private DeliveryType deliveryType;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<CheckoutItemDto> items;
}
