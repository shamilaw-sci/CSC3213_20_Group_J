package com.icrowd_api.features.marketing;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.net.URI;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MarketingControllerTest {
    private final MarketingService service = mock(MarketingService.class);
    private final SubscriptionConfirmation confirmation = mock(SubscriptionConfirmation.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new MarketingController(service, confirmation)).build();

    private void submitEmailForm(String endpoint, String token, String expectedText) throws Exception {
        URI emailLink = URI.create(endpoint + "?token=" + token);
        String html = mvc.perform(get(emailLink)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        verifyNoInteractions(service, confirmation);
        // Follow the form the way a browser does. A missing action retains the
        // query token and submits a second token from the hidden field.
        var action = Pattern.compile("<form[^>]*action=['\"]([^'\"]*)['\"]").matcher(html);
        URI target = action.find() ? emailLink.resolve(action.group(1)) : emailLink;
        var hidden = Pattern.compile("name='token' value='([^']*)'").matcher(html);
        assertTrue(hidden.find());
        mvc.perform(post(target).contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .content("token=" + hidden.group(1)))
                .andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.containsString(expectedText)));
    }

    @Test void confirmationLinkSubmitsOneTokenAndConfirms() throws Exception {
        String token = "a".repeat(64);
        when(confirmation.confirm(token)).thenReturn(true);
        submitEmailForm("/api/marketing/confirm", token, "Your subscription is confirmed.");
        verify(confirmation).confirm(token);
        verifyNoInteractions(service);
    }

    @Test void unsubscribeLinkSubmitsOneToken() throws Exception {
        String token = "b".repeat(72);
        submitEmailForm("/api/marketing/unsubscribe", token, "You have been unsubscribed.");
        verify(service).unsubscribe(token);
        verifyNoInteractions(confirmation);
    }

    @Test void customerSavesPreferencesWithoutSendingResponseOnlyConfirmationStatus() throws Exception {
        var input = new MarketingService.PreferenceView(true, "office", "");
        when(service.savePreference("customer@example.test", input))
            .thenReturn(new MarketingService.PreferenceView(false, "office", "", true));
        mvc.perform(put("/api/marketing/preferences").principal(() -> "customer@example.test")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"subscribed\":true,\"interests\":\"office\",\"brands\":\"\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.pendingConfirmation").value(true));
        verify(service).savePreference("customer@example.test", input);
    }

    @Test void confirmationFlagCannotEnableSubscriptionAndConsentMustBeExplicit() throws Exception {
        mvc.perform(put("/api/marketing/preferences").principal(() -> "customer@example.test")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"interests\":\"office\",\"brands\":\"\",\"pendingConfirmation\":true}"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
}
