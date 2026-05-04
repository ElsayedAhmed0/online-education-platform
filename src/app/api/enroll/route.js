import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const PLATFORM_FEE = 0.20;

export async function POST(request) {
    try {
        const { courseId, couponId } = await request.json();
        const supabase = await createServerSupabaseClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

        const { data: course } = await supabase
            .from("courses")
            .select("*, instructor_id")
            .eq("id", courseId)
            .single();

        if (!course) return NextResponse.json({ error: "الكورس غير موجود" }, { status: 404 });

        let price = course.price;

        if (couponId) {
            const { data: existingUsage } = await supabase
                .from("coupon_usages")
                .select("id")
                .eq("coupon_id", couponId)
                .eq("user_id", user.id)
                .single();

            if (existingUsage)
                return NextResponse.json({ error: "الكوبون استُخدم من قبل" }, { status: 400 });

            const { data: coupon } = await supabase
                .from("coupons")
                .select("discount")
                .eq("id", couponId)
                .single();

            if (coupon)
                price = Math.round(course.price * (1 - coupon.discount / 100));

            await supabase
                .from("coupon_usages")
                .insert({ coupon_id: couponId, user_id: user.id });

            await supabase
                .from("coupons")
                .update({ used_count: (course.used_count || 0) + 1 })
                .eq("id", couponId);
        }

        const { data: studentProfile } = await supabase
            .from("profiles").select("name").eq("id", user.id).single();

        const studentName = studentProfile?.name ?? "طالب جديد";
        const platformAmount = Math.round(price * PLATFORM_FEE);
        const instructorAmount = price - platformAmount;

        // ✅ الحل: upsert بدل delete ثم insert عشان نتجنب مشاكل الـ RLS 
        const { error: enrollError } = await supabase
            .from("enrollments")
            .upsert({
                user_id: user.id,
                course_id: courseId,
                progress: 0,
                status: "active",
                cancelled_at: null,
                cancelled_by: null,
            }, { onConflict: "user_id, course_id" });

        if (enrollError) throw enrollError;

        if (instructorAmount > 0) {
            await supabase.from("transactions").insert({
                user_id: course.instructor_id,
                course_id: courseId,
                amount: instructorAmount,
                type: "purchase",
                status: "completed",
            });
        }

        await supabase
            .from("courses")
            .update({ students_count: (course.students_count ?? 0) + 1 })
            .eq("id", courseId);

        await supabase.from("notifications").insert({
            user_id: course.instructor_id,
            type: "enrollment",
            title: "طالب جديد سجّل في كورسك 🎉",
            body: `${studentName} اشترك في كورس "${course.title}"`,
            link: "/instructor/dashboard",
        });

        await supabase.from("notifications").insert({
            user_id: user.id,
            type: "new_lesson",
            title: `تم تسجيلك في "${course.title}" ✅`,
            body: "يمكنك الآن الوصول لجميع دروس الكورس، بالتوفيق!",
            link: `/learn/${courseId}/1`,
        });

        // تحديث الـ cache عشان تظهر التعديلات فوراً في كل الصفحات
        revalidatePath(`/courses/${courseId}`);
        revalidatePath(`/learn/${courseId}`, "layout");
        revalidatePath("/dashboard");

        return NextResponse.json({ success: true });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}