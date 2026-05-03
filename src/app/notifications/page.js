import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import NotificationsPage from "@/components/NotificationsPage/NotificationsPage";

export const metadata = {
    title: "الإشعارات — EduPlatform",
    description: "جميع إشعاراتك في مكان واحد",
};

export default async function NotificationsRoute() {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    /* جيب كل الإشعارات الخاصة باليوزر + الإعلانات العامة */
    const { data: notifications } = await supabase
        .from("notifications")
        .select("*")
        .or(`user_id.eq.${user.id},type.eq.announcement`)
        .order("created_at", { ascending: false })
        .limit(50);

    return (
        <NotificationsPage
            initialNotifs={notifications ?? []}
            userId={user.id}
            userRole={profile?.role ?? "student"}
        />
    );
}
