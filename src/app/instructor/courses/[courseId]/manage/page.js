import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import CourseContentManager from "@/components/InstructorDashboard/CourseContentManager";

export default async function ManageCoursePage({ params }) {
    const supabase = await createServerSupabaseClient();
    const { courseId } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // تأكد إن الكورس بتاعه هو
    const { data: course } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .eq("instructor_id", user.id)
        .single();

    if (!course) notFound();

    // جيب الأقسام والدروس
    const { data: sections } = await supabase
        .from("sections")
        .select("*, lessons(*)")
        .eq("course_id", courseId)
        .order("order_index")
        .order("order_index", { foreignTable: "lessons" });

    return (
        <CourseContentManager
            course={course}
            initialSections={sections ?? []}
            userId={user.id}
        />
    );
}