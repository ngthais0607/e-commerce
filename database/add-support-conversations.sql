CREATE TABLE IF NOT EXISTS support_conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  status ENUM('OPEN', 'ASSIGNED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  assignedStaffId INT NULL,
  lastMessageAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (userId),
  INDEX idx_status (status),
  INDEX idx_assigned (assignedStaffId),
  CONSTRAINT fk_support_user FOREIGN KEY (userId) REFERENCES clients(id),
  CONSTRAINT fk_support_staff FOREIGN KEY (assignedStaffId) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS support_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversationId INT NOT NULL,
  senderRole ENUM('CUSTOMER', 'STAFF', 'ADMIN') NOT NULL,
  userId INT NULL,
  staffId INT NULL,
  message TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conversation (conversationId),
  INDEX idx_senderRole (senderRole),
  CONSTRAINT fk_support_conv FOREIGN KEY (conversationId) REFERENCES support_conversations(id),
  CONSTRAINT fk_support_msg_user FOREIGN KEY (userId) REFERENCES clients(id),
  CONSTRAINT fk_support_msg_staff FOREIGN KEY (staffId) REFERENCES clients(id)
);


