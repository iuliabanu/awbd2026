package com.awbd.cartapi.repository;
import com.awbd.cartapi.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}