CREATE TABLE "tmp_session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tmp_user" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text,
	"googleId" text,
	CONSTRAINT "tmp_user_email_unique" UNIQUE("email"),
	CONSTRAINT "tmp_user_googleId_unique" UNIQUE("googleId")
);
--> statement-breakpoint
ALTER TABLE "tmp_session" ADD CONSTRAINT "tmp_session_userId_tmp_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."tmp_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "tmp_session" USING btree ("userId");