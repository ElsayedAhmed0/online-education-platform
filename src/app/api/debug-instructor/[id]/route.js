import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    const { id } = await params;
    const admin = createAdminClient();

    // جلب الكورسات بشكل مباشر
    const { data: courses, error } = await admin
        .from("courses")
        .select("id, title, instructor_id, status")
        .eq("instructor_id", id);

    // جلب أي كورس في الداتابيز للمقارنة
    const { data: anyCourse } = await admin
        .from("courses")
        .select("id, instructor_id, status")
        .limit(3);

    return NextResponse.json({
        instructorId: id,
        coursesFound: courses?.length ?? 0,
        courses,
        error: error?.message,
        sampleCourses: anyCourse,
    });
}
