


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."budgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "month" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "budgets_amount_check" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."budgets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "color" "text" DEFAULT 'default'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "icon" "text" DEFAULT 'tag'::"text" NOT NULL,
    CONSTRAINT "categories_type_check" CHECK (("type" = ANY (ARRAY['expense'::"text", 'income'::"text"])))
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."installment_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_id" "uuid" NOT NULL,
    "payment_number" integer NOT NULL,
    "due_on" "date" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "transaction_id" "uuid",
    "paid_externally" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."installment_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."installment_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "description" "text" NOT NULL,
    "installment_amount" numeric(12,2) NOT NULL,
    "total_installments" integer NOT NULL,
    "first_payment_on" "date" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "interest_amount" numeric DEFAULT 0 NOT NULL,
    CONSTRAINT "installment_purchases_interest_amount_check" CHECK (("interest_amount" >= (0)::numeric))
);


ALTER TABLE "public"."installment_purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loan_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "loan_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "occurred_on" "date" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."loan_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "person_name" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "loaned_on" "date" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expected_on" "date",
    "direction" "text" DEFAULT 'lent'::"text" NOT NULL,
    "currency" "text" DEFAULT 'PEN'::"text" NOT NULL,
    CONSTRAINT "loans_currency_check" CHECK (("currency" = ANY (ARRAY['PEN'::"text", 'USD'::"text", 'MXN'::"text"]))),
    CONSTRAINT "loans_direction_check" CHECK (("direction" = ANY (ARRAY['lent'::"text", 'borrowed'::"text"])))
);


ALTER TABLE "public"."loans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monthly_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "month" "date" NOT NULL,
    "savings_mode" "text" DEFAULT 'percent'::"text" NOT NULL,
    "savings_value" numeric NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "monthly_plans_check" CHECK (((("savings_mode" = 'percent'::"text") AND ("savings_value" <= (100)::numeric)) OR ("savings_mode" = 'amount'::"text"))),
    CONSTRAINT "monthly_plans_savings_mode_check" CHECK (("savings_mode" = ANY (ARRAY['percent'::"text", 'amount'::"text"]))),
    CONSTRAINT "monthly_plans_savings_value_check" CHECK (("savings_value" >= (0)::numeric))
);


ALTER TABLE "public"."monthly_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recurring_expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "type" "text" DEFAULT 'expense'::"text" NOT NULL,
    "amount" numeric NOT NULL,
    "description" "text" NOT NULL,
    "frequency" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "billing_day" integer NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "payment_kind" "text" DEFAULT 'fixed'::"text" NOT NULL,
    "next_due_on" "date" DEFAULT CURRENT_DATE NOT NULL,
    "interval_months" integer DEFAULT 1 NOT NULL,
    CONSTRAINT "recurring_expenses_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "recurring_expenses_billing_day_check" CHECK ((("billing_day" >= 1) AND ("billing_day" <= 31))),
    CONSTRAINT "recurring_expenses_frequency_check" CHECK (("frequency" = ANY (ARRAY['monthly'::"text", 'custom_months'::"text", 'yearly'::"text"]))),
    CONSTRAINT "recurring_expenses_interval_months_check" CHECK ((("interval_months" >= 1) AND ("interval_months" <= 120))),
    CONSTRAINT "recurring_expenses_payment_kind_check" CHECK (("payment_kind" = ANY (ARRAY['fixed'::"text", 'variable'::"text"]))),
    CONSTRAINT "recurring_expenses_type_check" CHECK (("type" = ANY (ARRAY['expense'::"text", 'income'::"text"])))
);


ALTER TABLE "public"."recurring_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "type" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "description" "text" NOT NULL,
    "occurred_on" "date" DEFAULT CURRENT_DATE NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recurring_expense_id" "uuid",
    "monthly_plan_id" "uuid",
    CONSTRAINT "transactions_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "transactions_type_check" CHECK (("type" = ANY (ARRAY['expense'::"text", 'income'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_user_id_type_name_key" UNIQUE ("user_id", "type", "name");



ALTER TABLE ONLY "public"."installment_payments"
    ADD CONSTRAINT "installment_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."installment_purchases"
    ADD CONSTRAINT "installment_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loan_payments"
    ADD CONSTRAINT "loan_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_plans"
    ADD CONSTRAINT "monthly_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_plans"
    ADD CONSTRAINT "monthly_plans_user_id_month_key" UNIQUE ("user_id", "month");



ALTER TABLE ONLY "public"."recurring_expenses"
    ADD CONSTRAINT "recurring_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "budgets_user_category_month_idx" ON "public"."budgets" USING "btree" ("user_id", "category_id", "month");



CREATE INDEX "categories_user_type_icon_idx" ON "public"."categories" USING "btree" ("user_id", "type", "icon");



CREATE INDEX "categories_user_type_idx" ON "public"."categories" USING "btree" ("user_id", "type");



CREATE INDEX "idx_recurring_expenses_user_id" ON "public"."recurring_expenses" USING "btree" ("user_id");



CREATE INDEX "idx_transactions_recurring_expense_id" ON "public"."transactions" USING "btree" ("recurring_expense_id");



CREATE INDEX "monthly_plans_user_month_idx" ON "public"."monthly_plans" USING "btree" ("user_id", "month");



CREATE INDEX "recurring_expenses_user_active_billing_day_idx" ON "public"."recurring_expenses" USING "btree" ("user_id", "is_active", "billing_day");



CREATE INDEX "recurring_expenses_user_active_next_due_idx" ON "public"."recurring_expenses" USING "btree" ("user_id", "is_active", "next_due_on");



CREATE INDEX "transactions_category_idx" ON "public"."transactions" USING "btree" ("category_id");



CREATE UNIQUE INDEX "transactions_monthly_plan_income_unique_idx" ON "public"."transactions" USING "btree" ("monthly_plan_id") WHERE (("monthly_plan_id" IS NOT NULL) AND ("type" = 'income'::"text"));



CREATE INDEX "transactions_user_monthly_plan_idx" ON "public"."transactions" USING "btree" ("user_id", "monthly_plan_id");



CREATE INDEX "transactions_user_occurred_on_idx" ON "public"."transactions" USING "btree" ("user_id", "occurred_on" DESC);



CREATE INDEX "transactions_user_type_idx" ON "public"."transactions" USING "btree" ("user_id", "type");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."installment_payments"
    ADD CONSTRAINT "installment_payments_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."installment_purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."installment_payments"
    ADD CONSTRAINT "installment_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."installment_purchases"
    ADD CONSTRAINT "installment_purchases_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."installment_purchases"
    ADD CONSTRAINT "installment_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loan_payments"
    ADD CONSTRAINT "loan_payments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monthly_plans"
    ADD CONSTRAINT "monthly_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recurring_expenses"
    ADD CONSTRAINT "recurring_expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."recurring_expenses"
    ADD CONSTRAINT "recurring_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_monthly_plan_id_fkey" FOREIGN KEY ("monthly_plan_id") REFERENCES "public"."monthly_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_recurring_expense_id_fkey" FOREIGN KEY ("recurring_expense_id") REFERENCES "public"."recurring_expenses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can create their own budgets" ON "public"."budgets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own categories" ON "public"."categories" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own transactions" ON "public"."transactions" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own budgets" ON "public"."budgets" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own categories" ON "public"."categories" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own transactions" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own monthly plans" ON "public"."monthly_plans" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own recurring expenses" ON "public"."recurring_expenses" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own categories" ON "public"."categories" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read own transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own categories" ON "public"."categories" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own transactions" ON "public"."transactions" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own budgets" ON "public"."budgets" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own budgets" ON "public"."budgets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own installment payments" ON "public"."installment_payments" USING ((EXISTS ( SELECT 1
   FROM "public"."installment_purchases" "p"
  WHERE (("p"."id" = "installment_payments"."purchase_id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."installment_purchases" "p"
  WHERE (("p"."id" = "installment_payments"."purchase_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users manage own installment purchases" ON "public"."installment_purchases" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own loan payments" ON "public"."loan_payments" USING (("loan_id" IN ( SELECT "loans"."id"
   FROM "public"."loans"
  WHERE ("loans"."user_id" = "auth"."uid"())))) WITH CHECK (("loan_id" IN ( SELECT "loans"."id"
   FROM "public"."loans"
  WHERE ("loans"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users manage own loans" ON "public"."loans" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."budgets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."installment_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."installment_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loan_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monthly_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recurring_expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





































































































































































GRANT ALL ON TABLE "public"."budgets" TO "anon";
GRANT ALL ON TABLE "public"."budgets" TO "authenticated";
GRANT ALL ON TABLE "public"."budgets" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."installment_payments" TO "anon";
GRANT ALL ON TABLE "public"."installment_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."installment_payments" TO "service_role";



GRANT ALL ON TABLE "public"."installment_purchases" TO "anon";
GRANT ALL ON TABLE "public"."installment_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."installment_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."loan_payments" TO "anon";
GRANT ALL ON TABLE "public"."loan_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."loan_payments" TO "service_role";



GRANT ALL ON TABLE "public"."loans" TO "anon";
GRANT ALL ON TABLE "public"."loans" TO "authenticated";
GRANT ALL ON TABLE "public"."loans" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_plans" TO "anon";
GRANT ALL ON TABLE "public"."monthly_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_plans" TO "service_role";



GRANT ALL ON TABLE "public"."recurring_expenses" TO "anon";
GRANT ALL ON TABLE "public"."recurring_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."recurring_expenses" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































