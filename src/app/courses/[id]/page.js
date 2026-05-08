import { createServerSupabaseClient } from "@/lib/supabase-server";
import CourseDetailClient from "@/components/CourseDetail/CourseDetailClient";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function CourseDetailPage({ params }) {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;

    const { data: course } = await supabase
        .from("courses")
        .select("*, profiles(name, avatar_url, bio)")
        .eq("id", id)
        .single();

    if (!course) notFound();

    const { data: sections } = await supabase
        .from("sections")
        .select("*, lessons(*)")
        .eq("course_id", id)
        .order("order_index");

    const { data: reviews } = await supabase
        .from("reviews")
        .select("*, profiles!reviews_user_id_fkey(name, avatar_url)")
        .eq("course_id", id)
        .order("created_at", { ascending: false })
        .limit(5);

    // ── جيب الـ user وشوف هو مشترك ولا لأ ──
    const { data: { user } } = await supabase.auth.getUser();

    let enrollment = null;
    let isAdmin = false;
    let userRole = "guest";

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
        
        userRole = profile?.role ?? "student";
        isAdmin = profile?.role === "admin";

        // مدرس يدخل كورسه الخاص → متاح بدون دفع
        const isOwnCourse = profile?.role === "instructor" && course.instructor_id === user.id;

        if (!isOwnCourse) {
            const { data } = await supabase
                .from("enrollments")
                .select("*")
                .eq("user_id", user.id)
                .eq("course_id", id)
                .eq("status", "active")
                .single();
            enrollment = data;
        } else {
            // جعل enrollment mock يجعل الكورس مفتوح للمدرس
            enrollment = { id: "own", progress: 0, status: "active" };
        }
    }

    return (
        <CourseDetailClient
            course={course}
            sections={sections ?? []}
            reviews={reviews ?? []}
            enrollment={enrollment}
            isAdmin={isAdmin}
            userRole={userRole}
        />
    );
}