import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase-server";
import InstructorsClient from "@/components/Instructors/InstructorsClient";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "المدرسون | EduPlatform",
    description: "تعرف على أفضل المدرسين على منصتنا التعليمية",
};

export default async function InstructorsPage() {
    const supabase = await createServerSupabaseClient();

    // جلب كل المدرسين مع عدد كورساتهم وعدد طلابهم
    const { data: instructors } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, bio")
        .eq("role", "instructor")
        .order("name");

    // جلب عدد الكورسات والطلاب لكل مدرس (باستخدام admin لتجاوز RLS)
    const adminSupabase = createAdminClient();
    const instructorsWithStats = await Promise.all(
        (instructors ?? []).map(async (instructor) => {
            const { data: courses } = await adminSupabase
                .from("courses")
                .select("id")
                .eq("instructor_id", instructor.id);

            const coursesCount = courses?.length ?? 0;

            let studentsCount = 0;
            if (courses && courses.length > 0) {
                const courseIds = courses.map((c) => c.id);
                const { count } = await adminSupabase
                    .from("enrollments")
                    .select("*", { count: "exact", head: true })
                    .in("course_id", courseIds);
                studentsCount = count ?? 0;
            }

            return {
                ...instructor,
                coursesCount,
                studentsCount,
            };
        })
    );

    return <InstructorsClient instructors={instructorsWithStats} />;
}
