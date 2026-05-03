-- ══════════════════════════════════════════════════════════
--  Notifications System Migration — FIXED VERSION
--  شغّله في Supabase SQL Editor
--  يتعامل مع الحالتين: الجدول موجود أو مش موجود
-- ══════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────
-- STEP 1: إنشاء الجدول (لو مش موجود)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL DEFAULT 'announcement',
    title      TEXT NOT NULL,
    body       TEXT,
    icon       TEXT DEFAULT '🔔',
    link       TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────
-- STEP 2: إضافة عمود is_read لو مش موجود
--  (يحل مشكلة: column "is_read" does not exist)
-- ────────────────────────────────────────────────
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- ────────────────────────────────────────────────
-- STEP 3: فهارس للأداء
-- ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ────────────────────────────────────────────────
-- STEP 4: RLS
-- ────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- إزالة السياسات القديمة لو موجودة (تجنب تكرار)
DROP POLICY IF EXISTS "User sees own + announcements" ON notifications;
DROP POLICY IF EXISTS "User marks own read"           ON notifications;
DROP POLICY IF EXISTS "Admin inserts notifications"   ON notifications;
DROP POLICY IF EXISTS "Admin deletes notifications"   ON notifications;

-- اليوزر يشوف إشعاراته + الإعلانات العامة
CREATE POLICY "User sees own + announcements"
    ON notifications FOR SELECT
    USING (user_id = auth.uid() OR type = 'announcement');

-- اليوزر يعدّل (mark as read) إشعاراته فقط
CREATE POLICY "User marks own read"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- الأدمن يضيف
CREATE POLICY "Admin inserts notifications"
    ON notifications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- الأدمن يحذف
CREATE POLICY "Admin deletes notifications"
    ON notifications FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- ────────────────────────────────────────────────
-- STEP 5: تفعيل Realtime (بأمان — يتجاهل لو مضاف أصلاً)
-- ────────────────────────────────────────────────
ALTER TABLE notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
    WHEN others THEN
        -- الجدول مضاف بالفعل للـ Realtime → تجاهل الخطأ
        NULL;
END;
$$;


-- ────────────────────────────────────────────────
-- STEP 6: Seed Data — إشعارات تجريبية
--  استبدل 'YOUR-USER-UUID' بالـ UUID بتاعك من:
--  Authentication → Users في Supabase Dashboard
-- ────────────────────────────────────────────────

-- مثال (فكّ الـ comment واستبدل الـ UUID):
/*
INSERT INTO notifications (user_id, type, title, body, link) VALUES
  ('YOUR-USER-UUID', 'new_lesson',    'تم إضافة درس جديد',          'تم إضافة "Hooks" في كورس React المتقدم',             '/courses/1'),
  ('YOUR-USER-UUID', 'certificate',   'تهانينا! حصلت على شهادة',    'أتممت كورس Python بنجاح، يمكنك تحميل شهادتك الآن',  '/dashboard'),
  (NULL,             'announcement',  'إعلان هام للجميع',            'سيتم عقد بث مباشر لمراجعة مشاريع الطلاب الجمعة',    NULL),
  ('YOUR-USER-UUID', 'enrollment',    'طالب جديد سجّل في كورسك',    'قام أحمد محمد بالتسجيل في كورس React المتقدم',       '/instructor/dashboard'),
  ('YOUR-USER-UUID', 'course_approved','كورسك اتوافق عليه! 🎉',     'تم نشر كورس React المتقدم على المنصة بنجاح',         '/instructor/dashboard'),
  ('YOUR-USER-UUID', 'new_user',      'مستخدم جديد انضم للمنصة',    'سارة علي سجّلت كمدرسة وتنتظر الموافقة',             '/admin/dashboard'),
  ('YOUR-USER-UUID', 'new_course',    'كورس ينتظر مراجعتك',         'رفع محمد خالد كورس Python للمبتدئين للمراجعة',       '/admin/dashboard');
*/
