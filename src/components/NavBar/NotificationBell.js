"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

/* ── Default dashboard per role ── */
const ROLE_DASHBOARD = {
    student: "/dashboard",
    instructor: "/instructor/dashboard",
    admin: "/admin/dashboard",
};

/* ── Notification type config — defaultLink حسب الداشبورد المناسب ── */
const TYPE_CONFIG = {
    /* إشعارات الطالب */
    new_lesson: { icon: "🎓", color: "#818CF8", bg: "rgba(99,102,241,.15)", label: "درس جديد", defaultLink: "/dashboard" },
    certificate: { icon: "🏆", color: "#FBBF24", bg: "rgba(251,191,36,.15)", label: "شهادة", defaultLink: "/dashboard" },

    /* إشعارات الكل */
    announcement: { icon: "📢", color: "#10B981", bg: "rgba(16,185,129,.15)", label: "إعلان", defaultLink: null },

    /* إشعارات المدرس */
    enrollment: { icon: "👤", color: "#3B82F6", bg: "rgba(59,130,246,.15)", label: "تسجيل", defaultLink: "/instructor/dashboard" },
    course_approved: { icon: "✅", color: "#10B981", bg: "rgba(16,185,129,.15)", label: "موافقة كورس", defaultLink: "/instructor/dashboard" },

    /* إشعارات الأدمن */
    new_user: { icon: "👥", color: "#818CF8", bg: "rgba(99,102,241,.15)", label: "مستخدم جديد", defaultLink: "/admin/dashboard" },
    new_course: { icon: "📚", color: "#F59E0B", bg: "rgba(245,158,11,.15)", label: "كورس جديد", defaultLink: "/admin/dashboard" },
};

const DEFAULT = { icon: "🔔", color: "#818CF8", bg: "rgba(99,102,241,.15)", label: "إشعار", defaultLink: null };
function getConfig(type) { return TYPE_CONFIG[type] ?? DEFAULT; }

/* يحدد الرابط الصحيح للإشعار */
function resolveLink(notif, userRole) {
    if (notif.link) return notif.link;                         // رابط مخصص
    const cfg = getConfig(notif.type);
    if (cfg.defaultLink) return cfg.defaultLink;               // رابط افتراضي للنوع
    return ROLE_DASHBOARD[userRole] ?? "/dashboard";           // داشبورد اليوزر
}

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return "الآن";
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return new Date(dateStr).toLocaleDateString("ar-EG");
}

export default function NotificationBell() {
    const supabase = createClient();
    const router = useRouter();
    const dropRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [notifs, setNotifs] = useState([]);
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState("student");

    const unread = notifs.filter(n => !n.is_read).length;

    /* ── جيب الـ user ID + role ── */
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            setUserId(user.id);
            supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single()
                .then(({ data }) => {
                    if (data?.role) setUserRole(data.role);
                });
        });
    }, []);

    /* ── جيب الإشعارات + Realtime ── */
    useEffect(() => {
        if (!userId) return;

        const fetchNotifs = async () => {
            const { data } = await supabase
                .from("notifications")
                .select("*")
                .or(`user_id.eq.${userId},type.eq.announcement`)
                .order("created_at", { ascending: false })
                .limit(4);
            if (data) setNotifs(data);
        };

        fetchNotifs();

        const channel = supabase
            .channel(`notifications-bell-${userId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "notifications" },
                (payload) => {
                    const n = payload.new;
                    if (n.user_id === userId || n.type === "announcement") {
                        setNotifs(prev => [n, ...prev].slice(0, 4));
                    }
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [userId]);

    /* ── Close on outside click ── */
    useEffect(() => {
        const handler = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* ── Mark as read + navigate ── */
    const markRead = async (notif) => {
        if (!notif.is_read) {
            await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notif.id);
            setNotifs(prev =>
                prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
            );
        }
        setOpen(false);
        router.push(resolveLink(notif, userRole));
    };

    /* ── Mark all read ── */
    const markAllRead = async () => {
        const ids = notifs.filter(n => !n.is_read).map(n => n.id);
        if (!ids.length) return;
        await supabase
            .from("notifications")
            .update({ is_read: true })
            .in("id", ids);
        setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    if (!userId) return null;


    return (
        <div className="NotisBell-wrap" ref={dropRef}>
            {/* ── Bell Button ── */}
            <button
                className={`NotisBell-btn${open ? " NotisBell-btnOpen" : ""}`}
                onClick={() => setOpen(o => !o)}
                aria-label="الإشعارات"
            >
                <span className="NotisBell-icon">🔔</span>
                {unread > 0 && (
                    <span className="NotisBell-badge">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {/* ── Dropdown ── */}
            {open && (
                <div className="NotisBell-dropdown">
                    {/* Header */}
                    <div className="NotisBell-header">
                        <span className="NotisBell-headerTitle">الإشعارات</span>
                        {unread > 0 && (
                            <button
                                className="NotisBell-markAll"
                                onClick={markAllRead}
                            >
                                تعليم الكل كمقروء
                            </button>
                        )}
                    </div>

                    {/* List */}
                    {notifs.length === 0 ? (
                        <div className="NotisBell-empty">
                            <span>🔕</span>
                            <p>لا توجد إشعارات</p>
                        </div>
                    ) : (
                        <div className="NotisBell-list">
                            {notifs.map(n => {
                                const cfg = getConfig(n.type);
                                return (
                                    <button
                                        key={n.id}
                                        className={`NotisBell-item${!n.is_read ? " NotisBell-unread" : ""}`}
                                        onClick={() => markRead(n)}
                                    >
                                        <div
                                            className="NotisBell-itemIcon"
                                            style={{ background: cfg.bg, color: cfg.color }}
                                        >
                                            {cfg.icon}
                                        </div>
                                        <div className="NotisBell-itemBody">
                                            <div className="NotisBell-itemTitle">{n.title}</div>
                                            {n.body && (
                                                <div className="NotisBell-itemText">
                                                    {n.body.length > 55 ? n.body.slice(0, 55) + "…" : n.body}
                                                </div>
                                            )}
                                            <div className="NotisBell-itemTime">{timeAgo(n.created_at)}</div>
                                        </div>
                                        {!n.is_read && <div className="NotisBell-dot" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer */}
                    <button
                        className="NotisBell-footer"
                        onClick={() => {
                            setOpen(false);
                            router.push(ROLE_DASHBOARD[userRole] ?? "/dashboard");
                        }}
                    >
                        عرض الكل في الداشبورد ←
                    </button>
                </div>
            )}
        </div>
    );
}
