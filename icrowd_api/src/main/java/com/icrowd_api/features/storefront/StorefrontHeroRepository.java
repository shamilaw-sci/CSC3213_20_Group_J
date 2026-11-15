package com.icrowd_api.features.storefront;
import org.springframework.data.jpa.repository.*;
import java.util.Optional;
public interface StorefrontHeroRepository extends JpaRepository<StorefrontHero,Long> {
    interface Metadata { String getHeadline(); String getSubtitle(); String getImageVersion(); }
    @Query("select h.headline as headline,h.subtitle as subtitle,h.imageVersion as imageVersion from StorefrontHero h where h.id=1")
    Optional<Metadata> metadata();
}
