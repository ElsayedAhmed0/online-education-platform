import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { studentId, courseId } = await request.json();
        const supabase = await createServerSupabaseClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

        const { data: course } = await supabase
            .from("courses")
            .select("instructor_id, title")
            .eq("id", courseId)
            .single();

        if (!course || course.instructor_id !== user.id)
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

        // 1. جيب lesson IDs
        const { data: sections } = await supabase
            .from("sections")
            .select("lessons(id)")
            .eq("course_id", courseId);

        const lessonIds = sections?.flatMap(s => s.lessons?.map(l => l.id) ?? []) ?? [];

        // 2. امسح الـ progress
        if (lessonIds.length > 0) {
            await supabase
                .from("lesson_progress")
                .delete()
                .eq("user_id", studentId)
                .in("lesson_id", lessonIds);
        }

        // 3. update الـ enrollment
        const { error: updateError } = await supabase
            .from("enrollments")
            .update({
                status: "cancelled",
                cancelled_at: new Date().toISOString(),
                cancelled_by: user.id,
            })
            .eq("user_id", studentId)
            .eq("course_id", courseId);

        if (updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 });

        // 4. امسح coupon_usages الخاصة بكوبونات الكورس ده
        const { data: courseCoupons } = await supabase
            .from("coupons")
            .select("id")
            .eq("course_id", courseId);

        const couponIds = courseCoupons?.map(c => c.id) ?? [];

        if (couponIds.length > 0) {
            await supabase
                .from("coupon_usages")
                .delete()
                .eq("user_id", studentId)
                .in("coupon_id", couponIds);
        }

        // 5. إشعار للطالب
        await supabase.from("notifications").insert({
            user_id: studentId,
            type: "enrollment_cancelled",
            title: "تم إلغاء اشتراكك",
            body: `تم إلغاء اشتراكك في كورس "${course.title}" من قِبَل المدرس.`,
            link: `/courses/${courseId}`,
        });

        return NextResponse.json({ success: true });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}