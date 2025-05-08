-- Drop Bitcoin-related tables
DROP TABLE IF EXISTS bitcoin_transactions;
DROP TABLE IF EXISTS bitcoin_addresses;

-- Drop Bitcoin-related functions
DROP FUNCTION IF EXISTS get_bitcoin_balance;
DROP FUNCTION IF EXISTS get_recent_transactions;

-- Drop Bitcoin-related triggers
DROP TRIGGER IF EXISTS on_bitcoin_transaction_insert ON bitcoin_transactions;
DROP TRIGGER IF EXISTS on_bitcoin_transaction_update ON bitcoin_transactions;

-- Drop Bitcoin-related types
DROP TYPE IF EXISTS transaction_status;
DROP TYPE IF EXISTS transaction_type; 