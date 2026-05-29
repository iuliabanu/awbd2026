package com.awbd.cartapi.saga;
import com.awbd.cartapi.client.ProductStockClient;
import com.awbd.cartapi.dto.CartItemDto;
import com.awbd.cartapi.dto.CheckoutRequest;
import com.awbd.cartapi.entity.Order;
import com.awbd.cartapi.entity.OrderItem;
import com.awbd.cartapi.entity.UserPoints;
import com.awbd.cartapi.repository.OrderRepository;
import com.awbd.cartapi.repository.UserPointsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
/**
 * Orchestration-based Saga for the checkout flow.
 *
 * Happy path:
 *   Step 1 — Validate cart (local)
 *   Step 2 — Persist Order as PENDING (local)
 *   Step 3 — Decrement stock for each item via product-api (remote, circuit-breaker)
 *   Step 4 — Award buyback points (local)
 *   Step 5 — Confirm order as CONFIRMED (local)
 *
 * Compensations (executed in reverse order on failure):
 *   Step 3 fails → mark Order FAILED
 *   Step 4 fails → restore stock, mark Order FAILED
 *   Step 5 fails → deduct points, restore stock, mark Order FAILED
 */
@Component
public class CheckoutSaga {
    private static final Logger log = LoggerFactory.getLogger(CheckoutSaga.class);
    private final OrderRepository orderRepository;
    private final UserPointsRepository userPointsRepository;
    private final ProductStockClient productStockClient;
    @Value("${cart.points.rate:10}")
    private int pointsRate;
    public CheckoutSaga(OrderRepository orderRepository,
                        UserPointsRepository userPointsRepository,
                        ProductStockClient productStockClient) {
        this.orderRepository = orderRepository;
        this.userPointsRepository = userPointsRepository;
        this.productStockClient = productStockClient;
    }
    @Transactional
    public Order execute(CheckoutRequest request) {
        // ── Step 1: Validate ────────────────────────────────────────────────
        log.info("[SAGA] Step 1 — Validating cart for user {}", request.getUserId());
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }
        for (CartItemDto item : request.getItems()) {
            if (item.getQuantity() <= 0) {
                throw new IllegalArgumentException("Invalid quantity for product " + item.getProductId());
            }
        }
        // ── Step 2: Persist Order as PENDING ────────────────────────────────
        log.info("[SAGA] Step 2 — Creating PENDING order for user {}", request.getUserId());
        BigDecimal total = request.getItems().stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Order order = new Order();
        order.setUserId(request.getUserId());
        order.setStatus(Order.Status.PENDING);
        order.setTotalAmount(total);
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItemDto dto : request.getItems()) {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProductId(dto.getProductId());
            item.setProductName(dto.getProductName());
            item.setQuantity(dto.getQuantity());
            item.setUnitPrice(dto.getUnitPrice());
            orderItems.add(item);
        }
        order.setItems(orderItems);
        orderRepository.save(order);
        // ── Step 3: Decrement stock via product-api ──────────────────────────
        log.info("[SAGA] Step 3 — Decrementing stock for {} items", request.getItems().size());
        List<CartItemDto> stockUpdated = new ArrayList<>();
        try {
            for (CartItemDto item : request.getItems()) {
                productStockClient.updateStock(item.getProductId(), -item.getQuantity());
                stockUpdated.add(item);
            }
        } catch (Exception e) {
            log.error("[SAGA] Step 3 FAILED — compensating: mark order {} as FAILED. Reason: {}", order.getId(), e.getMessage());
            // Compensate: restore already-decremented stock
            for (CartItemDto item : stockUpdated) {
                try { productStockClient.updateStock(item.getProductId(), item.getQuantity()); }
                catch (Exception ex) { log.error("[SAGA] Compensation failed for product {}: {}", item.getProductId(), ex.getMessage()); }
            }
            order.setStatus(Order.Status.FAILED);
            orderRepository.save(order);
            throw new RuntimeException("Checkout failed at stock update: " + e.getMessage(), e);
        }
        // ── Step 4: Award buyback points ─────────────────────────────────────
        log.info("[SAGA] Step 4 — Awarding buyback points for user {}", request.getUserId());
        int pointsToAward = total.divide(BigDecimal.valueOf(pointsRate), 0, java.math.RoundingMode.DOWN).intValue();
        UserPoints userPoints;
        try {
            userPoints = userPointsRepository.findByUserId(request.getUserId())
                    .orElseGet(() -> {
                        UserPoints up = new UserPoints();
                        up.setUserId(request.getUserId());
                        up.setPoints(0);
                        return up;
                    });
            userPoints.setPoints(userPoints.getPoints() + pointsToAward);
            userPointsRepository.save(userPoints);
        } catch (Exception e) {
            log.error("[SAGA] Step 4 FAILED — compensating: restore stock, mark order {} FAILED", order.getId());
            for (CartItemDto item : stockUpdated) {
                try { productStockClient.updateStock(item.getProductId(), item.getQuantity()); }
                catch (Exception ex) { log.error("[SAGA] Compensation failed for product {}: {}", item.getProductId(), ex.getMessage()); }
            }
            order.setStatus(Order.Status.FAILED);
            orderRepository.save(order);
            throw new RuntimeException("Checkout failed at points award: " + e.getMessage(), e);
        }
        // ── Step 5: Confirm order ────────────────────────────────────────────
        log.info("[SAGA] Step 5 — Confirming order {}", order.getId());
        try {
            order.setStatus(Order.Status.CONFIRMED);
            orderRepository.save(order);
        } catch (Exception e) {
            log.error("[SAGA] Step 5 FAILED — compensating fully for order {}", order.getId());
            userPoints.setPoints(userPoints.getPoints() - pointsToAward);
            userPointsRepository.save(userPoints);
            for (CartItemDto item : stockUpdated) {
                try { productStockClient.updateStock(item.getProductId(), item.getQuantity()); }
                catch (Exception ex) { log.error("[SAGA] Compensation failed for product {}: {}", item.getProductId(), ex.getMessage()); }
            }
            order.setStatus(Order.Status.FAILED);
            orderRepository.save(order);
            throw new RuntimeException("Checkout failed at order confirmation: " + e.getMessage(), e);
        }
        log.info("[SAGA] Completed — order {} CONFIRMED, {} points awarded to user {}",
                order.getId(), pointsToAward, request.getUserId());
        return order;
    }
}