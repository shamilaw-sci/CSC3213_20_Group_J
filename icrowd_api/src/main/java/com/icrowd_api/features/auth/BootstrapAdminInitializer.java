package com.icrowd_api.features.auth;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Explicit one-time administrator provisioning, without demonstration data. */
@Component @Profile("bootstrap-admin")
public class BootstrapAdminInitializer implements CommandLineRunner {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    @Value("${BOOTSTRAP_ADMIN_EMAIL:}") private String email;
    @Value("${BOOTSTRAP_ADMIN_PASSWORD:}") private String password;
    public BootstrapAdminInitializer(UserRepository users,PasswordEncoder passwords) {this.users=users;this.passwords=passwords;}
    @Override @Transactional public void run(String... args) {
        if(email==null || !email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+") || password==null || password.length()<12)
            throw new IllegalStateException("Set BOOTSTRAP_ADMIN_EMAIL and a BOOTSTRAP_ADMIN_PASSWORD of at least 12 characters.");
        if(users.existsByRole("ADMIN")) throw new IllegalStateException("An administrator already exists. Remove the bootstrap-admin profile.");
        if(users.existsByEmailIgnoreCase(EmailAddress.canonical(email))) throw new IllegalStateException("That account already exists. Use the reviewed account promotion process.");
        User user=User.builder().email(email).password(passwords.encode(password)).role("ADMIN").build();
        Admin profile=Admin.builder().user(user).firstName("Store").lastName("Administrator").build();user.setAdmin(profile);users.saveAndFlush(user);
    }
}
