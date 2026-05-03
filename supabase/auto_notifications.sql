-- ══════════════════════════════════════════════════════════════════
--  AUTO NOTIFICATIONS — إشعارات أوتوماتيك عبر Database Triggers
--  ✅ نسخة محدّثة — تجاهل أخطاء الإشعارات ولا توقف الأكشن الأصلي
--  شغّله في Supabase SQL Editor (يستبدل النسخة القديمة)
-- ══════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────
-- STEP 1: Helper Function — بتضيف إشعار في جدول notifications
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_user(
    p_user_id  UUID,
    p_type     TEXT,
    p_title    TEXT,
    p_body     TEXT,
    p_link     TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (p_user_id, p_type, p_title, p_body, p_link);
EXCEPTION WHEN others THEN
    NULL; -- تجاهل أي خطأ
END;
$$;


-- ────────────────────────────────────────────────────────────────
-- STEP 2: Trigger على enrollments
--   لما طالب يسجّل/يشتري كورس:
--     ✅ الطالب يجيله "تم تسجيلك بنجاح"
--     ✅ المدرس يجيله "طالب جديد سجّل في كورسك"
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_enrollment_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_course        RECORD;
    v_student_name  TEXT;
BEGIN
    BEGIN
        SELECT c.title, c.instructor_id
        INTO   v_course
        FROM   public.courses c
        WHERE  c.id = NEW.course_id;

        SELECT name INTO v_student_name
        FROM   public.profiles
        WHERE  id = NEW.user_id;

        -- إشعار الطالب
        PERFORM notify_user(
            NEW.user_id,
            'enrollment',
            '🎓 تم تسجيلك بنجاح!',
            'تم تسجيلك في كورس "' || COALESCE(v_course.title, 'الكورس') || '" بنجاح. استمتع بالتعلم!',
            '/dashboard'
        );

        -- إشعار المدرس
        IF v_course.instructor_id IS NOT NULL AND v_course.instructor_id <> NEW.user_id THEN
            PERFORM notify_user(
                v_course.instructor_id,
                'enrollment',
                '👤 طالب جديد سجّل في كورسك!',
                'قام ' || COALESCE(v_student_name, 'طالب') || ' بالتسجيل في كورس "' || COALESCE(v_course.title, 'الكورس') || '"',
                '/instructor/dashboard'
            );
        END IF;
    EXCEPTION WHEN others THEN
        NULL; -- ✅ لو الإشعار فشل، التسجيل يكمل عادي
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_enrollment_notify ON public.enrollments;

CREATE TRIGGER on_enrollment_notify
    AFTER INSERT ON public.enrollments
    FOR EACH ROW
    EXECUTE FUNCTION trg_enrollment_notify();


-- ────────────────────────────────────────────────────────────────
-- STEP 3: Trigger على courses
--   → review  : الأدمن يجيله "كورس ينتظر مراجعة"
--   → live    : المدرس يجيله "كورسك اتوافق عليه!"
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_course_status_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
BEGIN
    BEGIN
        -- كورس رُفع للمراجعة
        IF NEW.status = 'review' AND (OLD.status IS DISTINCT FROM 'review') THEN
            SELECT id INTO v_admin_id
            FROM   public.profiles
            WHERE  role = 'admin'
            LIMIT  1;

            IF v_admin_id IS NOT NULL THEN
                PERFORM notify_user(
                    v_admin_id,
                    'new_course',
                    '📚 كورس جديد ينتظر مراجعتك',
                    'رفع المدرس كورس "' || COALESCE(NEW.title, 'كورس') || '" للمراجعة والنشر',
                    '/admin/dashboard'
                );
            END IF;
        END IF;

        -- كورس اتوافق عليه
        IF NEW.status = 'live' AND OLD.status IS DISTINCT FROM 'live' THEN
            PERFORM notify_user(
                NEW.instructor_id,
                'course_approved',
                '✅ كورسك اتوافق عليه! 🎉',
                'تم نشر كورس "' || COALESCE(NEW.title, 'الكورس') || '" على المنصة بنجاح. الطلاب يمكنهم الاشتراك الآن!',
                '/instructor/dashboard'
            );
        END IF;
    EXCEPTION WHEN others THEN
        NULL; -- ✅ لو الإشعار فشل، التحديث يكمل عادي
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_course_status_notify ON public.courses;

CREATE TRIGGER on_course_status_notify
    AFTER UPDATE OF status ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION trg_course_status_notify();


-- ────────────────────────────────────────────────────────────────
-- STEP 4: Trigger على profiles — مستخدم جديد
--   لما حد يسجّل: الأدمن يجيله إشعار
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_new_user_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_role_ar  TEXT;
BEGIN
    BEGIN
        -- بُعت للأدمن بس لو المستخدم الجديد مش أدمن
        IF COALESCE(NEW.role, '') = 'admin' THEN
            RETURN NEW;
        END IF;

        SELECT id INTO v_admin_id
        FROM   public.profiles
        WHERE  role = 'admin'
        LIMIT  1;

        IF v_admin_id IS NULL THEN
            RETURN NEW;
        END IF;

        v_role_ar := CASE COALESCE(NEW.role, '')
            WHEN 'student'    THEN 'طالب'
            WHEN 'instructor' THEN 'مدرس'
            ELSE 'مستخدم'
        END;

        PERFORM notify_user(
            v_admin_id,
            'new_user',
            '👥 مستخدم جديد انضم للمنصة',
            'انضم ' || COALESCE(NEW.name, 'مستخدم') || ' كـ' || v_role_ar || ' للمنصة',
            '/admin/dashboard'
        );
    EXCEPTION WHEN others THEN
        NULL; -- ✅ أهم حاجة: التسجيل يكمل حتى لو الإشعار فشل
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_user_notify ON public.profiles;

CREATE TRIGGER on_new_user_notify
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION trg_new_user_notify();


-- ────────────────────────────────────────────────────────────────
-- STEP 5: Trigger على lessons — درس جديد
--   لما مدرس يضيف درس: كل الطلاب المسجّلين في الكورس يجيلهم إشعار
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_new_lesson_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_course_title TEXT;
    v_student      RECORD;
BEGIN
    BEGIN
        SELECT title INTO v_course_title
        FROM   public.courses
        WHERE  id = NEW.course_id;

        FOR v_student IN
            SELECT user_id
            FROM   public.enrollments
            WHERE  course_id = NEW.course_id
        LOOP
            PERFORM notify_user(
                v_student.user_id,
                'new_lesson',
                '📖 درس جديد في كورسك!',
                'تم إضافة درس "' || COALESCE(NEW.title, 'درس جديد') || '" في كورس "' || COALESCE(v_course_title, 'الكورس') || '"',
                '/courses/' || NEW.course_id::TEXT
            );
        END LOOP;
    EXCEPTION WHEN others THEN
        NULL; -- ✅ لو الإشعار فشل، الدرس يتضاف عادي
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_lesson_notify ON public.lessons;

CREATE TRIGGER on_new_lesson_notify
    AFTER INSERT ON public.lessons
    FOR EACH ROW
    EXECUTE FUNCTION trg_new_lesson_notify();


-- ────────────────────────────────────────────────────────────────
-- تحقق من الـ Triggers اتعملت صح
-- ────────────────────────────────────────────────────────────────
SELECT
    trigger_name,
    event_object_table AS "table",
    event_manipulation AS "event"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'on_enrollment_notify',
    'on_course_status_notify',
    'on_new_user_notify',
    'on_new_lesson_notify'
  )
ORDER BY event_object_table;
