CREATE TABLE `placementAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL,
	`total` int NOT NULL,
	`level` varchar(4) NOT NULL,
	`skills` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `placementAttempts_id` PRIMARY KEY(`id`)
);
