CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`month` text NOT NULL,
	`limit_amount` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budgets_category_month_uq` ON `budgets` (`category_id`,`month`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `recipient_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`counterparty` text NOT NULL,
	`category_id` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipient_rules_counterparty_unique` ON `recipient_rules` (`counterparty`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`amount` integer NOT NULL,
	`fee` integer DEFAULT 0 NOT NULL,
	`direction` text NOT NULL,
	`type` text NOT NULL,
	`network` text DEFAULT 'unknown' NOT NULL,
	`counterparty` text,
	`category_id` integer,
	`note` text,
	`occurred_at` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`external_ref` text,
	`balance_after` integer,
	`raw_sms` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_network_ref_uq` ON `transactions` (`network`,`external_ref`);--> statement-breakpoint
CREATE INDEX `transactions_occurred_idx` ON `transactions` (`occurred_at`);