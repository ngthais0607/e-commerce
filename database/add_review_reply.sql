ALTER TABLE reviews
  ADD COLUMN adminReply TEXT NULL AFTER comment,
  ADD COLUMN adminRepliedAt DATETIME(3) NULL AFTER adminReply;
