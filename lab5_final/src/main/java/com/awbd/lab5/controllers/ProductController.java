package com.awbd.lab5.controllers;

import com.awbd.lab5.dto.CategoryDTO;
import com.awbd.lab5.dto.ProductDTO;
import com.awbd.lab5.services.CategoryService;
import com.awbd.lab5.services.ProductService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Controller
@RequestMapping("/products")
public class ProductController {

    ProductService productService;
    CategoryService categoryService;

    public ProductController(ProductService productService, CategoryService categoryService) {
        this.productService = productService;
        this.categoryService = categoryService;
    }

    // Step 11 – list all products
    @RequestMapping("")
    public String productList(Model model) {
        List<ProductDTO> products = productService.findAll();
        model.addAttribute("products", products);
        return "productList";
    }

    // Step 13 – show edit form
    @RequestMapping("/edit/{id}")
    public String edit(@PathVariable String id, Model model) {
        model.addAttribute("product", productService.findById(Long.valueOf(id)));
        List<CategoryDTO> categoriesAll = categoryService.findAll();
        model.addAttribute("categoriesAll", categoriesAll);
        return "productForm";
    }

    // Step 13 – new product form
    @RequestMapping("/form")
    public String productForm(Model model) {
        ProductDTO product = new ProductDTO();
        model.addAttribute("product", product);
        List<CategoryDTO> categoriesAll = categoryService.findAll();
        model.addAttribute("categoriesAll", categoriesAll);
        return "productForm";
    }

    // Step 13 – delete
    @RequestMapping("/delete/{id}")
    public String deleteById(@PathVariable String id) {
        productService.deleteById(Long.valueOf(id));
        return "redirect:/products";
    }

    // Step 14 – save / update (with optional image upload)
    @PostMapping("")
    public String saveOrUpdate(@ModelAttribute ProductDTO product,
                               @RequestParam("imagefile") MultipartFile file) {
        if (file.isEmpty())
            productService.save(product);
        else
            productService.savePhotoFile(product, file);

        return "redirect:/products";
    }

    // Step 14 – serve product image
    @GetMapping("/getimage/{id}")
    public void downloadImage(@PathVariable String id, HttpServletResponse response) throws IOException {
        ProductDTO productDTO = productService.findById(Long.valueOf(id));

        if (productDTO.getInfo() != null && productDTO.getInfo().getPhoto() != null) {
            byte[] photo = productDTO.getInfo().getPhoto();
            response.setContentType("image/jpeg");
            try (InputStream is = new ByteArrayInputStream(photo)) {
                StreamUtils.copy(is, response.getOutputStream());
            }
        }
    }
}

