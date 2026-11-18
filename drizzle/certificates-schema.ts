import {
  boolean,
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const issuedCertificates = mysqlTable(
  "issuedCertificates",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    userId: int("userId"),
    studentName: varchar("studentName", { length: 160 }).notNull(),
    courseTitle: varchar("courseTitle", { length: 240 }).notNull(),
    levelTitle: varchar("levelTitle", { length: 160 }).notNull(),
    scorePercentage: int("scorePercentage").default(100).notNull(),
    revoked: boolean("revoked").default(false).notNull(),
    issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("issued_certificates_code_unique").on(table.code),
    index("issued_certificates_user_idx").on(table.userId),
  ]
);

export type IssuedCertificate = typeof issuedCertificates.$inferSelect;
export type InsertIssuedCertificate = typeof issuedCertificates.$inferInsert;
