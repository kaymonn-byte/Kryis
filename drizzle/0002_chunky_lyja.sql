CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(20) NOT NULL,
	`direction` enum('compra','venda','neutro') NOT NULL,
	`entryPrice` decimal(10,2),
	`targetPrice` decimal(10,2),
	`stopLoss` decimal(10,2),
	`riskReward` decimal(6,2),
	`thesis` text NOT NULL,
	`horizon` varchar(100),
	`status` enum('aberta','fechada','cancelada') NOT NULL DEFAULT 'aberta',
	`exitPrice` decimal(10,2),
	`returnPct` decimal(8,4),
	`assertive` boolean,
	`context` text,
	`source` enum('agente','usuario') NOT NULL DEFAULT 'agente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`type` enum('compra','venda') NOT NULL,
	`quantity` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`totalValue` decimal(12,2) NOT NULL,
	`fees` decimal(10,2) DEFAULT '0',
	`operationDate` timestamp NOT NULL,
	`broker` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`thesis` text NOT NULL,
	`entryPrice` decimal(10,2) NOT NULL,
	`targetPrice` decimal(10,2) NOT NULL,
	`stopLoss` decimal(10,2) NOT NULL,
	`exitPrice` decimal(10,2),
	`returnPct` decimal(8,4),
	`result` enum('pendente','sucesso','falha') NOT NULL DEFAULT 'pendente',
	`horizon` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trade_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watchlist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`targetPrice` decimal(10,2),
	`stopLoss` decimal(10,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `watchlist_items_id` PRIMARY KEY(`id`)
);
