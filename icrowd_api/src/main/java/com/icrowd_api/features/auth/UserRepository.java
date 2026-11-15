package com.icrowd_api.features.auth;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    boolean existsByEmailIgnoreCase(String email);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.role = 'ADMIN' ORDER BY u.id")
    java.util.List<User> lockAdministrators();

    long countByRoleAndAccountStatus(String role, String accountStatus);

    @Query("SELECT u FROM User u LEFT JOIN u.customer c LEFT JOIN u.admin a " +
           "WHERE (:search IS NULL OR :search = '' " +
           "       OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "       OR LOWER(COALESCE(c.firstName, a.firstName, '')) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "       OR LOWER(COALESCE(c.lastName, a.lastName, '')) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:role IS NULL OR :role = '' OR u.role = :role)")
    Page<User> searchUsersForAdmin(@Param("search") String search,
                                   @Param("role") String role,
                                   Pageable pageable);
}
