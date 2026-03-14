-- ============================================
-- Bổ sung ON DELETE cho bảng support (chạy trên DB đã có sẵn)
-- Chạy sau: ecommerce_full_schema.sql + ecommerce_schema_optimizations.sql
-- ============================================
USE ecommerce;

-- support_conversations: assignedStaffId SET NULL khi staff bị xóa
ALTER TABLE support_conversations
  DROP FOREIGN KEY fk_support_staff;
ALTER TABLE support_conversations
  ADD CONSTRAINT fk_support_staff
  FOREIGN KEY (assignedStaffId) REFERENCES clients(id) ON DELETE SET NULL;

-- support_messages: xóa conversation thì xóa luôn messages; user/staff xóa thì SET NULL
ALTER TABLE support_messages
  DROP FOREIGN KEY fk_support_conv,
  DROP FOREIGN KEY fk_support_msg_user,
  DROP FOREIGN KEY fk_support_msg_staff;
ALTER TABLE support_messages
  ADD CONSTRAINT fk_support_conv
    FOREIGN KEY (conversationId) REFERENCES support_conversations(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_support_msg_user
    FOREIGN KEY (userId) REFERENCES clients(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_support_msg_staff
    FOREIGN KEY (staffId) REFERENCES clients(id) ON DELETE SET NULL;
