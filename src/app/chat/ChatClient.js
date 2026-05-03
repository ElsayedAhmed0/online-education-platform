"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return "الآن";
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return new Date(dateStr).toLocaleDateString("ar-EG");
}

const ROLE_LABEL = { student: "طالب", instructor: "مدرس", admin: "أدمن" };
const ROLE_COLOR = {
    student: { bg: "rgba(99,102,241,.15)", color: "#818CF8" },
    instructor: { bg: "rgba(16,185,129,.15)", color: "#10B981" },
    admin: { bg: "rgba(239,68,68,.15)", color: "#EF4444" },
};

export default function ChatClient({ currentUser }) {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const activeConvoRef = useRef(null);

    const [convos, setConvos] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState("");
    const [allUsers, setAllUsers] = useState([]);
    const [showNewChat, setShowNewChat] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [loadingMsgs, setLoadingMsgs] = useState(false);

    /* ── sync activeConvo to ref عشان الـ realtime يشوفه ── */
    useEffect(() => {
        activeConvoRef.current = activeConvo;
    }, [activeConvo]);

    /* ── جيب المحادثات + Realtime ── */
    useEffect(() => {
        fetchConvos();

        const channel = supabase
            .channel(`chat-page-${currentUser.id}`)
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "messages",
            }, () => {
                fetchConvos();
                const current = activeConvoRef.current;
                if (current) {
                    supabase
                        .from("messages")
                        .select("*")
                        .eq("conversation_id", current.id)
                        .order("created_at", { ascending: true })
                        .then(({ data }) => setMessages(data ?? []));
                }
            })
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "conversations",
            }, () => fetchConvos())
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    /* ── لو جاي من ChatIcon بـ convoId ── */
    useEffect(() => {
        const convoId = searchParams.get("c");
        const isNew = searchParams.get("new");

        if (isNew) {
            setShowNewChat(true);
            return;
        }

        // بس افتح لو مفيش activeConvo بالفعل
        if (convoId && convos.length && !activeConvoRef.current) {
            const found = convos.find(c => c.id === convoId);
            if (found) openConvo(found);
        }
    }, [searchParams, convos]);

    /* ── Scroll للآخر ── */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ── جيب المحادثات ── */
    const fetchConvos = async () => {
        const { data } = await supabase
            .from("conversations")
            .select("id, last_message, last_message_at, user1_id, user2_id")
            .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
            .order("last_message_at", { ascending: false });

        if (!data) return;

        const enriched = await Promise.all(
            data.map(async (conv) => {
                const otherId = conv.user1_id === currentUser.id
                    ? conv.user2_id : conv.user1_id;
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("name, avatar_url, role")
                    .eq("id", otherId)
                    .single();

                const { count } = await supabase
                    .from("messages")
                    .select("id", { count: "exact", head: true })
                    .eq("conversation_id", conv.id)
                    .eq("is_read", false)
                    .neq("sender_id", currentUser.id);

                return { ...conv, other: profile, otherId, unread: count ?? 0 };
            })
        );
        setConvos(enriched);
    };

    /* ── افتح محادثة ── */
    const openConvo = async (conv) => {
        setShowNewChat(false);
        setActiveConvo(conv);
        activeConvoRef.current = conv;
        setMessages([]);
        setLoadingMsgs(true);

        const { data } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: true });

        setMessages(data ?? []);
        setLoadingMsgs(false);

        await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", currentUser.id);

        setConvos(prev =>
            prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c)
        );

        setTimeout(() => inputRef.current?.focus(), 100);
    };

    /* ── بعت رسالة ── */
    const sendMessage = async () => {
        if (!text.trim() || !activeConvo || sending) return;
        setSending(true);
        const content = text.trim();
        setText("");

        const { data: insertData, error: insertError } = await supabase
            .from("messages")
            .insert({
                conversation_id: activeConvo.id,
                sender_id: currentUser.id,
                content,
            });

        console.log("Insert result:", insertData, "Error:", insertError);

        const { data, error: fetchError } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", activeConvo.id)
            .order("created_at", { ascending: true });

        console.log("Messages after insert:", data, "Fetch error:", fetchError);

        setMessages(data ?? []);
        setSending(false);
    };
    /* ── ابدأ محادثة جديدة ── */
    const startNewChat = async (targetUser) => {
        setUserSearch("");
        setAllUsers([]);

        const existing = convos.find(c => c.otherId === targetUser.id);
        if (existing) {
            openConvo(existing);
            return;
        }

        // ✅ أضف last_message_at
        const { data: newConvo, error } = await supabase
            .from("conversations")
            .insert({
                user1_id: currentUser.id,
                user2_id: targetUser.id,
                last_message: null,
                last_message_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating conversation:", error);
            return;
        }

        if (newConvo) {
            const enriched = {
                ...newConvo,
                other: targetUser,
                otherId: targetUser.id,
                unread: 0,
            };
            setConvos(prev => [enriched, ...prev]);
            openConvo(enriched);
        }
    };

    /* ── جيب المستخدمين المسموح بيهم ── */
    const fetchUsers = async (q) => {
        const role = currentUser.role;
        let users = [];

        if (role === "admin") {
            const { data } = await supabase
                .from("profiles")
                .select("id, name, avatar_url, role")
                .neq("id", currentUser.id)
                .ilike("name", `%${q}%`)
                .limit(20);
            users = data ?? [];

        } else if (role === "student") {
            const { data: enrollments } = await supabase
                .from("enrollments")
                .select("course_id, courses(instructor_id)")
                .eq("user_id", currentUser.id);

            const instructorIds = [...new Set(
                (enrollments ?? []).map(e => e.courses?.instructor_id).filter(Boolean)
            )];

            if (instructorIds.length === 0) { setAllUsers([]); return; }

            const { data } = await supabase
                .from("profiles")
                .select("id, name, avatar_url, role")
                .in("id", instructorIds)
                .ilike("name", `%${q}%`);
            users = data ?? [];

        } else if (role === "instructor") {
            const { data: courses } = await supabase
                .from("courses")
                .select("id")
                .eq("instructor_id", currentUser.id);

            const courseIds = (courses ?? []).map(c => c.id);
            if (courseIds.length === 0) { setAllUsers([]); return; }

            const { data: enrollments } = await supabase
                .from("enrollments")
                .select("user_id")
                .in("course_id", courseIds);

            const studentIds = [...new Set(
                (enrollments ?? []).map(e => e.user_id).filter(Boolean)
            )];

            if (studentIds.length === 0) { setAllUsers([]); return; }

            const { data } = await supabase
                .from("profiles")
                .select("id, name, avatar_url, role")
                .in("id", studentIds)
                .ilike("name", `%${q}%`);
            users = data ?? [];
        }

        setAllUsers(users);
    };

    // بعد
    useEffect(() => {
        if (!showNewChat) return;
        setAllUsers([]);
        fetchUsers(userSearch);
    }, [showNewChat]);  // ← شيل userSearch من هنا

    useEffect(() => {
        if (!showNewChat) return;
        fetchUsers(userSearch);
    }, [userSearch]);  // ← ده بس للسيرش

    const filteredConvos = convos.filter(c =>
        c.other?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{
            display: "flex",
            height: "100vh",
            background: "var(--bg-page)",
            fontFamily: "var(--font)",
            direction: "rtl",
            paddingTop: "62px",
        }}>

            {/* ══ SIDEBAR ══ */}
            <div style={{
                width: "300px", minWidth: "300px",
                background: "var(--bg-surface)",
                borderLeft: "1px solid var(--border)",
                display: "flex", flexDirection: "column",
            }}>
                <div style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex", flexDirection: "column", gap: "10px",
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>
                            الرسائل
                        </span>
                        <button
                            onClick={() => { setShowNewChat(true); setActiveConvo(null); }}
                            style={{
                                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                                border: "none", borderRadius: "var(--radius-md)",
                                color: "#fff", fontSize: "12px", fontWeight: 700,
                                padding: "6px 12px", cursor: "pointer",
                            }}
                        >
                            + جديد
                        </button>
                    </div>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="بحث في المحادثات..."
                        style={{
                            width: "100%", padding: "8px 12px",
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            color: "var(--text-primary)",
                            fontFamily: "var(--font)", fontSize: "13px",
                            outline: "none",
                        }}
                    />
                </div>

                <div style={{ flex: 1, overflowY: "auto" }}>
                    {filteredConvos.length === 0 ? (
                        <div style={{
                            textAlign: "center", padding: "40px 20px",
                            color: "var(--text-muted)", fontSize: "13px",
                        }}>
                            <div style={{ fontSize: "32px", marginBottom: "8px" }}>💬</div>
                            لا توجد محادثات بعد
                        </div>
                    ) : filteredConvos.map(conv => (
                        <button
                            key={conv.id}
                            onClick={() => openConvo(conv)}
                            style={{
                                display: "flex", alignItems: "center", gap: "10px",
                                width: "100%", padding: "12px 16px",
                                background: activeConvo?.id === conv.id
                                    ? "rgba(99,102,241,.1)" : "none",
                                border: "none",
                                borderRight: activeConvo?.id === conv.id
                                    ? "3px solid var(--primary)" : "3px solid transparent",
                                borderBottom: "1px solid var(--border)",
                                cursor: "pointer", textAlign: "right",
                                transition: "background .15s",
                            }}
                        >
                            <div style={{
                                width: "40px", height: "40px", borderRadius: "50%",
                                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "15px", fontWeight: 800, color: "#fff",
                                flexShrink: 0, overflow: "hidden",
                            }}>
                                {conv.other?.avatar_url
                                    ? <img src={conv.other.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : conv.other?.name?.[0] ?? "؟"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                                        {conv.other?.name ?? "مستخدم"}
                                    </span>
                                    <span style={{ fontSize: "10px", color: "var(--text-hint)" }}>
                                        {conv.last_message_at ? timeAgo(conv.last_message_at) : ""}
                                    </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{
                                        fontSize: "12px", color: "var(--text-muted)",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        maxWidth: "160px",
                                    }}>
                                        {conv.last_message ?? "ابدأ المحادثة..."}
                                    </span>
                                    {conv.unread > 0 && (
                                        <span style={{
                                            minWidth: "18px", height: "18px", padding: "0 5px",
                                            background: "var(--danger)", color: "#fff",
                                            borderRadius: "99px", fontSize: "10px", fontWeight: 800,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            {conv.unread}
                                        </span>
                                    )}
                                </div>
                                {conv.other?.role && (
                                    <span style={{
                                        fontSize: "10px", fontWeight: 700,
                                        padding: "1px 6px", borderRadius: "99px",
                                        background: ROLE_COLOR[conv.other.role]?.bg,
                                        color: ROLE_COLOR[conv.other.role]?.color,
                                        display: "inline-block", marginTop: "3px",
                                    }}>
                                        {ROLE_LABEL[conv.other.role]}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ══ MAIN AREA ══ */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

                {/* ── محادثة جديدة ── */}
                {showNewChat && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{
                            padding: "16px 20px",
                            borderBottom: "1px solid var(--border)",
                            background: "var(--bg-surface)",
                        }}>
                            <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "12px" }}>
                                محادثة جديدة
                            </div>
                            <input
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                placeholder="ابحث عن مستخدم..."
                                autoFocus
                                style={{
                                    width: "100%", padding: "10px 14px",
                                    background: "var(--bg-card)",
                                    border: "1.5px solid var(--border-strong)",
                                    borderRadius: "var(--radius-md)",
                                    color: "var(--text-primary)",
                                    fontFamily: "var(--font)", fontSize: "13px", outline: "none",
                                }}
                            />
                            <div style={{ padding: "8px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                                {currentUser.role === "student" && "يمكنك التواصل مع مدرسي كورساتك فقط"}
                                {currentUser.role === "instructor" && "يمكنك التواصل مع طلابك المشتركين في كورساتك فقط"}
                                {currentUser.role === "admin" && "يمكنك التواصل مع جميع المستخدمين"}
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                            {allUsers.length === 0 ? (
                                <div style={{
                                    textAlign: "center", padding: "40px 20px",
                                    color: "var(--text-muted)", fontSize: "13px",
                                    display: "flex", flexDirection: "column",
                                    gap: "8px", alignItems: "center",
                                }}>
                                    <div style={{ fontSize: "32px" }}>
                                        {currentUser.role === "student" ? "📚" :
                                            currentUser.role === "instructor" ? "👥" : "🔍"}
                                    </div>
                                    {currentUser.role === "student" && "لا يوجد مدرسون — سجّل في كورس أولاً"}
                                    {currentUser.role === "instructor" && (userSearch
                                        ? `لا يوجد طلاب باسم "${userSearch}"`
                                        : "لا يوجد طلاب مشتركين في كورساتك بعد")}
                                    {currentUser.role === "admin" && "لا يوجد مستخدمون"}
                                </div>
                            ) : allUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => startNewChat(u)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "12px",
                                        width: "100%", padding: "12px 20px",
                                        background: "none", border: "none",
                                        borderBottom: "1px solid var(--border)",
                                        cursor: "pointer", textAlign: "right",
                                        transition: "background .12s",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                                >
                                    <div style={{
                                        width: "40px", height: "40px", borderRadius: "50%",
                                        background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "15px", fontWeight: 800, color: "#fff",
                                        flexShrink: 0, overflow: "hidden",
                                    }}>
                                        {u.avatar_url
                                            ? <img src={u.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            : u.name?.[0] ?? "؟"}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                                            {u.name}
                                        </div>
                                        {u.role && (
                                            <span style={{
                                                fontSize: "11px", fontWeight: 700,
                                                padding: "2px 8px", borderRadius: "99px",
                                                background: ROLE_COLOR[u.role]?.bg,
                                                color: ROLE_COLOR[u.role]?.color,
                                            }}>
                                                {ROLE_LABEL[u.role]}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── شاشة الترحيب ── */}
                {!showNewChat && !activeConvo && (
                    <div style={{
                        flex: 1, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        color: "var(--text-muted)", gap: "12px",
                    }}>
                        <div style={{ fontSize: "56px" }}>💬</div>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                            اختر محادثة أو ابدأ واحدة جديدة
                        </div>
                        <button
                            onClick={() => setShowNewChat(true)}
                            style={{
                                padding: "10px 24px",
                                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                                border: "none", borderRadius: "var(--radius-md)",
                                color: "#fff", fontSize: "13px", fontWeight: 700,
                                cursor: "pointer", marginTop: "8px",
                            }}
                        >
                            + ابدأ محادثة جديدة
                        </button>
                    </div>
                )}

                {/* ── Chat Window ── */}
                {!showNewChat && activeConvo && (
                    <>
                        <div style={{
                            padding: "12px 20px",
                            borderBottom: "1px solid var(--border)",
                            background: "var(--bg-surface)",
                            display: "flex", alignItems: "center",
                            justifyContent: "space-between",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{
                                    width: "40px", height: "40px", borderRadius: "50%",
                                    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "15px", fontWeight: 800, color: "#fff",
                                    overflow: "hidden",
                                }}>
                                    {activeConvo.other?.avatar_url
                                        ? <img src={activeConvo.other.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        : activeConvo.other?.name?.[0] ?? "؟"}
                                </div>
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                                        {activeConvo.other?.name}
                                    </div>
                                    {activeConvo.other?.role && (
                                        <span style={{
                                            fontSize: "11px", fontWeight: 700,
                                            padding: "1px 7px", borderRadius: "99px",
                                            background: ROLE_COLOR[activeConvo.other.role]?.bg,
                                            color: ROLE_COLOR[activeConvo.other.role]?.color,
                                        }}>
                                            {ROLE_LABEL[activeConvo.other.role]}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    title="مكالمة صوتية"
                                    onClick={() => window.__startCall?.(
                                        activeConvo.otherId,
                                        activeConvo.other?.name,
                                        activeConvo.id,
                                        false
                                    )}
                                    style={{
                                        width: "36px", height: "36px",
                                        background: "var(--bg-card)",
                                        border: "1px solid var(--border)",
                                        borderRadius: "var(--radius-md)",
                                        cursor: "pointer", fontSize: "16px",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>📞</button>

                                {/* <button
                                    title="مكالمة فيديو"
                                    onClick={() => window.__startCall?.(
                                        activeConvo.otherId,
                                        activeConvo.other?.name,
                                        activeConvo.id,
                                        false  
                                    )}
                                    style={{
                                        width: "36px", height: "36px",
                                        background: "var(--bg-card)",
                                        border: "1px solid var(--border)",
                                        borderRadius: "var(--radius-md)",
                                        cursor: "pointer", fontSize: "16px",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>🎥</button> */}
                            </div>
                        </div>

                        <div style={{
                            flex: 1, overflowY: "auto",
                            padding: "20px",
                            display: "flex", flexDirection: "column", gap: "10px",
                            background: "var(--bg-page)",
                        }}>
                            {loadingMsgs ? (
                                <div style={{ textAlign: "center", color: "var(--text-muted)", paddingTop: "40px" }}>
                                    جاري التحميل...
                                </div>
                            ) : messages.length === 0 ? (
                                <div style={{ textAlign: "center", color: "var(--text-muted)", paddingTop: "40px" }}>
                                    ابدأ المحادثة مع {activeConvo.other?.name} 👋
                                </div>
                            ) : messages.map(msg => {
                                const isMine = msg.sender_id === currentUser.id;
                                return (
                                    <div key={msg.id} style={{
                                        display: "flex",
                                        justifyContent: isMine ? "flex-start" : "flex-end",
                                    }}>
                                        <div style={{
                                            maxWidth: "65%",
                                            display: "flex", flexDirection: "column",
                                            alignItems: isMine ? "flex-start" : "flex-end",
                                            gap: "3px",
                                        }}>
                                            <div style={{
                                                padding: "10px 14px",
                                                borderRadius: isMine
                                                    ? "16px 16px 16px 4px"
                                                    : "16px 16px 4px 16px",
                                                background: isMine
                                                    ? "var(--bg-card)"
                                                    : "linear-gradient(135deg, var(--primary), var(--secondary))",
                                                border: isMine ? "1px solid var(--border)" : "none",
                                                color: isMine ? "var(--text-primary)" : "#fff",
                                                fontSize: "13px", lineHeight: "1.6",
                                            }}>
                                                {msg.content}
                                            </div>
                                            <span style={{ fontSize: "10px", color: "var(--text-hint)" }}>
                                                {timeAgo(msg.created_at)}
                                                {isMine && (
                                                    <span style={{ marginRight: "4px" }}>
                                                        {msg.is_read ? " ✓✓" : " ✓"}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={{
                            padding: "12px 20px",
                            borderTop: "1px solid var(--border)",
                            background: "var(--bg-surface)",
                            display: "flex", alignItems: "center", gap: "10px",
                        }}>
                            <input
                                ref={inputRef}
                                value={text}
                                onChange={e => setText(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                                placeholder="اكتب رسالة..."
                                style={{
                                    flex: 1, padding: "10px 14px",
                                    background: "var(--bg-card)",
                                    border: "1.5px solid var(--border-strong)",
                                    borderRadius: "99px",
                                    color: "var(--text-primary)",
                                    fontFamily: "var(--font)", fontSize: "13px",
                                    outline: "none",
                                }}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!text.trim() || sending}
                                style={{
                                    width: "40px", height: "40px",
                                    borderRadius: "50%",
                                    background: text.trim()
                                        ? "linear-gradient(135deg, var(--primary), var(--secondary))"
                                        : "var(--bg-card)",
                                    border: "1px solid var(--border)",
                                    cursor: text.trim() ? "pointer" : "not-allowed",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "16px", flexShrink: 0,
                                    transition: "all .2s",
                                }}
                            >
                                ➤
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}