"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

/* ── Default dashboard per role ── */
const ROLE_DASHBOARD = {
    student:    "/dashboard",
    instructor: "/instructor/dashboard",
    admin:      "/admin/dashboard",
};

/* ── Type config ── */
const TYPE_CONFIG = {
    new_lesson:      { icon: "🎓", color: "#818CF8", bg: "rgba(99,102,241,.15)",  label: "درس جديد",    tab: "student",    defaultLink: "/dashboard" },
    certificate:     { icon: "🏆", color: "#FBBF24", bg: "rgba(251,191,36,.15)",  label: "شهادة",        tab: "student",    defaultLink: "/dashboard" },
    announcement:    { icon: "📢", color: "#10B981", bg: "rgba(16,185,129,.15)",  label: "إعلان عام",   tab: "all",        defaultLink: null },
    enrollment:      { icon: "👤", color: "#3B82F6", bg: "rgba(59,130,246,.15)",  label: "تسجيل",       tab: "instructor", defaultLink: "/instructor/dashboard" },
    course_approved: { icon: "✅", color: "#10B981", bg: "rgba(16,185,129,.15)",  label: "موافقة كورس", tab: "instructor", defaultLink: "/instructor/dashboard" },
    new_user:        { icon: "👥", color: "#818CF8", bg: "rgba(99,102,241,.15)",  label: "مستخدم جديد", tab: "admin",      defaultLink: "/admin/dashboard" },
    new_course:      { icon: "📚", color: "#F59E0B", bg: "rgba(245,158,11,.15)",  label: "كورس جديد",   tab: "admin",      defaultLink: "/admin/dashboard" },
};

const DEFAULT_CFG = { icon: "🔔", color: "#818CF8", bg: "rgba(99,102,241,.15)", label: "إشعار", tab: "all", defaultLink: null };
function getCfg(type) { return TYPE_CONFIG[type] ?? DEFAULT_CFG; }

/* يحدد رابط الإشعار — نفس المنطق في الـ Bell */
function resolveLink(notif, userRole) {
    if (notif.link) return notif.link;
    const cfg = getCfg(notif.type);
    if (cfg.defaultLink) return cfg.defaultLink;
    return ROLE_DASHBOARD[userRole] ?? "/dashboard";
}

/* Default tab حسب الدور */
function defaultTabForRole(role) {
    if (role === "admin")      return "admin";
    if (role === "instructor") return "instructor";
    return "student";
}


/* ── Tab definitions ── */
const TABS = [
    { id: "all",        label: "الكل",         icon: "🔔" },
    { id: "student",    label: "كطالب",        icon: "🎓" },
    { id: "instructor", label: "كمدرس",        icon: "📚" },
    { id: "admin",      label: "الأدمن",       icon: "🛡" },
];

export default function NotificationsPage({ initialNotifs = [], userId, userRole }) {
    const supabase = createClient();
    const router   = useRouter();

    const [notifs,    setNotifs]   = useState(initialNotifs);
    const [activeTab, setActiveTab] = useState(defaultTabForRole(userRole));
    const [loading,   setLoading]  = useState(false);

    /* ── Realtime subscription ── */
    useEffect(() => {
        if (!userId) return;
        const channel = supabase
            .channel("notifications-page")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "notifications" },
                (payload) => {
                    const n = payload.new;
                    if (n.user_id === userId || n.type === "announcement") {
                        setNotifs(prev => [n, ...prev]);
                    }
                }
            )
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [userId]);

    /* ── Filter by tab ── */
    const filtered = notifs.filter(n => {
        if (activeTab === "all") return true;
        const cfg = getCfg(n.type);
        return cfg.tab === activeTab || cfg.tab === "all";
    });

    /* ── Mark single as read ── */
    const markRead = async (notif) => {
        if (notif.is_read) return;
        await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
        setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    };

    /* ── Mark all read ── */
    const markAllRead = async () => {
        setLoading(true);
        const ids = notifs.filter(n => !n.is_read).map(n => n.id);
        if (ids.length) {
            await supabase.from("notifications").update({ is_read: true }).in("id", ids);
            setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
        }
        setLoading(false);
    };

    const unread = notifs.filter(n => !n.is_read).length;

    /* ── Show tabs based on role ── */
    const visibleTabs = TABS.filter(t => {
        if (t.id === "admin")      return userRole === "admin";
        if (t.id === "instructor") return userRole === "instructor" || userRole === "admin";
        return true;
    });

    return (
        <div className="NotifPage-root">
            <div className="NotifPage-container">

                {/* ── Page Header ── */}
                <div className="NotifPage-header">
                    <div>
                        <h1 className="NotifPage-title">🔔 الإشعارات</h1>
                        <p className="NotifPage-sub">
                            {unread > 0 ? `لديك ${unread} إشعار غير مقروء` : "كل الإشعارات مقروءة"}
                        </p>
                    </div>
                    {unread > 0 && (
                        <button
                            className="NotifPage-markAllBtn"
                            onClick={markAllRead}
                            disabled={loading}
                        >
                            {loading ? "⏳ جاري..." : "✓ تعليم الكل كمقروء"}
                        </button>
                    )}
                </div>

                {/* ── Tabs ── */}
                <div className="NotifPage-tabs">
                    {visibleTabs.map(t => (
                        <button
                            key={t.id}
                            className={`NotifPage-tab${activeTab === t.id ? " NotifPage-tabActive" : ""}`}
                            onClick={() => setActiveTab(t.id)}
                        >
                            <span>{t.icon}</span>
                            {t.label}
                            {t.id === "all" && unread > 0 && (
                                <span className="NotifPage-tabBadge">{unread}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Notification List ── */}
                <div className="NotifPage-list">
                    {filtered.length === 0 ? (
                        <div className="NotifPage-empty">
                            <div className="NotifPage-emptyIcon">🔕</div>
                            <p className="NotifPage-emptyText">لا توجد إشعارات في هذا القسم</p>
                        </div>
                    ) : (
                        filtered.map(n => {
                            const cfg = getCfg(n.type);
                            return (
                                <div
                                    key={n.id}
                                    className={`NotifPage-item${!n.is_read ? " NotifPage-unread" : ""}`}
                                    onClick={() => {
                                        markRead(n);
                                        router.push(resolveLink(n, userRole));
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    {/* Icon */}
                                    <div
                                        className="NotifPage-itemIcon"
                                        style={{ background: cfg.bg, color: cfg.color }}
                                    >
                                        {cfg.icon}
                                    </div>

                                    {/* Body */}
                                    <div className="NotifPage-itemBody">
                                        <div className="NotifPage-itemMeta">
                                            <span
                                                className="NotifPage-typeBadge"
                                                style={{ background: cfg.bg, color: cfg.color }}
                                            >
                                                {cfg.label}
                                            </span>
                                            <span className="NotifPage-itemTime">{timeAgo(n.created_at)}</span>
                                        </div>
                                        <div className="NotifPage-itemTitle">{n.title}</div>
                                        {n.body && (
                                            <div className="NotifPage-itemText">{n.body}</div>
                                        )}
                                    </div>

                                    {/* Unread dot */}
                                    {!n.is_read && <div className="NotifPage-dot" />}
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
}
