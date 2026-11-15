async function migrateNotificationReads(connection) {
  await connection.query(`CREATE TABLE IF NOT EXISTS notification_reads (
    notification_id INT NOT NULL,user_id INT NOT NULL,read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(notification_id,user_id),INDEX idx_notification_reader(user_id),
    FOREIGN KEY(notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
}
module.exports={migrateNotificationReads};
