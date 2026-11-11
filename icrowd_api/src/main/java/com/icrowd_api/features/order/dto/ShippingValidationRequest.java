package com.icrowd_api.features.order.dto;

import com.icrowd_api.features.order.DeliveryType;
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
public class ShippingValidationRequest {

    @NotBlank(message = "Recipient full name is required")
    private String recipientName;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "Email address is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Street address is required")
    private String address;

    @NotBlank(message = "District is required")
    private String district;

    private Double latitude;
    private Double longitude;

    @NotNull(message = "Delivery method is required")
    private DeliveryType deliveryType; // STANDARD or FAST

    private Boolean saveAddress;
    private String promoCode;
    private String addressLabel; // e.g. "HOME", "WORK"

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<CheckoutItemDto> items;
}
