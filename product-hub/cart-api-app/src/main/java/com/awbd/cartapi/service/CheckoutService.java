package com.awbd.cartapi.service;
import com.awbd.cartapi.dto.CartItemDto;
import com.awbd.cartapi.dto.CheckoutRequest;
import com.awbd.cartapi.dto.CheckoutResponse;
import com.awbd.cartapi.entity.Order;
import com.awbd.cartapi.entity.UserPoints;
import com.awbd.cartapi.repository.OrderRepository;
import com.awbd.cartapi.repository.UserPointsRepository;
import com.awbd.cartapi.saga.CheckoutSaga;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
@Service
public class CheckoutService {
    private final CheckoutSaga checkoutSaga;
    private final OrderRepository orderRepository;
    private final UserPointsRepository userPointsRepository;
    public CheckoutService(CheckoutSaga checkoutSaga,
                           OrderRepository orderRepository,
                           UserPointsRepository userPointsRepository) {
        this.checkoutSaga = checkoutSaga;
        this.orderRepository = orderRepository;
        this.userPointsRepository = userPointsRepository;
    }

    public CheckoutResponse checkout(CheckoutRequest request) {
        Order order = checkoutSaga.execute(request);
        int totalPoints = userPointsRepository.findByUserId(request.getUserId())
                .map(UserPoints::getPoints).orElse(0);
        int pointsAwarded = order.getTotalAmount()
                .divide(java.math.BigDecimal.valueOf(10), 0, java.math.RoundingMode.DOWN)
                .intValue();
        List<CartItemDto> items = order.getItems().stream().map(i -> {
            CartItemDto dto = new CartItemDto();
            dto.setProductId(i.getProductId());
            dto.setProductName(i.getProductName());
            dto.setQuantity(i.getQuantity());
            dto.setUnitPrice(i.getUnitPrice());
            return dto;
        }).collect(Collectors.toList());
        return CheckoutResponse.builder()
                .orderId(order.getId())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .pointsAwarded(pointsAwarded)
                .totalPoints(totalPoints)
                .items(items)
                .message("Order " + order.getStatus().name().toLowerCase())
                .build();
    }

    public List<CheckoutResponse> getOrdersByUser(String userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(order -> {
                    List<CartItemDto> items = order.getItems().stream().map(i -> {
                        CartItemDto dto = new CartItemDto();
                        dto.setProductId(i.getProductId());
                        dto.setProductName(i.getProductName());
                        dto.setQuantity(i.getQuantity());
                        dto.setUnitPrice(i.getUnitPrice());
                        return dto;
                    }).collect(Collectors.toList());
                    return CheckoutResponse.builder()
                            .orderId(order.getId())
                            .status(order.getStatus())
                            .totalAmount(order.getTotalAmount())
                            .items(items)
                            .message(order.getStatus().name().toLowerCase())
                            .build();
                })
                .collect(Collectors.toList());
    }
    public int getUserPoints(String userId) {
        return userPointsRepository.findByUserId(userId)
                .map(UserPoints::getPoints).orElse(0);
    }
}