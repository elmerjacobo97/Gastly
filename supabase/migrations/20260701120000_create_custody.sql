CREATE TABLE IF NOT EXISTS "public"."custody_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "person_name" "text" NOT NULL,
    "title" "text" NOT NULL,
    "target_amount" numeric(12,2),
    "expected_on" "date",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "notes" "text",
    "currency" "text" DEFAULT 'PEN'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "custody_orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "custody_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "custody_orders_currency_check" CHECK (("currency" = ANY (ARRAY['PEN'::"text", 'USD'::"text", 'MXN'::"text"]))),
    CONSTRAINT "custody_orders_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'cancelled'::"text"])))
);

ALTER TABLE "public"."custody_orders" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."custody_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "custody_order_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "occurred_on" "date" NOT NULL,
    "method" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "custody_movements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "custody_movements_custody_order_id_fkey" FOREIGN KEY ("custody_order_id") REFERENCES "public"."custody_orders"("id") ON DELETE CASCADE,
    CONSTRAINT "custody_movements_type_check" CHECK (("type" = ANY (ARRAY['deposit'::"text", 'disbursement'::"text"]))),
    CONSTRAINT "custody_movements_method_check" CHECK (("method" IS NULL OR "method" = ANY (ARRAY['yape'::"text", 'plin'::"text", 'transfer'::"text", 'cash'::"text"])))
);

ALTER TABLE "public"."custody_movements" OWNER TO "postgres";

ALTER TABLE "public"."custody_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."custody_movements" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own custody orders" ON "public"."custody_orders"
    USING (("auth"."uid"() = "user_id"))
    WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Users manage own custody movements" ON "public"."custody_movements"
    USING (("custody_order_id" IN (
        SELECT "custody_orders"."id"
        FROM "public"."custody_orders"
        WHERE ("custody_orders"."user_id" = "auth"."uid"())
    )))
    WITH CHECK (("custody_order_id" IN (
        SELECT "custody_orders"."id"
        FROM "public"."custody_orders"
        WHERE ("custody_orders"."user_id" = "auth"."uid"())
    )));

GRANT ALL ON TABLE "public"."custody_orders" TO "anon";
GRANT ALL ON TABLE "public"."custody_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."custody_orders" TO "service_role";

GRANT ALL ON TABLE "public"."custody_movements" TO "anon";
GRANT ALL ON TABLE "public"."custody_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."custody_movements" TO "service_role";
