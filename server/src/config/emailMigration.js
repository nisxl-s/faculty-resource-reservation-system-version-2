async function migrateEmail(connection) {
  await connection.query(`CREATE TABLE IF NOT EXISTS email_outbox (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dedupe_key VARCHAR(191) NOT NULL UNIQUE,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    next_attempt_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    sent_at DATETIME NULL,
    last_error VARCHAR(100) NULL,
    INDEX idx_email_pending (sent_at, next_attempt_at)
  ) ENGINE=InnoDB`);
}
module.exports = {migrateEmail};
