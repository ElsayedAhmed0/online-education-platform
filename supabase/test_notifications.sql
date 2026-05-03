-- ══════════════════════════════════════════════════════════
--  TEST NOTIFICATIONS — نسخة مبسطة
--  ⚠ استبدل YOUR-USER-UUID بالـ UUID بتاعك في كل سطر
--
--  عشان تجيب UUID بتاعك:
--    SELECT id, email FROM auth.users LIMIT 10;
-- ══════════════════════════════════════════════════════════

-- STEP 0: تحقق إن الجدول موجود
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'notifications';

-- ─────────────────────────────────────────────────────────
-- STEP 1: أضف إشعارات تجريبية
--  استبدل  YOUR-USER-UUID  بالـ UUID الحقيقي بتاعك
-- ─────────────────────────────────────────────────────────

INSERT INTO notifications (user_id, type, title, body, link) VALUES
  ('YOUR-USER-UUID', 'new_lesson',     '📖 تم إضافة درس جديد',          'تم إضافة درس "React Hooks" في كورس React المتقدم',             '/courses/1'),
  ('YOUR-USER-UUID', 'certificate',    '🏆 تهانينا! حصلت على شهادة',    'أتممت كورس Python بنجاح، يمكنك تحميل شهادتك الآن',             '/dashboard'),
  (NULL,             'announcement',   '📢 إعلان هام للجميع',            'سيتم عقد بث مباشر لمراجعة مشاريع الطلاب الجمعة القادمة',       NULL),
  ('YOUR-USER-UUID', 'enrollment',     '👤 طالب جديد سجّل في كورسك',    'قام أحمد محمد بالتسجيل في كورس React المتقدم',                 '/instructor/dashboard'),
  ('YOUR-USER-UUID', 'course_approved','✅ كورسك اتوافق عليه!',          'تم نشر كورس React المتقدم على المنصة بنجاح',                   '/instructor/dashboard'),
  ('YOUR-USER-UUID', 'new_user',       '👥 مستخدم جديد انضم للمنصة',    'سارة علي سجّلت كمدرسة وتنتظر الموافقة',                        '/admin/dashboard'),
  ('YOUR-USER-UUID', 'new_course',     '📚 كورس ينتظر مراجعتك',         'رفع محمد خالد كورس Python للمبتدئين للمراجعة',                  '/admin/dashboard');

-- ─────────────────────────────────────────────────────────
-- STEP 2: تحقق من النتيجة
-- ─────────────────────────────────────────────────────────
SELECT id, user_id, type, title, is_read, created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 20;
