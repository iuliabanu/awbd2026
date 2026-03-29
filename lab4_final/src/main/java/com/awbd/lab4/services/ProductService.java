package com.awbd.lab4.services;

import com.awbd.lab4.dto.ProductDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProductService {
    List<ProductDTO> findAll();
    ProductDTO findById(Long id);
    ProductDTO save(ProductDTO product);
    void deleteById(Long id);
    void savePhotoFile(ProductDTO productDTO, MultipartFile file);
}

