import { createServerSupabaseClient } from "@/lib/supabase-server";
import CourseDetailClient from "@/components/CourseDetail/CourseDetailClient";
import { notFound } from "next/navigation";

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

    return (
        <CourseDetailClient
            course={course}
            sections={sections ?? []}
            reviews={reviews ?? []}
        />
    );
}