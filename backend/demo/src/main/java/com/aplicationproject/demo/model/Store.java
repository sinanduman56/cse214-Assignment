package com.aplicationproject.demo.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "stores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Mağaza adı boş olamaz")
    @Column(nullable = false)
    private String name;

    private String location;

    @Column(nullable = false)
    private boolean active = true;

    // İLİŞKİ: Mağaza bir corporate user'a aittir
    @NotNull(message = "Mağaza sahibi boş olamaz")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnoreProperties({"stores", "orders", "reviews", "customerProfile", "passwordHash", "authorities", "password", "accountNonExpired", "accountNonLocked", "credentialsNonExpired", "enabled", "hibernateLazyInitializer", "handler", "username"})
    private User owner;

    // İLİŞKİ: Bir mağazanın birçok ürünü olabilir
    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Product> products = new ArrayList<>();
}