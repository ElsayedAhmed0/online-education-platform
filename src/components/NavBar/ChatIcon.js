"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return "الآن";
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return new Date(dateStr).toLocaleDateString("ar-EG");
}

export default function ChatIcon() {
    const supabase = createClient();
    const router = useRouter();
    const dropRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [userId, setUserId] = useState(null);
    const [convos, setConvos] = useState([]);
    const [unread, setUnread] = useState(0);

    /* ── جيب الـ user ── */
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            setUserId(user.id);
        });
    }, []);

    /* ── جيب المحادثات + Realtime ── */
    useEffect(() => {
        if (!userId) return;

        fetchConvos();

        const channel = supabase
            .channel(`chat-icon-${userId}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "messages",
            }, (payload) => {
                if (payload.new.sender_id !== userId) {
                    setUnread(prev => prev + 1);
                    fetchConvos();
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [userId]);

    const fetchConvos = async () => {
        // جيب آخر 5 محادثات مع بيانات الطرف التاني
        const { data } = await supabase
            .from("conversations")
            .select(`
                id,
                last_message,
                last_message_at,
                user1_id,
                user2_id
            `)
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .order("last_message_at", { ascending: false })
            .limit(5);

        if (!data) return;

        // جيب بيانات الطرف التاني لكل محادثة
        const enriched = await Promise.all(
            data.map(async (conv) => {
                const otherId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("name, avatar_url, role")
                    .eq("id", otherId)
                    .single();
                return { ...conv, other: profile, otherId };
            })
        );

        setConvos(enriched);

        // احسب الـ unread
        const convoIds = data.map(c => c.id);
        if (!convoIds.length) return;
        const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .in("conversation_id", convoIds)
            .eq("is_read", false)
            .neq("sender_id", userId);
        setUnread(count ?? 0);
    };

    /* ── Close on outside click ── */
    useEffect(() => {
        const handler = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target))
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);


    const openChat = (convoId) => {
        setOpen(false);
        router.push(`/chat?c=${convoId}`);
    };
    const ROLE_LABEL = {
        student: "طالب",
        instructor: "مدرس",
        admin: "أدمن",
    };

    if (!userId) return null;

    return (
        <div className="ChatIcon-wrap" ref={dropRef}>
            {/* ── Chat Button ── */}
            <button
                className={`ChatIcon-btn${open ? " ChatIcon-btnOpen" : ""}`}
                onClick={() => setOpen(o => !o)}
                aria-label="الرسائل"
            >
                <span className="ChatIcon-icon">💬</span>
                {unread > 0 && (
                    <span className="ChatIcon-badge">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {/* ── Dropdown ── */}
            {open && (
                <div className="ChatIcon-dropdown">
                    {/* Header */}
                    <div className="ChatIcon-header">
                        <span className="ChatIcon-headerTitle">الرسائل</span>
                        <button
                            className="ChatIcon-newChat"
                            onClick={() => { setOpen(false); router.push("/chat?new=1"); }}
                        >
                            + محادثة جديدة
                        </button>
                    </div>

                    {/* List */}
                    {convos.length === 0 ? (
                        <div className="ChatIcon-empty">
                            <span>💬</span>
                            <p>لا توجد رسائل بعد</p>
                        </div>
                    ) : (
                        <div className="ChatIcon-list">
                            {convos.map(conv => (
                                <button
                                    key={conv.id}
                                    className="ChatIcon-item"
                                    onClick={() => openChat(conv.id)}
                                >
                                    {/* Avatar */}
                                    <div className="ChatIcon-avatar">
                                        {conv.other?.avatar_url
                                            ? <img src={conv.other.avatar_url} alt={conv.other?.name} />
                                            : <span>{conv.other?.name?.[0] ?? "؟"}</span>
                                        }
                                    </div>

                                    {/* Body */}
                                    <div className="ChatIcon-itemBody">
                                        <div className="ChatIcon-itemTop">
                                            <span className="ChatIcon-itemName">
                                                {conv.other?.name ?? "مستخدم"}
                                            </span>
                                            <span className="ChatIcon-itemTime">
                                                {timeAgo(conv.last_message_at)}
                                            </span>
                                        </div>
                                        <div className="ChatIcon-itemPreview">
                                            {conv.last_message
                                                ? conv.last_message.length > 40
                                                    ? conv.last_message.slice(0, 40) + "…"
                                                    : conv.last_message
                                                : "ابدأ المحادثة..."}
                                        </div>
                                        {conv.other?.role && (
                                            <span className="ChatIcon-roleTag">
                                                {ROLE_LABEL[conv.other.role] ?? conv.other.role}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <button
                        className="ChatIcon-footer"
                        onClick={() => { setOpen(false); router.push("/chat"); }}
                    >
                        عرض كل الرسائل ←
                    </button>
                </div>
            )}
        </div>
    );
}