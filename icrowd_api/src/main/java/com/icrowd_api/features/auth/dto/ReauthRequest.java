package com.icrowd_api.features.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for reauthentication on sensitive admin operations.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReauthRequest {

    @NotBlank(message = "Password is required for this operation")
    private String password;
}
