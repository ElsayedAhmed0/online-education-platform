import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const supabase = await createServerSupabaseClient();

        // تحقق إن المستخدم أدمن
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        // احذف كل الاشتراكات
        const { error: enrollError } = await supabase
            .from("enrollments")
            .delete()
            .neq("id", 0); // بيحذف كل الصفوف

        if (enrollError) throw enrollError;

        // احذف كل استخدامات الكوبونات
        const { error: couponError } = await supabase
            .from("coupon_usages")
            .delete()
            .neq("id", 0);

        if (couponError) throw couponError;

        // رجّع عداد الكوبونات لصفر
        await supabase
            .from("coupons")
            .update({ used_count: 0 })
            .neq("id", 0);

        // رجّع students_count في الكورسات لصفر
        await supabase
            .from("courses")
            .update({ students_count: 0 })
            .neq("id", 0);

        return NextResponse.json({ success: true });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}