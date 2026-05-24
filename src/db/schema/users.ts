import {
  integer,
  pgEnum,
  pgTable,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core"

export const roleEnum = pgEnum("role", ["customer", "seller"])
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 50 }).notNull(),
  email: varchar("email", { length: 322 }).unique().notNull(),
  password: varchar("password", { length: 150 }).notNull(),
  role: roleEnum("role").default("customer"),
  verificationToken: varchar("verification_token"),
  refreshToken: varchar("refresh_token"),
  resetPasswordToken: varchar("reset_password_token"),
  resetPasswordTokenExpires: timestamp("reset_password_token_expires"),
  refreshTokenExpires: timestamp("refresh_token_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  deletedAt: timestamp("deleted_at"),
  isVerified: boolean("is_verified").default(false),
  salt:varchar("salt")
})



