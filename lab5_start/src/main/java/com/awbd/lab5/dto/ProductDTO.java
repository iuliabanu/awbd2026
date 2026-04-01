package com.awbd.lab5.dto;

import com.awbd.lab5.domain.Currency;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ProductDTO {

    private Long id;
    private String name;
    private String code;
    private Double reservePrice;
    private Boolean restored;
    private Currency currency;

    private InfoDTO info;
    private Long sellerId;
    private List<Long> categoryIds;

}

