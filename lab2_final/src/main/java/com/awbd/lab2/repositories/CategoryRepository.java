package com.awbd.lab2.repositories;
import com.awbd.lab2.domain.Category;
import org.springframework.data.repository.CrudRepository;

public interface CategoryRepository extends CrudRepository<Category, Long> {

}