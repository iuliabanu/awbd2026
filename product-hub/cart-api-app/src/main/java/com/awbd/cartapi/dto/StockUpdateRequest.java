package com.awbd.cartapi.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
@Data
@AllArgsConstructor
public class StockUpdateRequest {
    private int delta;
}