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

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
    
    const isAdmin = profile?.role === "admin";
    const userRole = profile?.role ?? "student";
    const dashboardUrl = userRole === "admin" ? "/admin/dashboard" 
        : userRole === "instructor" ? "/instructor/dashboard" 
        : "/dashboard";

    // مدرس يدخل كورسه الخاص → متاح بدون قيود
    const { data: course } = await supabase
        .from("courses")
        .select("*, profiles(name)")
        .eq("id", courseId)
        .single();

    if (!course) notFound();

    const isOwnCourse = userRole === "instructor" && course.instructor_id === user.id;

    // ✅ مشترك active أو أدمن أو مدرس في كورسه → كل الدروس مفتوحة
    // ✅ مش مشترك أو cancelled → أول 3 دروس بس مجاناً
    if (!isAdmin && !isOwnCourse && !enrollment && lessonIndex >= 3) {
        redirect(`/courses/${courseId}`);
    }

    const { data: prog } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id);

    return (
        <CoursePlayerClient
            course={course}
            sections={sections ?? []}
            lessonId={lessonId}
            enrollment={isOwnCourse ? { id: "own", progress: 0, status: "active" } : enrollment}
            progress={prog ?? []}
            userId={user.id}
            isAdmin={isAdmin || isOwnCourse}
            dashboardUrl={dashboardUrl}
        />
    );
}