ALTER TABLE `transactions` ADD `account_id` integer REFERENCES accounts(id) ON DELETE SET NULL;
