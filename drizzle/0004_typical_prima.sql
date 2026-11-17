CREATE TABLE `liveSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`agenda` text,
	`startsAt` timestamp NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 60,
	`meetingUrl` varchar(500),
	`status` enum('scheduled','live','done','canceled') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `liveSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessionAttendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('present','late','absent','excused') NOT NULL DEFAULT 'absent',
	`note` varchar(300),
	`markedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sessionAttendance_id` PRIMARY KEY(`id`),
	CONSTRAINT `attendance_session_user_unique` UNIQUE(`sessionId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `studentRatings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ratedBy` int NOT NULL,
	`stars` int NOT NULL,
	`speaking` int,
	`listening` int,
	`grammar` int,
	`vocabulary` int,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studentRatings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assignedBy` int,
	`title` varchar(200) NOT NULL,
	`instructions` text,
	`dueAt` timestamp,
	`status` enum('assigned','in_progress','submitted','reviewed') NOT NULL DEFAULT 'assigned',
	`feedback` text,
	`score` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `live_sessions_course_idx` ON `liveSessions` (`courseId`);--> statement-breakpoint
CREATE INDEX `live_sessions_start_idx` ON `liveSessions` (`startsAt`);--> statement-breakpoint
CREATE INDEX `student_ratings_user_idx` ON `studentRatings` (`userId`);--> statement-breakpoint
CREATE INDEX `tasks_user_idx` ON `studentTasks` (`userId`);