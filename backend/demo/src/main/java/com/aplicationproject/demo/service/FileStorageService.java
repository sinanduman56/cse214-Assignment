package com.aplicationproject.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    // application.properties'den klasör yolunu çekiyoruz
    public FileStorageService(@Value("${file.upload-dir}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            // Eğer klasör yoksa oluştur
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Dosyaların yükleneceği klasör oluşturulamadı.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());

        // 1. KONTROL: Dosya adı veya uzantısı var mı? (Edge Case Koruması)
        if (originalFileName == null || !originalFileName.contains(".")) {
            throw new RuntimeException("Geçersiz dosya formatı! Dosya adı veya uzantısı eksik.");
        }

        // 2. KONTROL: Güvenlik İhlali Koruması (.exe, .js, .sh engelleme)
        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equals("image/png") || 
                                     contentType.equals("image/jpeg") || 
                                     contentType.equals("image/jpg"))) {
            throw new RuntimeException("Güvenlik ihlali: Sadece PNG veya JPG formatında resim yüklenebilir!");
        }

        // Güvenli işlemler...
        String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String newFileName = UUID.randomUUID().toString() + fileExtension;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return newFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Dosya kaydedilemedi: " + newFileName, ex);
        }
    }
}