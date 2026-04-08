CREATE TABLE IF NOT EXISTS web_password_resets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_name VARCHAR(45) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_account_name (account_name),
  INDEX idx_expires_at (expires_at)
);
