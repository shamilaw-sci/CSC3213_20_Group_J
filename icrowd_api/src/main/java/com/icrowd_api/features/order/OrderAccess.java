package com.icrowd_api.features.order;
import com.icrowd_api.features.auth.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
public final class OrderAccess {
    private OrderAccess() {}
    public static void requireOwner(UserRepository users, Order order, String email) {
        var actor = users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));
        if (order.getUser() == null || actor.getId() == null || !actor.getId().equals(order.getUser().getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }
}
