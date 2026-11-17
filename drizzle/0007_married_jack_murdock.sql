CREATE TABLE `ownerAccessCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`codeHash` varchar(128) NOT NULL,
	`label` varchar(80) NOT NULL DEFAULT 'رمز المالك',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp,
	`revokedAt` timestamp,
	CONSTRAINT `ownerAccessCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `ownerAccessCodes_codeHash_unique` UNIQUE(`codeHash`)
);
