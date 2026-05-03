package com.aplicationproject.demo.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_order_user", columnList = "user_id"),
        @Index(name = "idx_order_status", columnList = "status"),
        @Index(name = "idx_order_date", columnList = "order_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Her sipariş bir kullanıcıya aittir
    @NotNull(message = "Kullanıcı boş olamaz")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference
    private User user;

    @NotBlank(message = "Sipariş durumu boş olamaz")
    private String status;

    @NotNull(message = "Toplam tutar boş olamaz")
    @Column(name = "grand_total")
    private BigDecimal grandTotal;

    @NotNull(message = "Sipariş tarihi boş olamaz")
    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "fulfilment")
    private String fulfilment;

    // Bir siparişin birden fazla kalemi olabilir
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<OrderItem> orderItems = new ArrayList<>();

    // Bir siparişin bir kargosu olabilir
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private Shipment shipment;
}
