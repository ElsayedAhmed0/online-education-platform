import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { studentId, courseId } = await request.json();
        const supabase = await createServerSupabaseClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

        // تحقق إن المدرس ده هو صاحب الكورس
        const { data: course } = await supabase
            .from("courses")
            .select("instructor_id")
            .eq("id", courseId)
            .single();

        if (!course || course.instructor_id !== user.id) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        // احذف الاشتراك
        await supabase
            .from("enrollments")
            .delete()
            .eq("user_id", studentId)
            .eq("course_id", courseId);

        // احذف استخدامات الكوبون
        await supabase
            .from("coupon_usages")
            .delete()
            .eq("user_id", studentId);

        return NextResponse.json({ success: true });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}