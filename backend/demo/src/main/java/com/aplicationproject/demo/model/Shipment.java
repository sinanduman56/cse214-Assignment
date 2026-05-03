package com.aplicationproject.demo.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "shipments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Depo bilgisi boş olamaz")
    private String warehouse;

    @NotBlank(message = "Kargo modu boş olamaz")
    @Column(name = "shipment_mode")
    private String shipmentMode;

    @Column(name = "customer_care_calls")
    private Integer customerCareCalls;

    @Column(name = "customer_rating")
    private Integer customerRating;

    @Column(name = "cost_of_product")
    private BigDecimal costOfProduct;

    @Column(name = "prior_purchases")
    private Integer priorPurchases;

    @Column(name = "product_importance")
    private String productImportance;

    @Column(name = "discount_offered")
    private BigDecimal discountOffered;

    // İLİŞKİ: Kargo bir siparişe aittir
    @NotNull(message = "Sipariş boş olamaz")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonBackReference
    private Order order;
}