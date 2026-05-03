# 🛍️ AI-Powered E-Commerce Platform

![CI/CD Pipeline](https://github.com/sinanduman56/cse214-Assignment/actions/workflows/ci-cd.yml/badge.svg)

This is a modern, microservices-based e-commerce application integrated with an AI Chatbot for smart product recommendations. 

## 🚀 Architecture & Technologies
- **Backend:** Java Spring Boot (Stateless JWT Authentication)
- **Frontend:** Angular (Nginx deployed)
- **AI Service:** Python FastAPI & Google Gemini API
- **Database:** PostgreSQL
- **DevOps:** Docker Compose, GitHub Actions (CI/CD Pipeline)

## 🐳 Running the Project
The entire application is dockerized for seamless deployment. To run the services locally:
```bash
docker-compose up --build
