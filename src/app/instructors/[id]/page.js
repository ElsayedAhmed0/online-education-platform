import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase-server";
import InstructorProfileClient from "@/components/Instructors/InstructorProfileClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;
    const { data: instructor } = await supabase
        .from("profiles")
        .select("name, bio")
        .eq("id", id)
        .eq("role", "instructor")
        .single();

    if (!instructor) return { title: "مدرس غير موجود" };

    return {
        title: `${instructor.name} | EduPlatform`,
        description: instructor.bio ?? `تعرف على ${instructor.name} وكورساته`,
    };
}

export default async function InstructorProfilePage({ params }) {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;

    // جلب بيانات المدرس
    const { data: instructor } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, bio, created_at")
        .eq("id", id)
        .eq("role", "instructor")
        .single();

    if (!instructor) notFound();

    // استخدم admin client لتجاوز RLS وجلب كل كورسات المدرس
    const adminSupabase = createAdminClient();
    const { data: courses } = await adminSupabase
        .from("courses")
        .select("id, title, description, thumbnail_url, price, discount_price, level, category, status, created_at")
        .eq("instructor_id", id)
        .order("created_at", { ascending: false });

    // جلب عدد الطلاب لكل كورس
    const coursesWithStats = await Promise.all(
        (courses ?? []).map(async (course) => {
            const { count: studentsCount } = await adminSupabase
                .from("enrollments")
                .select("*", { count: "exact", head: true })
                .eq("course_id", course.id);

            const { data: reviewData } = await adminSupabase
                .from("reviews")
                .select("rating")
                .eq("course_id", course.id);

            const avgRating =
                reviewData && reviewData.length > 0
                    ? reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length
                    : 0;

            return {
                ...course,
                studentsCount: studentsCount ?? 0,
                avgRating: Math.round(avgRating * 10) / 10,
                reviewsCount: reviewData?.length ?? 0,
            };
        })
    );

    // إجمالي الطلاب
    const totalStudents = coursesWithStats.reduce((sum, c) => sum + c.studentsCount, 0);

    return (
        <InstructorProfileClient
            instructor={instructor}
            courses={coursesWithStats}
            totalStudents={totalStudents}
        />
    );
}
