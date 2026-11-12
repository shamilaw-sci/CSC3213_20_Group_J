package com.icrowd_api.features.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByCustomerId(Long customerId);
    List<Address> findByCustomerIdOrderByCreatedAtAsc(Long customerId);
    List<Address> findByCustomerUserEmail(String email);
    Optional<Address> findByIdAndCustomerUserEmail(Long id, String email);
    Optional<Address> findByCustomerIdAndIsDefaultTrue(Long customerId);

    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.customer.id = :customerId")
    void clearDefaultAddressesForCustomer(@Param("customerId") Long customerId);
}
