CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`nameAr` varchar(120) NOT NULL,
	`nameEn` varchar(120) NOT NULL,
	`description` text,
	`icon` varchar(60),
	`accent` varchar(40),
	`coverImage` text,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `contactMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(320) NOT NULL,
	`subject` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`userId` int,
	`status` enum('new','replied','closed') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contactMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(140) NOT NULL,
	`title` varchar(200) NOT NULL,
	`titleAr` varchar(200) NOT NULL,
	`subtitle` varchar(280) NOT NULL,
	`description` text NOT NULL,
	`level` enum('beginner','intermediate','advanced','all') NOT NULL,
	`categoryId` int NOT NULL,
	`instructorId` int NOT NULL,
	`priceCents` int NOT NULL DEFAULT 0,
	`compareAtCents` int,
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`durationHours` int NOT NULL DEFAULT 0,
	`studentsCount` int NOT NULL DEFAULT 0,
	`ratingSum` int NOT NULL DEFAULT 0,
	`ratingCount` int NOT NULL DEFAULT 0,
	`coverImage` text,
	`accent` varchar(40),
	`featured` boolean NOT NULL DEFAULT false,
	`isPublished` boolean NOT NULL DEFAULT true,
	`outcomes` text,
	`requirements` text,
	`audience` text,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `courses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`source` enum('purchase','subscription','free') NOT NULL DEFAULT 'purchase',
	`lastLessonId` int,
	`completedAt` timestamp,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `enrollments_user_course_unique` UNIQUE(`userId`,`courseId`)
);
--> statement-breakpoint
CREATE TABLE `instructors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`slug` varchar(100) NOT NULL,
	`title` varchar(160) NOT NULL,
	`bio` text NOT NULL,
	`experienceYears` int NOT NULL DEFAULT 0,
	`specialties` text,
	`education` text,
	`certifications` text,
	`languages` varchar(160) DEFAULT 'العربية والإنجليزية',
	`city` varchar(80),
	`rating` int NOT NULL DEFAULT 50,
	`studentsCount` int NOT NULL DEFAULT 0,
	`featured` boolean NOT NULL DEFAULT false,
	`linkedinUrl` text,
	`websiteUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `instructors_id` PRIMARY KEY(`id`),
	CONSTRAINT `instructors_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `lessonProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`lessonId` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lessonProgress_id` PRIMARY KEY(`id`),
	CONSTRAINT `lesson_progress_unique` UNIQUE(`userId`,`lessonId`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`moduleId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`content` text,
	`durationMinutes` int NOT NULL DEFAULT 10,
	`videoUrl` text,
	`isPreview` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`summary` varchar(280),
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kind` enum('course','subscription') NOT NULL,
	`courseId` int,
	`planId` int,
	`amountCents` int NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`provider` varchar(40) NOT NULL DEFAULT 'sandbox',
	`reference` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `passwordResetTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResetTokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(60) NOT NULL,
	`nameAr` varchar(80) NOT NULL,
	`tagline` varchar(200),
	`priceMonthlyCents` int NOT NULL DEFAULT 0,
	`priceYearlyCents` int NOT NULL DEFAULT 0,
	`features` text,
	`highlighted` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_user_course_unique` UNIQUE(`userId`,`courseId`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`billingCycle` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
	`status` enum('active','canceled','expired') NOT NULL DEFAULT 'active',
	`currentPeriodEnd` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wishlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `wishlist_user_course_unique` UNIQUE(`userId`,`courseId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'password';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','instructor') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `headline` varchar(160);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `country` varchar(80);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(40);--> statement-breakpoint
ALTER TABLE `users` ADD `englishLevel` enum('A1','A2','B1','B2','C1','C2');--> statement-breakpoint
ALTER TABLE `users` ADD `learningGoal` varchar(120);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
CREATE INDEX `courses_category_idx` ON `courses` (`categoryId`);--> statement-breakpoint
CREATE INDEX `courses_instructor_idx` ON `courses` (`instructorId`);--> statement-breakpoint
CREATE INDEX `lessons_module_idx` ON `lessons` (`moduleId`);--> statement-breakpoint
CREATE INDEX `lessons_course_idx` ON `lessons` (`courseId`);--> statement-breakpoint
CREATE INDEX `modules_course_idx` ON `modules` (`courseId`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`userId`);