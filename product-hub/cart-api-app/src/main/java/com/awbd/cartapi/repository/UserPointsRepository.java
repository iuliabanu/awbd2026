package com.awbd.cartapi.repository;
import com.awbd.cartapi.entity.UserPoints;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface UserPointsRepository extends JpaRepository<UserPoints, Long> {
    Optional<UserPoints> findByUserId(String userId);
}