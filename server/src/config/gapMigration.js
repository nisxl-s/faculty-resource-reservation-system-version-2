const VERSION='20261019_01_review_and_identity';
async function migrateGaps(connection) {
  const [[done]]=await connection.query('SELECT version FROM schema_migrations WHERE version=?',[VERSION]);
  if(done)return;
  for(const [table,columns] of Object.entries({users:{registration_id:'VARCHAR(80) NULL',legacy_contact_value:'VARCHAR(255) NULL'},help_requests:{guest_access_hash:'CHAR(64) NULL'},reservations:{rejection_reason:'TEXT NULL',reviewed_by:'INT NULL',reviewed_at:'DATETIME NULL'}})) {
    for(const [name,definition] of Object.entries(columns)) {
      const [[exists]]=await connection.query('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?',[table,name]);
      if(!exists)await connection.query('ALTER TABLE ?? ADD COLUMN ?? '+definition,[table,name]);
    }
  }
  await connection.query(`CREATE TABLE IF NOT EXISTS reservation_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,reservation_id INT NOT NULL,actor_id INT NULL,
    action VARCHAR(30) NOT NULL,previous_status VARCHAR(20) NULL,status VARCHAR(20) NOT NULL,
    reason TEXT NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reservation_events (reservation_id,id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`);
  // Preserve every original value; move only unambiguous ID formats from the old registration form.
  await connection.query("UPDATE users SET legacy_contact_value=phone WHERE role='student' AND phone IS NOT NULL AND legacy_contact_value IS NULL");
  await connection.query("UPDATE users SET registration_id=phone,phone=NULL WHERE role='student' AND registration_id IS NULL AND phone REGEXP '^[A-Za-z]{2,12}[/_-][0-9]{2,4}[/_-][0-9]+$' AND CHAR_LENGTH(phone)<=80");
  await connection.query('INSERT INTO schema_migrations(version) VALUES (?)',[VERSION]);
}
module.exports={migrateGaps};
