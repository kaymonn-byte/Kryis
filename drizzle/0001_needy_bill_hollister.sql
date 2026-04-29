CREATE TABLE `analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`score` int NOT NULL,
	`recommendation` varchar(50) NOT NULL,
	`note` text,
	`date` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`ibovespa_value` decimal(12,2),
	`ibovespa_change` decimal(6,2),
	`dollar_value` decimal(8,4),
	`dollar_change` decimal(6,2),
	`selic` decimal(6,2),
	`brent_value` decimal(8,2),
	`brent_change` decimal(6,2),
	`market_summary` text,
	`lessons_learned` text,
	`tomorrow_outlook` text,
	`self_score` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticker_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`note` text NOT NULL,
	`context` varchar(255),
	`date` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticker_notes_id` PRIMARY KEY(`id`)
);
