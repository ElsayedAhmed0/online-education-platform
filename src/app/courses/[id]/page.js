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
        .select("*, profiles(name, avatar_url)")
        .eq("course_id", id)
        .order("created_at", { ascending: false })
        .limit(5);

    // ── جيب الـ user وشوف هو مشترك ولا لأ ──
    const { data: { user } } = await supabase.auth.getUser();

    let enrollment = null;
    if (user) {
        const { data } = await supabase
            .from("enrollments")
            .select("*")
            .eq("user_id", user.id)
            .eq("course_id", id)
            .eq("status", "active")  // ← المهم
            .single();
        enrollment = data;
    }

    return (
        <CourseDetailClient
            course={course}
            sections={sections ?? []}
            reviews={reviews ?? []}
            enrollment={enrollment}
        />
    );
}