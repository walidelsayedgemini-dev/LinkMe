import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Payment receipts submitted by students via Vodafone Cash or InstaPay.
 * Once verified by the owner/admin, access is granted automatically in an atomic transaction.
 */
export const paymentReceipts = mysqlTable(
  "paymentReceipts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    method: mysqlEnum("method", ["vodafone_cash", "instapay"]).notNull(),
    targetType: mysqlEnum("targetType", ["course", "premium", "plan"]).notNull(),
    targetId: varchar("targetId", { length: 120 }).notNull(),
    targetTitle: varchar("targetTitle", { length: 200 }).notNull(),
    amountCents: int("amountCents").notNull(),
    currency: varchar("currency", { length: 8 }).default("EGP").notNull(),
    senderPhoneOrHandle: varchar("senderPhoneOrHandle", { length: 100 }).notNull(),
    transactionReference: varchar("transactionReference", { length: 120 }),
    receiptImageUrl: text("receiptImageUrl").notNull(),
    note: text("note"),
    status: mysqlEnum("status", ["pending", "approved", "rejected"])
      .default("pending")
      .notNull(),
    rejectionReason: text("rejectionReason"),
    reviewedBy: int("reviewedBy"),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("receipts_user_idx").on(table.userId),
    index("receipts_status_idx").on(table.status),
    index("receipts_created_idx").on(table.createdAt),
  ]
);

export type PaymentReceipt = typeof paymentReceipts.$inferSelect;
export type InsertPaymentReceipt = typeof paymentReceipts.$inferInsert;
