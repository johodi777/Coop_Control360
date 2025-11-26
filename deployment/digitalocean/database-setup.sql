-- Script de setup inicial para Managed Database
-- Ejecutar después de crear la database en DigitalOcean

-- Crear base de datos específica del cliente
CREATE DATABASE IF NOT EXISTS clienteA_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario específico (opcional, si no usas el usuario por defecto)
-- CREATE USER 'clienteA_user'@'%' IDENTIFIED BY 'password_segura';
-- GRANT ALL PRIVILEGES ON clienteA_db.* TO 'clienteA_user'@'%';
-- FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;
USE clienteA_db;
SHOW TABLES;

-- Nota: Las tablas se crearán automáticamente cuando el backend ejecute las migraciones
-- Ejecutar: docker-compose exec backend npm run migrate

