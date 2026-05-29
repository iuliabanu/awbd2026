package com.awbd.cartapi.dto;
import lombok.Data;
import java.util.List;
@Data
public class CheckoutRequest {
    private String userId;
    private List<CartItemDto> items;
}