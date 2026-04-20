package com.awbd.lab5.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class InfoDTO {

    private Long id;
    private String description;
    private byte[] photo;

}

