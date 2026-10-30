ALTER TABLE transactions
ADD COLUMN source TEXT NOT NULL DEFAULT 'web'
CONSTRAINT transactions_source_check CHECK (source IN ('web', 'telegram'));
