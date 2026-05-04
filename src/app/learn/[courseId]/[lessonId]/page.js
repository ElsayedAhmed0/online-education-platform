import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import CoursePlayerClient from "@/components/CoursePlayer/CoursePlayerClient";
export const dynamic = "force-dynamic";

export default async function CoursePlayerPage({ params }) {
    const supabase = await createServerSupabaseClient();
    const { courseId, lessonId } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // جيب الأقسام والدروس
    const { data: sections } = await supabase
        .from("sections")
        .select("*, lessons(*)")
        .eq("course_id", courseId)
        .order("order_index");

    const allLessons = (sections ?? []).flatMap(s => s.lessons ?? []);
    const lessonIndex = allLessons.findIndex(l => String(l.id) === String(lessonId));

    // تحقق من الاشتراك الـ active بس
    const { data: enrollment } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .eq("status", "active")
        .single();

    // ✅ مشترك active → كل الدروس مفتوحة
    // ✅ مش مشترك أو cancelled → أول 3 دروس بس مجاناً
    if (!enrollment && lessonIndex >= 3) {
        redirect(`/courses/${courseId}`);
    }

    const { data: course } = await supabase
        .from("courses")
        .select("*, profiles(name)")
        .eq("id", courseId)
        .single();

    if (!course) notFound();

    const { data: prog } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id);

    return (
        <CoursePlayerClient
            course={course}
            sections={sections ?? []}
            lessonId={lessonId}
            enrollment={enrollment}
            progress={prog ?? []}
            userId={user.id}
        />
    );
}