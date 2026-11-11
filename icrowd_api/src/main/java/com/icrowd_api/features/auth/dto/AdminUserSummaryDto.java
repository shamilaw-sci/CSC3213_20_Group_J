package com.icrowd_api.features.auth.dto;

import com.icrowd_api.features.auth.Admin;
import com.icrowd_api.features.auth.Customer;
import com.icrowd_api.features.auth.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Minimal DTO for the admin user-management screen.
 * Strips PII like addresses, date of birth, profile images, and passwords.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserSummaryDto {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String role;
    private String accountStatus;
    private LocalDateTime createdAt;

    public static AdminUserSummaryDto fromUser(User user) {
        if (user == null) return null;

        AdminUserSummaryDtoBuilder builder = AdminUserSummaryDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .createdAt(user.getCreatedAt());

        if (user.getCustomer() != null) {
            Customer c = user.getCustomer();
            builder.firstName(c.getFirstName())
                    .lastName(c.getLastName())
                    .phone(c.getPhone());
        } else if (user.getAdmin() != null) {
            Admin a = user.getAdmin();
            builder.firstName(a.getFirstName())
                    .lastName(a.getLastName())
                    .phone(a.getPhone());
        }

        return builder.build();
    }
}
