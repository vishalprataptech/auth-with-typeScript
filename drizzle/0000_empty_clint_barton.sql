CREATE TYPE "public"."role" AS ENUM('customer', 'seller');--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(50) NOT NULL,
	"email" varchar(322) NOT NULL,
	"password" varchar(150) NOT NULL,
	"role" "role" DEFAULT 'customer',
	"verification_token" varchar,
	"refresh_token" varchar,
	"reset_password_token" varchar,
	"reset_password_token_expires" timestamp,
	"refresh_token_expires" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"is_verified" boolean DEFAULT false,
	"salt" varchar,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users_table" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(25),
	"last_name" varchar(25),
	"profile_image_url" text,
	"email" varchar(322) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"password" varchar(66),
	"salt" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
