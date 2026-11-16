package com.icrowd_api.features.marketing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface EmailPreferenceRepository extends JpaRepository<EmailPreference,Long> {
    List<EmailPreference> findBySubscribedTrue();
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    Optional<EmailPreference> findByUnsubscribeToken(String token);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    Optional<EmailPreference> findByConfirmationTokenHash(String hash);
    List<EmailPreference> findTop50BySubscribedTrueAndUserIdGreaterThanOrderByUserIdAsc(Long afterUserId);
}
