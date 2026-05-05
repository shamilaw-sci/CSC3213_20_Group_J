package com.icrowd_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // e.g., "Smartphones"

    @Column(length = 500)
    private String description;

    @Column(nullable = false, unique = true)
    private String slug; // e.g., "smartphones" (used for clean URLs in React)
}