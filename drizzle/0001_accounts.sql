CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`brand_id` text NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`sync_network` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL
);
