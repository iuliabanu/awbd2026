package com.awbd.lab4.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;
import java.util.List;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ParticipantDTO {

    private Long id;
    private String lastName;
    private String firstName;
    private Date birthDate;

    private List<Long> productIds;


}

