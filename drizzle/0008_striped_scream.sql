CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`senderRole` varchar(12) NOT NULL,
	`body` text NOT NULL,
	`readByStudentAt` timestamp,
	`readByOwnerAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `chat_user_idx` ON `chatMessages` (`userId`);--> statement-breakpoint
CREATE INDEX `chat_created_idx` ON `chatMessages` (`createdAt`);