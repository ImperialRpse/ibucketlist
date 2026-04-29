CREATE EXTENSION IF NOT EXISTS pg_trgm;


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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    new.raw_user_meta_data->>'display_name' -- ここでsignUp時の名前を取り出す
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_messages_as_read"("target_room_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.dm_participants
  SET last_read_at = now()
  WHERE room_id = target_room_id
  AND user_id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."mark_messages_as_read"("target_room_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bucket_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "is_completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "image_url" "text",
    "reflection" "text",
    "description" "text",
    "category" "text" DEFAULT 'その他'::"text"
);


ALTER TABLE "public"."bucket_items" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_bucket_items"("search_term" "text", "limit_num" integer, "offset_num" integer) RETURNS SETOF "public"."bucket_items"
    LANGUAGE "sql"
    AS $$
  SELECT *
  FROM bucket_items
  WHERE 
    -- キーワードが空の場合は全て返す（カテゴリクリック時のため）
    search_term = ''
    -- title または category で曖昧検索
    OR title % search_term 
    OR title ILIKE '%' || search_term || '%'
    OR category % search_term
    OR category ILIKE '%' || search_term || '%'
  ORDER BY 
    -- 検索キーワードがある場合は類似度順、それ以外は作成日順
    CASE WHEN search_term != '' THEN GREATEST(similarity(title, search_term), similarity(category, search_term)) ELSE 0 END DESC,
    created_at DESC
  LIMIT limit_num
  OFFSET offset_num;
$$;


ALTER FUNCTION "public"."search_bucket_items"("search_term" "text", "limit_num" integer, "offset_num" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "updated_at" timestamp with time zone,
    "bio" "text",
    "avatar_url" "text",
    "is_public" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_profiles"("search_term" "text", "limit_num" integer, "offset_num" integer) RETURNS SETOF "public"."profiles"
    LANGUAGE "sql"
    AS $$
  SELECT *
  FROM profiles
  WHERE 
    search_term = ''
    OR display_name % search_term 
    OR display_name ILIKE '%' || search_term || '%'
  ORDER BY 
    -- 1. 類似度が高い順（最優先）
    CASE WHEN search_term != '' THEN similarity(display_name, search_term) ELSE 0 END DESC,
    -- 2. updated_at がある場合は新しい順（第2優先、NULLは最後に回る）
    updated_at DESC NULLS LAST,
    -- 3. id で最終的な順序を固定（これが重要！）
    id DESC
  LIMIT limit_num
  OFFSET offset_num;
$$;


ALTER FUNCTION "public"."search_profiles"("search_term" "text", "limit_num" integer, "offset_num" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_room_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- ログ出力（Supabaseのログで見れるようになります）
  RAISE NOTICE 'Updating room % with content %', NEW.room_id, NEW.content;

  UPDATE public.dm_rooms
  SET 
    last_message_content = NEW.content,
    last_message_at = NEW.created_at
  WHERE id = NEW.room_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_room_last_message"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "parent_id" "uuid"
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dm_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid",
    "sender_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dm_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dm_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid",
    "user_id" "uuid",
    "last_read_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dm_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dm_rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_message_content" "text",
    "last_message_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dm_rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follows" (
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follow_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."follow_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "type" "text" NOT NULL,
    "item_id" "uuid",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bucket_items"
    ADD CONSTRAINT "bucket_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dm_messages"
    ADD CONSTRAINT "dm_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dm_participants"
    ADD CONSTRAINT "dm_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dm_participants"
    ADD CONSTRAINT "dm_participants_room_id_user_id_key" UNIQUE ("room_id", "user_id");



ALTER TABLE ONLY "public"."dm_rooms"
    ADD CONSTRAINT "dm_rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("follower_id", "following_id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_item_id_key" UNIQUE ("user_id", "item_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "bucket_items_category_trgm_idx" ON "public"."bucket_items" USING "gin" ("category" "public"."gin_trgm_ops");



CREATE INDEX "bucket_items_title_trgm_idx" ON "public"."bucket_items" USING "gin" ("title" "public"."gin_trgm_ops");



CREATE INDEX "comments_parent_id_idx" ON "public"."comments" USING "btree" ("parent_id");



CREATE INDEX "notifications_user_unread" ON "public"."notifications" USING "btree" ("user_id", "is_read", "created_at" DESC);



CREATE INDEX "profiles_display_name_trgm_idx" ON "public"."profiles" USING "gin" ("display_name" "public"."gin_trgm_ops");



CREATE OR REPLACE TRIGGER "on_message_inserted" AFTER INSERT ON "public"."dm_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_room_last_message"();



ALTER TABLE ONLY "public"."bucket_items"
    ADD CONSTRAINT "bucket_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."bucket_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dm_messages"
    ADD CONSTRAINT "dm_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."dm_rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dm_messages"
    ADD CONSTRAINT "dm_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dm_participants"
    ADD CONSTRAINT "dm_participants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."dm_rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dm_participants"
    ADD CONSTRAINT "dm_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."bucket_items"("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."bucket_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



CREATE POLICY "Anyone can view comments" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can comment" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Bucket items are viewable by everyone." ON "public"."bucket_items" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."bucket_items" FOR SELECT USING (true);



CREATE POLICY "Everyone can view follows" ON "public"."follows" FOR SELECT USING (true);



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can control their own items" ON "public"."bucket_items" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can follow others" ON "public"."follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can unfollow" ON "public"."follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view rooms they are participants in" ON "public"."dm_rooms" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."dm_participants"
  WHERE (("dm_participants"."room_id" = "dm_rooms"."id") AND ("dm_participants"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."bucket_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dm_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dm_messages_insert" ON "public"."dm_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "dm_messages_select" ON "public"."dm_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."dm_participants"
  WHERE (("dm_participants"."room_id" = "dm_messages"."room_id") AND ("dm_participants"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."dm_participants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dm_participants_insert_v3" ON "public"."dm_participants" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "dm_participants_select" ON "public"."dm_participants" FOR SELECT USING (true);



ALTER TABLE "public"."dm_rooms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dm_rooms_insert_final" ON "public"."dm_rooms" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "dm_rooms_select_final" ON "public"."dm_rooms" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ログインしていればいいねできる" ON "public"."likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "自分のいいねを消せる" ON "public"."likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "自分のプロフィールだけ作成できる" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "自分のプロフィールだけ更新できる" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "誰でもいいねの数を見れる" ON "public"."likes" FOR SELECT USING (true);



CREATE POLICY "誰でもプロフィールを見れる" ON "public"."profiles" FOR SELECT USING (true);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("target_room_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("target_room_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("target_room_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."bucket_items" TO "anon";
GRANT ALL ON TABLE "public"."bucket_items" TO "authenticated";
GRANT ALL ON TABLE "public"."bucket_items" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_bucket_items"("search_term" "text", "limit_num" integer, "offset_num" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_bucket_items"("search_term" "text", "limit_num" integer, "offset_num" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_bucket_items"("search_term" "text", "limit_num" integer, "offset_num" integer) TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_profiles"("search_term" "text", "limit_num" integer, "offset_num" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_profiles"("search_term" "text", "limit_num" integer, "offset_num" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_profiles"("search_term" "text", "limit_num" integer, "offset_num" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_room_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_room_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_room_last_message"() TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."dm_messages" TO "anon";
GRANT ALL ON TABLE "public"."dm_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."dm_messages" TO "service_role";



GRANT ALL ON TABLE "public"."dm_participants" TO "anon";
GRANT ALL ON TABLE "public"."dm_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."dm_participants" TO "service_role";



GRANT ALL ON TABLE "public"."dm_rooms" TO "anon";
GRANT ALL ON TABLE "public"."dm_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."dm_rooms" TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."likes" TO "anon";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";
GRANT ALL ON TABLE "public"."likes" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



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







