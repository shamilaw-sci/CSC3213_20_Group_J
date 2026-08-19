package com.icrowd_api.features.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public String registerUser(User user) {
        Optional<User> existingUser = userRepository.findByEmail(user.getEmail());
        if (existingUser.isPresent()) {
            return "Email already exists!";
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return "User registered successfully!";
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public String promoteToAdmin(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return "User not found with email: " + email;
        }
        User user = userOpt.get();
        user.setRole("ADMIN");
        userRepository.save(user);
        return "User promoted to ADMIN successfully!";
    }

    public String demoteToUser(Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return "User not found";
        }
        User user = userOpt.get();
        user.setRole("USER");
        userRepository.save(user);
        return "User demoted to USER successfully!";
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public boolean existsByRole(String role) {
        return userRepository.existsByRole(role);
    }
}
