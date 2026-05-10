import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { courseId } = await request.json();
        if (!courseId) {
            return NextResponse.json({ error: "معلومات غير مكتملة" }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

        const adminSupabase = createAdminClient();

        // 1. Verify ownership
        const { data: course, error: courseError } = await adminSupabase
            .from("courses")
            .select("instructor_id")
            .eq("id", courseId)
            .single();

        if (courseError || !course) {
            return NextResponse.json({ error: "الكورس غير موجود" }, { status: 404 });
        }

        if (course.instructor_id !== user.id) {
            return NextResponse.json({ error: "غير مصرح لك بحذف هذا الكورس" }, { status: 403 });
        }

        // 2. Delete related data in order
        // Note: We use adminSupabase to bypass RLS and ensure everything is cleaned up.
        
        // Delete questions
        await adminSupabase.from("questions").delete().eq("course_id", courseId);
        
        // Delete lessons
        await adminSupabase.from("lessons").delete().eq("course_id", courseId);
        
        // Delete sections
        await adminSupabase.from("sections").delete().eq("course_id", courseId);
        
        // Delete coupons
        await adminSupabase.from("coupons").delete().eq("course_id", courseId);
        
        // Delete enrollments
        await adminSupabase.from("enrollments").delete().eq("course_id", courseId);
        
        // Delete reviews
        await adminSupabase.from("reviews").delete().eq("course_id", courseId);
        
        // Delete notifications related to this course (if any)
        // Check if notifications have course_id or similar. 
        // Some systems store metadata in JSON. For now, we'll skip if unsure or handle specifically.
        
        // Finally, delete the course itself
        const { error: deleteError } = await adminSupabase.from("courses").delete().eq("id", courseId);
        
        if (deleteError) {
            throw deleteError;
        }

        return NextResponse.json({ success: true, message: "تم حذف الكورس بنجاح" });

    } catch (err) {
        console.error("Delete Course Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
