package com.awbd.cartapi.controller;
import com.awbd.cartapi.dto.CheckoutRequest;
import com.awbd.cartapi.dto.CheckoutResponse;
import com.awbd.cartapi.service.CheckoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/cart")
public class CartController {
    private final CheckoutService checkoutService;
    public CartController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }
    /**
     * POST /api/cart/checkout
     * Triggers the CheckoutSaga. userId is extracted from the JWT token.
     */
    @PostMapping("/checkout")
    public ResponseEntity<CheckoutResponse> checkout(
            @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        String userId = jwt.getClaim("preferred_username");
        if (userId == null || userId.isBlank()) {
            userId = jwt.getSubject();
        }
        request.setUserId(userId);
        CheckoutResponse response = checkoutService.checkout(request);
        return ResponseEntity.ok(response);
    }
    /**
     * GET /api/cart/orders
     * Returns the order history for the authenticated user.
     */
    @GetMapping("/orders")
    public ResponseEntity<List<CheckoutResponse>> getMyOrders(
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaim("preferred_username");
        if (userId == null || userId.isBlank()) userId = jwt.getSubject();
        return ResponseEntity.ok(checkoutService.getOrdersByUser(userId));
    }
    /**
     * GET /api/cart/points
     * Returns the current buyback points for the authenticated user.
     */
    @GetMapping("/points")
    public ResponseEntity<Map<String, Object>> getMyPoints(
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaim("preferred_username");
        if (userId == null || userId.isBlank()) userId = jwt.getSubject();
        int points = checkoutService.getUserPoints(userId);
        return ResponseEntity.ok(Map.of("userId", userId, "points", points));
    }
}