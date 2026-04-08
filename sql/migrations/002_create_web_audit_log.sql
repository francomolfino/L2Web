CREATE TABLE IF NOT EXISTS web_audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_name VARCHAR(45) NULL,
  action_name VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) NULL,
  details TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_account_name (account_name),
  INDEX idx_action_name (action_name),
  INDEX idx_created_at (created_at)
);
