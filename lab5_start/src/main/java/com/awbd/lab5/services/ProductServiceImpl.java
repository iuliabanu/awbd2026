package com.awbd.lab5.services;

import com.awbd.lab5.domain.Category;
import com.awbd.lab5.domain.Info;
import com.awbd.lab5.domain.Product;
import com.awbd.lab5.dto.ProductDTO;
import com.awbd.lab5.repositories.CategoryRepository;
import com.awbd.lab5.repositories.ParticipantRepository;
import com.awbd.lab5.repositories.ProductRepository;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ProductServiceImpl implements ProductService {

    ProductRepository productRepository;
    ParticipantRepository participantRepository;
    CategoryRepository categoryRepository;
    ModelMapper modelMapper;

    public ProductServiceImpl(ProductRepository productRepository,
                              ParticipantRepository participantRepository,
                              CategoryRepository categoryRepository,
                              ModelMapper modelMapper) {
        this.productRepository = productRepository;
        this.participantRepository = participantRepository;
        this.categoryRepository = categoryRepository;
        this.modelMapper = modelMapper;
    }

    private ProductDTO toDto(Product product) {
        ProductDTO dto = modelMapper.map(product, ProductDTO.class);
        if (product.getCategories() != null) {
            dto.setCategoryIds(product.getCategories().stream()
                    .map(Category::getId)
                    .collect(Collectors.toList()));
        }
        if (product.getSeller() != null) {
            dto.setSellerId(product.getSeller().getId());
        }
        return dto;
    }

    @Override
    public List<ProductDTO> findAll() {
        List<Product> products = new LinkedList<>();
        productRepository.findAll(Sort.by("name"))
                .iterator().forEachRemaining(products::add);

        return products.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public ProductDTO findById(Long id) {
        Optional<Product> productOptional = productRepository.findById(id);
        if (!productOptional.isPresent()) {
            throw new RuntimeException("Product not found!");
        }
        return toDto(productOptional.get());
    }

    @Override
    public ProductDTO save(ProductDTO productDTO) {
        Product product;
        if (productDTO.getId() != null) {
            product = productRepository.findById(productDTO.getId())
                    .orElseThrow(() -> new RuntimeException("Product not found!"));
        } else {
            product = new Product();
        }

        // Map scalar fields explicitly so updates do not drop existing associations.
        product.setName(productDTO.getName());
        product.setCode(productDTO.getCode());
        product.setReservePrice(productDTO.getReservePrice());
        product.setRestored(productDTO.getRestored());
        product.setCurrency(productDTO.getCurrency());

        if (productDTO.getSellerId() != null) {
            participantRepository.findById(productDTO.getSellerId())
                    .ifPresent(product::setSeller);
        } else {
            product.setSeller(null);
        }

        // One-to-one owner is Info.product; keep both sides in sync.
        if (productDTO.getInfo() != null) {
            Info info = product.getInfo();
            if (info == null) {
                info = new Info();
                product.setInfo(info);
            }
            info.setDescription(productDTO.getInfo().getDescription());
            if (productDTO.getInfo().getPhoto() != null) {
                info.setPhoto(productDTO.getInfo().getPhoto());
            }
            info.setProduct(product);
        } else {
            product.setInfo(null);
        }

        List<Category> newCategories = new LinkedList<>();
        if (productDTO.getCategoryIds() != null && !productDTO.getCategoryIds().isEmpty()) {
            categoryRepository.findAllById(productDTO.getCategoryIds()).forEach(newCategories::add);
        }

        List<Category> oldCategories = product.getCategories() == null
                ? new LinkedList<>()
                : new LinkedList<>(product.getCategories());

        for (Category oldCat : oldCategories) {
            if (oldCat.getProducts() != null) {
                oldCat.getProducts().remove(product);
            }
        }

        for (Category newCat : newCategories) {
            if (newCat.getProducts() != null && !newCat.getProducts().contains(product)) {
                newCat.getProducts().add(product);
            }
        }

        product.setCategories(newCategories);

        Product savedProduct = productRepository.save(product);
        return toDto(savedProduct);
    }

    @Override
    public void deleteById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found!"));

        if (product.getCategories() != null) {
            for (Category category : new LinkedList<>(product.getCategories())) {
                if (category.getProducts() != null) {
                    category.getProducts().remove(product);
                }
            }
            product.getCategories().clear();
        }

        if (product.getSeller() != null && product.getSeller().getProducts() != null) {
            product.getSeller().getProducts().remove(product);
        }
        product.setSeller(null);

        if (product.getInfo() != null) {
            product.getInfo().setProduct(null);
            product.setInfo(null);
        }

        productRepository.save(product);
        productRepository.deleteById(id);
    }

    @Override
    public void savePhotoFile(ProductDTO productDTO, MultipartFile file) {
        try {
            // First persist all scalar fields / relations via the shared save() logic.
            ProductDTO saved = save(productDTO);

            // Then attach the photo to the now-persisted product.
            Product product = productRepository.findById(saved.getId())
                    .orElseThrow(() -> new RuntimeException("Product not found!"));

            byte[] photoBytes = file.getBytes();

            Info info = product.getInfo();
            if (info == null) {
                info = new Info();
                product.setInfo(info);
            }
            info.setProduct(product);

            if (photoBytes.length > 0) {
                info.setPhoto(photoBytes);
            }

            productRepository.save(product);
        } catch (IOException e) {
            log.error("Error saving photo file: {}", e.getMessage());
        }
    }
}


