-- Scheikunde aantekeningen — MySQL schema
-- Run in phpMyAdmin als root, maak daarna een app-user (geen root in de app).
-- Zelfde DB-server als med-track / dash: 192.168.1.14

CREATE DATABASE IF NOT EXISTS aantekeningen
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aantekeningen;

CREATE TABLE IF NOT EXISTS notes (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT 'Nieuwe aantekening',
  content_text MEDIUMTEXT NOT NULL,
  ocr_raw MEDIUMTEXT NULL,
  ocr_provider VARCHAR(32) NULL,
  status ENUM('draft', 'processing', 'ready', 'error') NOT NULL DEFAULT 'draft',
  error_message VARCHAR(512) NULL,
  photo_path VARCHAR(512) NULL,
  pdf_path VARCHAR(512) NULL,
  docx_path VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_notes_updated (updated_at),
  INDEX idx_notes_status (status)
) ENGINE=InnoDB;
