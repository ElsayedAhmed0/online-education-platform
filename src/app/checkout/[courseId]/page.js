import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage({ params, searchParams }) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { courseId } = await params;
    const sp = await searchParams;

    const { data: course } = await supabase
        .from("courses")
        .select("*, profiles(name)")
        .eq("id", courseId)
        .single();

    if (!course) redirect("/");

    // تحقق مش مسجل قبل كده
    const { data: enrolled } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .single();

    if (enrolled) {
        // جيب أول lesson
        const { data: firstLesson } = await supabase
            .from("lessons")
            .select("id")
            .eq("course_id", courseId)
            .order("order_index", { ascending: true })
            .limit(1)
            .single();

        redirect(`/learn/${courseId}/${firstLesson?.id ?? "intro"}`);
    }

    return (
        <CheckoutClient
            course={course}
            initialCouponId={sp.couponId ?? null}
            initialDiscount={sp.discount ? Number(sp.discount) : null}
            initialCode={sp.code ?? ""}
        />
    );
}