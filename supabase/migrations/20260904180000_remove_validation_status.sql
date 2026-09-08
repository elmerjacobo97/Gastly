-- Remove 'validation' status from the board workflow.
-- Migrate any existing tickets with status='validation' to 'todo'.

UPDATE tickets SET status = 'todo' WHERE status = 'validation';
ALTER TABLE tickets
  DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets
  ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('backlog', 'blocked', 'todo', 'doing', 'review', 'done'));
