import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

/* =========================
   CLIENT TABLE
========================= */

export const clientTable = pgTable("client_table", {
  id: serial("id").primaryKey(),

  clientId: varchar("client_id", { length: 255 })
    .unique()
    .notNull(),

  clientSecret: varchar("client_secret", { length: 255 }).notNull(),

  redirectUri: text("redirect_uri"),

  origin: text("origin"),

  email: varchar("email", { length: 255 })
    .unique()
    .notNull(),

  password: text("password").notNull(),

  verificationToken: text("verification_token"),

  verificationTokenExpiresin: timestamp(
    "verification_token_expiresin"
  ),

  resetPasswordToken: text("reset_password_token"),

  resetPasswordTokenExpiresin: timestamp(
    "reset_password_token_expiresin"
  ),

  salt: text("salt"),

  isVerified: boolean("is_verified")
    .default(false),

  appName: varchar("app_name", { length: 255 }),

  applicationType: varchar("application_type", {
    length: 100,
  }),

  createdAt: timestamp("created_at")
    .defaultNow(),

  updatedAt: timestamp("updated_at")
    .defaultNow(),
});

/* =========================
   USERS TABLE
========================= */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  firstName: varchar("first_name", {
    length: 100,
  }).notNull(),


  lastName: varchar("last_name", {
    length: 100,
  }),

  email: varchar("email", { length: 255 })
    .unique()
    .notNull(),

  password: text("password").notNull(),

  verificationToken: text(
    "verification_token"
  ),

  verificationTokenExpiresin: timestamp(
    "verification_token_expiresin"
  ),

  isVerified: boolean("is_verified")
    .default(false),

  resetPasswordToken: text(
    "reset_password_token"
  ),

  resetPasswordTokenExpiresin: timestamp(
    "reset_password_token_expiresin"
  ),

  salt: text("salt"),

  createdAt: timestamp("created_at")
    .defaultNow(),

  updatedAt: timestamp("updated_at")
    .defaultNow(),

  deletedAt: timestamp("deleted_at"),
});

/* =========================
   USER CLIENT TABLE
========================= */

export const userClient = pgTable(
  "user_client",
  {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),


    clientId: varchar("client_id", { length: 255 })
      .notNull()
      .references(() => clientTable.clientId, {
        onDelete: "cascade",
      }),

    shortCode: varchar("short_code", {
      length: 100,
    })
      .unique()
      .notNull(),

    salt: text("salt"),

    createdAt: timestamp("created_at")
      .defaultNow(),
  }
);