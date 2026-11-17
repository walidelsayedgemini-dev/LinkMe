ALTER TABLE `studentTasks` ADD `submissionText` text;--> statement-breakpoint
ALTER TABLE `studentTasks` ADD `submissionUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `studentTasks` ADD `submittedAt` timestamp;--> statement-breakpoint
ALTER TABLE `studentTasks` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `studentTasks` ADD `reviewedBy` int;--> statement-breakpoint
ALTER TABLE `studentTasks` ADD `submissionCount` int DEFAULT 0 NOT NULL;