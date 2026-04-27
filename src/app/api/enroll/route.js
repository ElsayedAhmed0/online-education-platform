import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const PLATFORM_FEE = 0.20; // 20% للمنصة

export async function POST(request) {
    try {
        const { courseId, couponId, finalPrice } = await request.json();
        const supabase = await createServerSupabaseClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

        // جيب الكورس
        const { data: course } = await supabase
            .from("courses")
            .select("*, profiles(id)")
            .eq("id", courseId)
            .single();

        if (!course) return NextResponse.json({ error: "الكورس غير موجود" }, { status: 404 });

        const price = finalPrice ?? course.price;
        const platformAmount = Math.round(price * PLATFORM_FEE);
        const instructorAmount = price - platformAmount;

        // سجّل الطالب
        const { error: enrollError } = await supabase
            .from("enrollments")
            .upsert({ user_id: user.id, course_id: courseId, progress: 0 });

        if (enrollError) throw enrollError;

        // سجّل المعاملة المالية
        await supabase.from("transactions").insert({
            user_id: course.profiles.id,
            course_id: courseId,
            amount: instructorAmount,
            type: "purchase",
            status: "completed",
        });

        // حدّث عداد الكوبون
        if (couponId) {
            await supabase
                .from("coupons")
                .update({ used_count: supabase.rpc("increment", { row_id: couponId }) })
                .eq("id", couponId);
        }

        // حدّث students_count
        await supabase
            .from("courses")
            .update({ students_count: (course.students_count ?? 0) + 1 })
            .eq("id", courseId);

        return NextResponse.json({ success: true });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}