package com.icrowd_api.config;
import jakarta.annotation.PostConstruct;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;
@Component
public class EnvironmentGuard {
    private final Environment environment;
    public EnvironmentGuard(Environment environment) {this.environment=environment;}
    @PostConstruct void validate() {
        if(environment.acceptsProfiles(Profiles.of("prod")) && environment.acceptsProfiles(Profiles.of("local","demo")))
            throw new IllegalStateException("Production cannot use disposable local storage or demonstration data.");
    }
}
