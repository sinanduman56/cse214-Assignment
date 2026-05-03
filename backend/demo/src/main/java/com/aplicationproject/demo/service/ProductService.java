package com.aplicationproject.demo.service;

import com.aplicationproject.demo.exception.ResourceNotFoundException;
import com.aplicationproject.demo.model.Product;
import com.aplicationproject.demo.repository.ProductRepository;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün bulunamadı, id: " + id));
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Product product) {
        if (!productRepository.existsById(product.getId())) {
            throw new ResourceNotFoundException("Güncellenecek ürün bulunamadı! ID: " + product.getId());
        }
        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, Product productDetails) {
        Product product = getProductById(id);
        product.setName(productDetails.getName());
        product.setSku(productDetails.getSku());
        product.setUnitPrice(productDetails.getUnitPrice());
        product.setImageUrl(productDetails.getImageUrl());
        product.setCategory(productDetails.getCategory());
        product.setStore(productDetails.getStore());
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }

    public Page<Product> searchProducts(String keyword, Long categoryId, Long storeId,
                                         BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        String effectiveKeyword = (keyword == null || keyword.isBlank()) ? "" : keyword;
        return productRepository.searchProducts(effectiveKeyword, categoryId, storeId, minPrice, maxPrice, pageable);
    }

    public List<Product> getProductsByStoreId(Long storeId) {
        return productRepository.findByStoreId(storeId);
    }
}