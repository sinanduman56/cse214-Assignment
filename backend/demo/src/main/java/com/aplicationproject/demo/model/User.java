package com.aplicationproject.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_user_email", columnList = "email"),
        @Index(name = "idx_user_role", columnList = "role_type")
})
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties({"passwordHash", "password", "authorities", "accountNonExpired", "accountNonLocked", "credentialsNonExpired", "enabled", "username", "hibernateLazyInitializer", "handler"})
public class User implements UserDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Email boş olamaz")
    @Email(message = "Geçerli bir email adresi giriniz")
    @Column(unique = true, nullable = false)
    private String email;
    
    @NotBlank(message = "Şifre boş olamaz")
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @NotBlank(message = "Rol tipi boş olamaz")
    @Column(name = "role_type", nullable = false)
    private String roleType;

    @NotBlank(message = "Cinsiyet boş olamaz")
    private String gender;

    @Column(nullable = false)
    private boolean active = true;

    // Bir kullanıcının birden fazla siparişi olabilir
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Order> orders = new ArrayList<>();

    // Bir kullanıcının birden fazla yorumu olabilir
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference(value = "user-reviews")
    private List<Review> reviews = new ArrayList<>();

    // Corporate user'ın mağazaları olabilir
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Store> stores = new ArrayList<>();

    // Kullanıcının profil detayları
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference(value = "user-profile")
    private CustomerProfile customerProfile;

   
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
       
        return List.of(new SimpleGrantedAuthority(roleType));
    }

    @Override
    public String getPassword() {
        // Spring şifre kontrol ederken bizim passwordHash e bakar
        return this.passwordHash;
    }

    @Override
    public String getUsername() {
        
        return this.email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; 
    }

    @Override
    public boolean isAccountNonLocked() {
        return this.active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; 
    }

    @Override
    public boolean isEnabled() {
        return this.active; 
    }
}