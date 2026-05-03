"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

/* ── Type config ── */
const TYPE_CONFIG = {
    new_lesson:      { icon: "🎓", color: "#818CF8", bg: "rgba(99,102,241,.15)",  label: "درس جديد" },
    certificate:     { icon: "🏆", color: "#FBBF24", bg: "rgba(251,191,36,.15)",  label: "شهادة" },
    announcement:    { icon: "📢", color: "#10B981", bg: "rgba(16,185,129,.15)",  label: "إعلان عام" },
    enrollment:      { icon: "👤", color: "#3B82F6", bg: "rgba(59,130,246,.15)",  label: "تسجيل" },
    course_approved: { icon: "✅", color: "#10B981", bg: "rgba(16,185,129,.15)",  label: "موافقة كورس" },
    new_user:        { icon: "👥", color: "#818CF8", bg: "rgba(99,102,241,.15)",  label: "مستخدم جديد" },
    new_course:      { icon: "📚", color: "#F59E0B", bg: "rgba(245,158,11,.15)",  label: "كورس جديد" },
};
const DEFAULT_CFG = { icon: "🔔", color: "#818CF8", bg: "rgba(99,102,241,.15)", label: "إشعار" };
function getCfg(type) { return TYPE_CONFIG[type] ?? DEFAULT_CFG; }

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)     return "الآن";
    if (diff < 3600)   return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400)  return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return new Date(dateStr).toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
}

/* ─────────────────────────────────────────────────────
   NotificationsTab
   يُستخدم داخل داشبورد الطالب والمدرس والأدمن
   Props:
     userId   — UUID اليوزر
     userRole — "student" | "instructor" | "admin"
     prefix   — class prefix مثل "StudentDashboard" | "InstructorDashboard" | "AdminDashboard"
───────────────────────────────────────────────────── */
export default function NotificationsTab({ userId, userRole, prefix = "StudentDashboard" }) {
    const supabase = createClient();
    const router   = useRouter();

    const [notifs,  setNotifs]  = useState([]);
    const [loading, setLoading] = useState(true);

    /* ── جيب الإشعارات ── */
    useEffect(() => {
        if (!userId) return;

        const fetch = async () => {
            setLoading(true);
            const { data } = await supabase
                .from("notifications")
                .select("*")
                .or(`user_id.eq.${userId},type.eq.announcement`)
                .order("created_at", { ascending: false })
                .limit(50);
            setNotifs(data ?? []);
            setLoading(false);
        };

        fetch();

        /* Realtime */
        const channel = supabase
            .channel(`notifications-tab-${userId}`)
            .on("postgres_changes",
                { event: "INSERT", schema: "public", table: "notifications" },
                (payload) => {
                    const n = payload.new;
                    if (n.user_id === userId || n.type === "announcement") {
                        setNotifs(prev => [n, ...prev]);
                    }
                }
            ).subscribe();

        return () => supabase.removeChannel(channel);
    }, [userId]);

    /* ── Mark single as read ── */
    const markRead = async (notif) => {
        if (notif.is_read) return;
        await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
        setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    };

    /* ── Mark all read ── */
    const markAllRead = async () => {
        const ids = notifs.filter(n => !n.is_read).map(n => n.id);
        if (!ids.length) return;
        await supabase.from("notifications").update({ is_read: true }).in("id", ids);
        setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const unread = notifs.filter(n => !n.is_read).length;

    /* ── CSS Classes (نفس الـ prefix بتاع الداشبورد) ── */
    const cx = (name) => `${prefix}-${name}`;

    if (loading) {
        return (
            <div className={cx("notifLoading")}>
                <div className={cx("notifSpinner")} />
                جاري تحميل الإشعارات...
            </div>
        );
    }

    return (
        <div className={cx("notifRoot")}>
            {/* Header */}
            <div className={cx("notifHeader")}>
                <div>
                    <h2 className={cx("notifTitle")}>🔔 الإشعارات</h2>
                    <p className={cx("notifSub")}>
                        {unread > 0
                            ? `لديك ${unread} إشعار غير مقروء`
                            : "كل إشعاراتك مقروءة ✓"}
                    </p>
                </div>
                {unread > 0 && (
                    <button className={cx("notifMarkAllBtn")} onClick={markAllRead}>
                        ✓ تعليم الكل كمقروء
                    </button>
                )}
            </div>

            {/* List */}
            {notifs.length === 0 ? (
                <div className={cx("notifEmpty")}>
                    <div className={cx("notifEmptyIcon")}>🔕</div>
                    <p className={cx("notifEmptyText")}>لا توجد إشعارات بعد</p>
                </div>
            ) : (
                <div className={cx("notifList")}>
                    {notifs.map(n => {
                        const cfg = getCfg(n.type);
                        return (
                            <div
                                key={n.id}
                                className={`${cx("notifItem")} ${!n.is_read ? cx("notifUnread") : ""}`}
                                onClick={() => {
                                    markRead(n);
                                    if (n.link) router.push(n.link);
                                }}
                            >
                                {/* Icon */}
                                <div
                                    className={cx("notifItemIcon")}
                                    style={{ background: cfg.bg, color: cfg.color }}
                                >
                                    {cfg.icon}
                                </div>

                                {/* Body */}
                                <div className={cx("notifItemBody")}>
                                    <div className={cx("notifItemMeta")}>
                                        <span
                                            className={cx("notifTypeBadge")}
                                            style={{ background: cfg.bg, color: cfg.color }}
                                        >
                                            {cfg.label}
                                        </span>
                                        <span className={cx("notifItemTime")}>
                                            {timeAgo(n.created_at)}
                                        </span>
                                    </div>
                                    <div className={cx("notifItemTitle")}>{n.title}</div>
                                    {n.body && (
                                        <div className={cx("notifItemText")}>{n.body}</div>
                                    )}
                                </div>

                                {/* Unread dot */}
                                {!n.is_read && <div className={cx("notifDot")} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
