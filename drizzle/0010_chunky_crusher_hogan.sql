CREATE TABLE `premiumCoachNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`membershipId` int NOT NULL,
	`studentUserId` int NOT NULL,
	`authorUserId` int NOT NULL,
	`dayIndex` int,
	`note` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `premiumCoachNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `premiumDailyAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`membershipId` int NOT NULL,
	`dayIndex` int NOT NULL,
	`cairoDate` varchar(10) NOT NULL,
	`level` varchar(4) NOT NULL,
	`questionIds` text NOT NULL,
	`answers` text,
	`score` int,
	`total` int,
	`feedback` text,
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `premiumDailyAttempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `premium_daily_membership_day_unique` UNIQUE(`membershipId`,`dayIndex`)
);
--> statement-breakpoint
CREATE TABLE `premiumLessonProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`membershipId` int NOT NULL,
	`lessonId` varchar(160) NOT NULL,
	`level` varchar(4) NOT NULL,
	`bestScore` int NOT NULL DEFAULT 0,
	`total` int NOT NULL,
	`attemptCount` int NOT NULL DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`lastFeedback` text,
	`lastAttemptAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `premiumLessonProgress_id` PRIMARY KEY(`id`),
	CONSTRAINT `premium_lesson_membership_lesson_unique` UNIQUE(`membershipId`,`lessonId`)
);
--> statement-breakpoint
CREATE TABLE `premiumMemberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`levels` text NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`status` enum('active','paused','cancelled') NOT NULL DEFAULT 'active',
	`durationDays` int NOT NULL,
	`paidAmountCents` int NOT NULL,
	`paymentReference` varchar(160) NOT NULL,
	`activatedBy` int NOT NULL,
	`coachUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `premiumMemberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentProfileDetails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uid` int NOT NULL,
	`city` varchar(80),
	`birthYear` int,
	`schoolGrade` varchar(80),
	`learningGoal` varchar(120),
	`preferredStudyTime` varchar(20),
	`dailyStudyMinutes` int,
	`bio` text,
	`avatarStorageKey` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentProfileDetails_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_profile_details_uid_unique` UNIQUE(`uid`)
);
--> statement-breakpoint
ALTER TABLE `courses` MODIFY COLUMN `currency` varchar(8) NOT NULL DEFAULT 'EGP';--> statement-breakpoint
CREATE INDEX `premium_notes_membership_idx` ON `premiumCoachNotes` (`membershipId`);--> statement-breakpoint
CREATE INDEX `premium_notes_student_idx` ON `premiumCoachNotes` (`studentUserId`);--> statement-breakpoint
CREATE INDEX `premium_daily_membership_idx` ON `premiumDailyAttempts` (`membershipId`);--> statement-breakpoint
CREATE INDEX `premium_lesson_membership_idx` ON `premiumLessonProgress` (`membershipId`);--> statement-breakpoint
CREATE INDEX `premium_membership_user_idx` ON `premiumMemberships` (`userId`);--> statement-breakpoint
CREATE INDEX `premium_membership_status_idx` ON `premiumMemberships` (`status`);--> statement-breakpoint
CREATE INDEX `premium_membership_coach_idx` ON `premiumMemberships` (`coachUserId`);