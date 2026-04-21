import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import InstructorDashboardClient from "@/components/InstructorDashboard/InstructorDashboardClient";

export default async function InstructorDashboardPage() {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "instructor" && profile?.role !== "admin") {
        redirect("/dashboard");
    }

    const { data: courses } = await supabase
        .from("courses")
        .select("*, enrollments(count), reviews(rating)")
        .eq("instructor_id", user.id)
        .order("created_at", { ascending: false });

    const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

    const totalStudents = courses?.reduce((sum, c) => sum + (c.enrollments?.[0]?.count ?? 0), 0) ?? 0;
    const totalRevenue = transactions?.filter(t => t.type === "purchase").reduce((sum, t) => sum + t.amount, 0) ?? 0;

    return (
        <InstructorDashboardClient
            profile={profile}
            courses={courses ?? []}
            transactions={transactions ?? []}
            totalStudents={totalStudents}
            totalRevenue={totalRevenue}
        />
    );
}