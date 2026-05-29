package com.awbd.cartapi.dto;
import com.awbd.cartapi.entity.Order;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
@Data
@Builder
public class CheckoutResponse {
    private Long orderId;
    private Order.Status status;
    private BigDecimal totalAmount;
    private int pointsAwarded;
    private int totalPoints;
    private List<CartItemDto> items;
    private String message;
}