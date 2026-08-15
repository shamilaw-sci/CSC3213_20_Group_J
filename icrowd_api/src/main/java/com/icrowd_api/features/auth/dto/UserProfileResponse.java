package com.icrowd_api.features.auth.dto;

import com.icrowd_api.features.auth.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String district;
    private String city;
    private String role;

    public static UserProfileResponse fromUser(User user) {
        if (user == null) return null;
        return UserProfileResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .district(user.getDistrict())
                .city(user.getCity())
                .role(user.getRole())
                .build();
    }
}
