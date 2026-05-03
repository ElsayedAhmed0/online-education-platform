import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const PLATFORM_FEE = 0.20;

export async function POST(request) {
    try {
        const { courseId, couponId } = await request.json(); // ❌ مش بناخد finalPrice من الـ request
        const supabase = await createServerSupabaseClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

        // جيب الكورس
        const { data: course } = await supabase
            .from("courses")
            .select("*, instructor_id")
            .eq("id", courseId)
            .single();

        if (!course) return NextResponse.json({ error: "الكورس غير موجود" }, { status: 404 });

        // ✅ لو في كوبون، تحقق منه من السيرفر مش من الـ client
        let price = course.price;

        if (couponId) {
            // تحقق إن الكوبون ده فعلاً اتسجل لهذا المستخدم
            const { data: usage } = await supabase
                .from("coupon_usages")
                .select("coupon_id")
                .eq("coupon_id", couponId)
                .eq("user_id", user.id)
                .single();

            if (!usage) {
                return NextResponse.json({ error: "الكوبون غير مفعّل لهذا الحساب" }, { status: 400 });
            }

            // جيب الكوبون واحسب السعر من السيرفر
            const { data: coupon } = await supabase
                .from("coupons")
                .select("discount")
                .eq("id", couponId)
                .single();

            if (coupon) {
                price = Math.round(course.price * (1 - coupon.discount / 100));
            }
        }

        // جيب اسم الطالب
        const { data: studentProfile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", user.id)
            .single();

        const studentName = studentProfile?.name ?? "طالب جديد";

        const platformAmount = Math.round(price * PLATFORM_FEE);
        const instructorAmount = price - platformAmount;

        // سجّل الطالب
        const { error: enrollError } = await supabase
            .from("enrollments")
            .upsert({ user_id: user.id, course_id: courseId, progress: 0 });

        if (enrollError) throw enrollError;

        // سجّل المعاملة المالية
        if (instructorAmount > 0) {
            await supabase.from("transactions").insert({
                user_id: course.instructor_id,
                course_id: courseId,
                amount: instructorAmount,
                type: "purchase",
                status: "completed",
            });
        }

        // حدّث students_count
        await supabase
            .from("courses")
            .update({ students_count: (course.students_count ?? 0) + 1 })
            .eq("id", courseId);

        // إشعار للمدرس
        await supabase.from("notifications").insert({
            user_id: course.instructor_id,
            type: "enrollment",
            title: "طالب جديد سجّل في كورسك 🎉",
            body: `${studentName} اشترك في كورس "${course.title}"`,
            link: "/instructor/dashboard",
        });

        // إشعار للطالب
        await supabase.from("notifications").insert({
            user_id: user.id,
            type: "new_lesson",
            title: `تم تسجيلك في "${course.title}" ✅`,
            body: "يمكنك الآن الوصول لجميع دروس الكورس، بالتوفيق!",
            link: `/learn/${courseId}/1`,
        });

        return NextResponse.json({ success: true });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}