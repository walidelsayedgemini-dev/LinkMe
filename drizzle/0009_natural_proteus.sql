CREATE TABLE `assessmentSessions` (
	`id` varchar(64) NOT NULL,
	`userId` int,
	`tokenHash` varchar(64) NOT NULL,
	`state` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `assessmentSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `assessment_sessions_user_idx` ON `assessmentSessions` (`userId`);--> statement-breakpoint
CREATE INDEX `assessment_sessions_expiry_idx` ON `assessmentSessions` (`expiresAt`);