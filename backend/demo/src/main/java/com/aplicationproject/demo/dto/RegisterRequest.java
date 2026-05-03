package com.aplicationproject.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    @NotBlank(message = "Email boş olamaz")
    @Email(message = "Geçerli bir email adresi giriniz")
    private String email;

    @NotBlank(message = "Şifre boş olamaz")
    private String password;

    @NotBlank(message = "Rol tipi boş olamaz")
    private String roleType;

    @NotBlank(message = "Cinsiyet boş olamaz")
    private String gender;
}
