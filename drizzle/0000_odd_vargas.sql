CREATE TABLE "client_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"client_secret" varchar(255) NOT NULL,
	"redirect_uri" text,
	"origin" text,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"verification_token" text,
	"verification_token_expiresin" timestamp,
	"reset_password_token" text,
	"reset_password_token_expiresin" timestamp,
	"salt" text,
	"is_verified" boolean DEFAULT false,
	"app_name" varchar(255),
	"application_type" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "client_table_client_id_unique" UNIQUE("client_id"),
	CONSTRAINT "client_table_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_client" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"short_code" varchar(100) NOT NULL,
	"salt" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_client_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100),
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"verification_token" text,
	"verification_token_expiresin" timestamp,
	"is_verified" boolean DEFAULT false,
	"reset_password_token" text,
	"reset_password_token_expiresin" timestamp,
	"salt" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "user_client" ADD CONSTRAINT "user_client_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_client" ADD CONSTRAINT "user_client_client_id_client_table_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client_table"("id") ON DELETE cascade ON UPDATE no action;