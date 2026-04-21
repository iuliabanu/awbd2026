package com.awbd.lab6.services;

import com.awbd.lab6.dto.CategoryDTO;

import java.util.List;

public interface CategoryService {
    List<CategoryDTO> findAll();
    CategoryDTO findById(Long id);
    CategoryDTO save(CategoryDTO category);
    void deleteById(Long id);
}

