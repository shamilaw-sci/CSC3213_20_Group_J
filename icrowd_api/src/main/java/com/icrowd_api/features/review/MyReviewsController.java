package com.icrowd_api.features.review;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
@RestController
@RequestMapping("/api/users/me/reviews")
public class MyReviewsController {
    private final ReviewService service;
    public MyReviewsController(ReviewService service) { this.service=service; }
    @GetMapping public Object mine(Authentication auth) { return service.mine(auth.getName()); }
    @GetMapping("/pending") public Object pending(Authentication auth) { return service.pending(auth.getName()); }
}
