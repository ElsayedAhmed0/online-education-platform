import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        // Verify caller is admin
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const { reviewId, status } = await request.json();

        if (!reviewId || !["approved", "pending", "rejected"].includes(status)) {
            return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
        }

        // Use admin client to bypass RLS
        const adminClient = createAdminClient();
        const { error } = await adminClient
            .from("reviews")
            .update({ status })
            .eq("id", reviewId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
