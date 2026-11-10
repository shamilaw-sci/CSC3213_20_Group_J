package com.icrowd_api.features.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByCustomerId(Long customerId);
    List<Address> findByCustomerUserEmail(String email);
    Optional<Address> findByIdAndCustomerUserEmail(Long id, String email);
    Optional<Address> findByCustomerIdAndIsDefaultTrue(Long customerId);
}
