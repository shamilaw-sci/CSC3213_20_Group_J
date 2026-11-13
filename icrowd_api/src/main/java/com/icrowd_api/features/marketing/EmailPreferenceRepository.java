package com.icrowd_api.features.marketing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface EmailPreferenceRepository extends JpaRepository<EmailPreference,Long> {
    List<EmailPreference> findBySubscribedTrue();
    Optional<EmailPreference> findByUnsubscribeToken(String token);
}
