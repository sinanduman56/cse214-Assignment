package com.aplicationproject.demo.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "customer_profiles")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class CustomerProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer age;
    private String city;
    
    @Column(name = "membership_type")
    private String membershipType;

    @Column(name = "total_spend")
    private Double totalSpend;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    @JsonBackReference(value = "user-profile")
    private User user;
}