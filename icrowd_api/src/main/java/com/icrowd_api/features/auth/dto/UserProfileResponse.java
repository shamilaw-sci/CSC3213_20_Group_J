package com.icrowd_api.features.auth.dto;

import com.icrowd_api.features.auth.Address;
import com.icrowd_api.features.auth.Admin;
import com.icrowd_api.features.auth.Customer;
import com.icrowd_api.features.auth.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private Long customerId;
    private Long adminId;
    private String email;
    private String role;
    private String accountStatus;
    private String firstName;
    private String lastName;
    private String phone;
    private LocalDate dateOfBirth;
    private String profileImage;
    private String address;
    private String district;
    private String city;

    @Builder.Default
    private List<AddressDto> addresses = new ArrayList<>();

    public static UserProfileResponse fromUser(User user) {
        if (user == null) return null;

        UserProfileResponseBuilder builder = UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus());

        if (user.getCustomer() != null) {
            Customer c = user.getCustomer();
            builder.customerId(c.getId())
                    .firstName(c.getFirstName())
                    .lastName(c.getLastName())
                    .phone(c.getPhone())
                    .dateOfBirth(c.getDateOfBirth())
                    .profileImage(c.getProfileImage());

            if (c.getAddresses() != null && !c.getAddresses().isEmpty()) {
                List<AddressDto> addressDtos = c.getAddresses().stream()
                        .map(AddressDto::fromEntity)
                        .collect(Collectors.toList());
                builder.addresses(addressDtos);

                // Extract primary or first address
                Address defaultAddr = c.getAddresses().stream()
                        .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                        .findFirst()
                        .orElse(c.getAddresses().get(0));

                builder.address(defaultAddr.getAddressLine1())
                        .city(defaultAddr.getCity())
                        .district(defaultAddr.getDistrict());
            }
        } else if (user.getAdmin() != null) {
            Admin a = user.getAdmin();
            builder.adminId(a.getId())
                    .firstName(a.getFirstName())
                    .lastName(a.getLastName())
                    .phone(a.getPhone());
        }

        return builder.build();
    }
}
