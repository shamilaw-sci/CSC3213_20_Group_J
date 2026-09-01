package com.icrowd_api.features.auth.dto;

import com.icrowd_api.features.auth.Address;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {

    private Long id;
    private String label; // Home, Work, Office, Other
    private String recipientName;
    private String phone;

    @NotBlank(message = "Address line is required")
    private String address; // Address line 1 alias for frontend ease

    private String addressLine1;
    private String addressLine2;

    @NotBlank(message = "City is required")
    private String city;

    private String district;
    private String province;
    private String postalCode;
    private String country;
    private Boolean isDefault;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AddressDto fromEntity(Address address) {
        if (address == null) return null;
        return AddressDto.builder()
                .id(address.getId())
                .label(address.getAddressType())
                .recipientName(address.getRecipientName())
                .phone(address.getPhone())
                .address(address.getAddressLine1())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .city(address.getCity())
                .district(address.getDistrict())
                .province(address.getProvince())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .isDefault(Boolean.TRUE.equals(address.getIsDefault()))
                .latitude(address.getLatitude())
                .longitude(address.getLongitude())
                .createdAt(address.getCreatedAt())
                .updatedAt(address.getUpdatedAt())
                .build();
    }
}
