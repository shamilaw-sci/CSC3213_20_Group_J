package com.icrowd_api.features.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findForCheckout(@org.springframework.data.repository.query.Param("email") String email);
    Optional<User> findByEmail(String email);
    boolean existsByRole(String role);
    boolean existsByEmail(String email);
}
