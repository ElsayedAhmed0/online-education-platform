import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "@/components/AdminDashboard/AdminDashboardClient";

export default async function AdminDashboardPage() {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") redirect("/dashboard");

    const { data: users } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

    const { data: courses } = await supabase
        .from("courses")
        .select("*, profiles(name), instructor_id")
        .order("created_at", { ascending: false })
        .limit(20);

    const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

    const { data: siteSettings } = await supabase
        .from("site_settings")
        .select("*");

    const totalRevenue = transactions
        ?.filter(t => t.type === "purchase")
        .reduce((sum, t) => sum + t.amount, 0) ?? 0;

    return (
        <AdminDashboardClient
            profile={profile}
            users={users ?? []}
            courses={courses ?? []}
            transactions={transactions ?? []}
            totalRevenue={totalRevenue}
            siteSettings={siteSettings ?? []}
        />
    );
}