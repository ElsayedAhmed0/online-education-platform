import ChatClient from "./ChatClient";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import CallManager from "@/components/Call/CallManager";

export default async function ChatPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url, role")
        .eq("id", user.id)
        .single();

    return (
        <>
            <CallManager currentUser={{ ...user, ...profile }} />
            <ChatClient currentUser={{ ...user, ...profile }} />
        </>
    );
}