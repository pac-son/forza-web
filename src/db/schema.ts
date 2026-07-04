import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const studentWallets = pgTable("student_wallets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentMatricNum: text("student_matric_num").notNull().unique(),
  publicAddress: text("public_address").notNull().unique(),
  encryptedKey: text("encrypted_key").notNull(),
  iv: text("iv").notNull(),
  authTag: text("auth_tag").notNull(),
  issuanceStatus: text("issuance_status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});