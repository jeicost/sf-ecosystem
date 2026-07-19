-- Make generation_queue.user_id nullable for batch operations
-- migration-date: 2026-07-19

ALTER TABLE generation_queue
ALTER COLUMN user_id DROP NOT NULL;
