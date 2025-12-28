-- Create database (run this first if database doesn't exist)
-- CREATE DATABASE IF NOT EXISTS dbs;
-- USE dbs;

-- User table
CREATE TABLE IF NOT EXISTS User (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  companyId INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_companyId (companyId)
) ENGINE=InnoDB;

-- Company table
CREATE TABLE IF NOT EXISTS Company (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB;

-- CompanyAccountBalance table
CREATE TABLE IF NOT EXISTS CompanyAccountBalance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT UNIQUE NOT NULL,
  carbonBalance DOUBLE DEFAULT 0,
  cashBalance DOUBLE DEFAULT 0,
  INDEX idx_companyId (companyId),
  FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- OutstandingRequest table
CREATE TABLE IF NOT EXISTS OutstandingRequest (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requestorId INT NOT NULL,
  recipientId INT NOT NULL,
  type VARCHAR(10) NOT NULL,
  price DOUBLE NOT NULL,
  quantity DOUBLE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_requestorId (requestorId),
  INDEX idx_recipientId (recipientId),
  INDEX idx_status (status),
  FOREIGN KEY (requestorId) REFERENCES Company(id) ON DELETE CASCADE,
  FOREIGN KEY (recipientId) REFERENCES Company(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Add foreign key constraint for User.companyId
ALTER TABLE User
ADD CONSTRAINT fk_user_company
FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE CASCADE;
