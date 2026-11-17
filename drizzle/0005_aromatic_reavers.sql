CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`phone` varchar(24) NOT NULL,
	`courseSlug` varchar(140),
	`courseTitle` varchar(200) NOT NULL,
	`packageTitle` varchar(160) NOT NULL,
	`priceCents` int NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL DEFAULT 'EGP',
	`note` text,
	`status` varchar(24) NOT NULL DEFAULT 'new',
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `bookings_created_idx` ON `bookings` (`createdAt`);