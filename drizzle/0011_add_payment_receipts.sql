CREATE TABLE IF NOT EXISTS `paymentReceipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`method` enum('vodafone_cash','instapay') NOT NULL,
	`targetType` enum('course','premium','plan') NOT NULL,
	`targetId` varchar(120) NOT NULL,
	`targetTitle` varchar(200) NOT NULL,
	`amountCents` int NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'EGP',
	`senderPhoneOrHandle` varchar(100) NOT NULL,
	`transactionReference` varchar(120),
	`receiptImageUrl` text NOT NULL,
	`note` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentReceipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `receipts_user_idx` ON `paymentReceipts` (`userId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `receipts_status_idx` ON `paymentReceipts` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `receipts_created_idx` ON `paymentReceipts` (`createdAt`);
