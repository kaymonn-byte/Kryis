CREATE TABLE `morning_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`market_context` text,
	`opportunities` text,
	`risks` text,
	`suggested_tickers` text,
	`full_analysis` text,
	`aggressiveness` varchar(20) DEFAULT 'agressivo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `morning_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `insights` ADD `stopGain` decimal(10,2);