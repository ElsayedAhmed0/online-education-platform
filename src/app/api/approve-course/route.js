import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request) {
    try {
        const { courseId } = await request.json();
        const supabase = await createServerSupabaseClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
        }

        // وافق على الكورس
        const { error } = await supabase
            .from("courses")
            .update({ status: "live" })
            .eq("id", courseId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        revalidatePath("/");
        revalidatePath("/admin/dashboard");

        return NextResponse.json({ success: true });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}