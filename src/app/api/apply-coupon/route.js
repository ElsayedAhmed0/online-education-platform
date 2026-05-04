import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { code, courseId } = await request.json();
        const supabase = await createServerSupabaseClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

        const adminSupabase = createAdminClient();

        // جيب الكوبون
        const { data: coupon, error } = await supabase
            .from("coupons")
            .select("*")
            .eq("code", code.toUpperCase())
            .eq("course_id", courseId)
            .single();

        if (error || !coupon)
            return NextResponse.json({ error: "كود الخصم غير صحيح" }, { status: 400 });

        // تحقق من الصلاحية
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
            return NextResponse.json({ error: "كود الخصم منتهي الصلاحية" }, { status: 400 });

        if (coupon.used_count >= 1)
            return NextResponse.json({ error: "تم استنفاد هذا الكود (يُستخدم مرة واحدة فقط)" }, { status: 400 });

        // نتحقق من جدول coupon_usages كمان عشان لو الـ RLS منع التحديث في جدول الكوبونات
        const { count: usagesCount } = await adminSupabase
            .from("coupon_usages")
            .select("*", { count: "exact", head: true })
            .eq("coupon_id", coupon.id);

        if (usagesCount && usagesCount >= 1)
            return NextResponse.json({ error: "تم استنفاد هذا الكود من قبل شخص آخر" }, { status: 400 });

        // ✅ رجّع البيانات بس من غير ما تسجل استخدام
        return NextResponse.json({
            success: true,
            discount: coupon.discount,
            couponId: coupon.id,
        });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}