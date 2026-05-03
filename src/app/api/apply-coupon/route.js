import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { code, courseId } = await request.json();
        const supabase = await createServerSupabaseClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

        // جيب الكوبون
        const { data: coupon, error } = await supabase
            .from("coupons")
            .select("*")
            .eq("code", code.toUpperCase())
            .eq("course_id", courseId)
            .single();

        if (error || !coupon) {
            return NextResponse.json({ error: "كود الخصم غير صحيح" }, { status: 400 });
        }

        // تحقق من الصلاحية
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return NextResponse.json({ error: "كود الخصم منتهي الصلاحية" }, { status: 400 });
        }

        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
            return NextResponse.json({ error: "تم استنفاد هذا الكود" }, { status: 400 });
        }

        // تحقق إن المستخدم ده مستخدمش الكوبون قبل كده
        const { data: existingUsage } = await supabase
            .from("coupon_usages")
            .select("id")
            .eq("coupon_id", coupon.id)
            .eq("user_id", user.id)
            .single();

        if (existingUsage) {
            return NextResponse.json({ error: "استخدمت هذا الكود من قبل" }, { status: 400 });
        }

        // سجّل الاستخدام
        const { error: usageError } = await supabase
            .from("coupon_usages")
            .insert({ coupon_id: coupon.id, user_id: user.id });

        if (usageError) {
            // لو حصل UNIQUE violation يبقى اتستخدم في نفس اللحظة
            return NextResponse.json({ error: "استخدمت هذا الكود من قبل" }, { status: 400 });
        }

        // حدّث العداد
        await supabase
            .from("coupons")
            .update({ used_count: (coupon.used_count || 0) + 1 })
            .eq("id", coupon.id);

        return NextResponse.json({
            success: true,
            discount: coupon.discount,
            couponId: coupon.id,
        });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}