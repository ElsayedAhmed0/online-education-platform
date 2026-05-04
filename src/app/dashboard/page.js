import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import StudentDashboardClient from "@/components/Dashboard/StudentDashboardClient";

export default async function DashboardPage() {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // جيب الـ profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // جيب الكورسات المسجل فيها اللي حالتها active بس
    const { data: enrollments } = await supabase
        .from("enrollments")
        .select("*, courses(*, profiles(name))")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("enrolled_at", { ascending: false });

    return (
        <StudentDashboardClient
            profile={profile}
            enrollments={enrollments ?? []}
        />
    );
}