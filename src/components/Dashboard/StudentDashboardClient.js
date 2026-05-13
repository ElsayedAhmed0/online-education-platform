"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import NotificationsTab from "@/components/common/NotificationsTab";

export default function StudentDashboardClient({ profile, enrollments }) {
    const router = useRouter();
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState("courses");
    const [userId, setUserId] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUserId(user.id);
        });
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            supabase
                .from("notifications")
                .select("id", { count: "exact" })
                .or(`user_id.eq.${user.id},type.eq.announcement`)
                .eq("is_read", false)
                .then(({ count }) => setUnreadCount(count ?? 0));
        });
    }, []);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;
        setUploadingAvatar(true);
        try {
            const ext = file.name.split(".").pop();
            const path = `avatars/${userId}.${ext}`;
            const { error: uploadErr } = await supabase.storage
                .from("eduplatform")
                .upload(path, file, { upsert: true });
            if (uploadErr) throw uploadErr;
            const { data } = supabase.storage.from("eduplatform").getPublicUrl(path);
            const url = data.publicUrl + `?t=${Date.now()}`;
            await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
            setAvatarUrl(url);
        } catch (err) {
            alert("خطأ في رفع الصورة: " + err.message);
        } finally {
            setUploadingAvatar(false);
            e.target.value = "";
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const handleNav = (tab) => {
        setActiveTab(tab);
        if (tab === "notifications") setUnreadCount(0);
        setDrawerOpen(false);
    };

    const completedCourses = enrollments.filter(e => e.progress === 100);
    const inProgressCourses = enrollments.filter(e => e.progress < 100);
    const totalHours = enrollments.length * 4;

    const SidebarContent = () => (
        <>
            <div className="StudentDashboard-logo" onClick={() => { router.push("/"); setDrawerOpen(false); }}>
                <div className="StudentDashboard-logoIcon">E</div>
                <span className="StudentDashboard-logoName">Edu<span>Platform</span></span>
            </div>

            <div className="StudentDashboard-profile">
                <label
                    htmlFor="avatarUploadStudent"
                    title={uploadingAvatar ? "جاري الرفع..." : "تغيير الصورة"}
                    style={{ position: "relative", cursor: "pointer", display: "inline-block", borderRadius: "50%", flexShrink: 0 }}
                >
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={profile?.name}
                            style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary)", display: "block" }}
                        />
                    ) : (
                        <div className="StudentDashboard-profileAvatar">
                            {(profile?.name ?? "").split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase() || "ط"}
                        </div>
                    )}
                    <input id="avatarUploadStudent" type="file" accept="image/*" hidden disabled={uploadingAvatar} onChange={handleAvatarUpload} />
                </label>
                <div>
                    <div className="StudentDashboard-profileName">{profile?.name}</div>
                    <div className="StudentDashboard-profileRole">طالب</div>
                </div>
            </div>

            <nav className="StudentDashboard-nav">
                {[
                    { id: "courses", label: "📚 كورساتي" },
                    { id: "achievements", label: "🏆 الإنجازات" },
                    { id: "notifications", label: `🔔 الإشعارات${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
                ].map(item => (
                    <div
                        key={item.id}
                        className={`StudentDashboard-navItem${activeTab === item.id ? " StudentDashboard-navActive" : ""}`}
                        onClick={() => handleNav(item.id)}
                    >
                        {item.label}
                    </div>
                ))}
                <div className="StudentDashboard-navItem" onClick={() => { router.push("/"); setDrawerOpen(false); }}>
                    🔍 اكتشف كورسات
                </div>
            </nav>

            <div className="StudentDashboard-sidebarFooter">
                <button className="StudentDashboard-logoutBtn" onClick={handleLogout}>
                    تسجيل الخروج
                </button>
            </div>
        </>
    );

    return (
        <div className="StudentDashboard-page">
            {/* ── Mobile topbar ── */}
            <div className="StudentDashboard-mobileTopbar">
                <button
                    className="StudentDashboard-menuBtn"
                    onClick={() => setDrawerOpen(true)}
                    aria-label="فتح القائمة"
                >
                    ☰
                </button>
                <span className="StudentDashboard-mobileTitle">لوحة الطالب</span>
                <div className="StudentDashboard-profileAvatar StudentDashboard-mobileAvatar">
                    {(profile?.name ?? "").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "ط"}
                </div>
            </div>

            {/* ── Mobile drawer overlay ── */}
            {drawerOpen && (
                <div
                    className="StudentDashboard-overlay"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            {/* ── Sidebar (desktop) / Drawer (mobile) ── */}
            <div className={`StudentDashboard-sidebar${drawerOpen ? " StudentDashboard-drawerOpen" : ""}`}>
                <button
                    className="StudentDashboard-closeDrawer"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="إغلاق القائمة"
                >
                    ✕
                </button>
                <SidebarContent />
            </div>

            {/* ── Main Content ── */}
            <main className="StudentDashboard-main">
                <div className="StudentDashboard-topbar">
                    <div>
                        <h1 className="StudentDashboard-pageTitle">
                            أهلاً، {profile?.name?.split(" ")[0]} 👋
                        </h1>
                        <p className="StudentDashboard-pageSub">تابع رحلتك التعليمية</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="StudentDashboard-statsGrid">
                    {[
                        { icon: "📚", label: "كورسات مسجلة", val: enrollments.length, color: "#818CF8" },
                        { icon: "✅", label: "كورسات مكتملة", val: completedCourses.length, color: "#10B981" },
                        { icon: "⏱️", label: "ساعات تعلّم", val: totalHours, color: "#FBBF24" },
                        { icon: "🔥", label: "قيد التعلم", val: inProgressCourses.length, color: "#EC4899" },
                    ].map(s => (
                        <div key={s.label} className="StudentDashboard-statCard">
                            <div className="StudentDashboard-statIcon">{s.icon}</div>
                            <div className="StudentDashboard-statVal" style={{ color: s.color }}>{s.val}</div>
                            <div className="StudentDashboard-statLbl">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="StudentDashboard-tabs">
                    {[
                        { id: "courses",       label: "كورساتي" },
                        { id: "achievements",  label: "الإنجازات" },
                        { id: "notifications", label: `🔔 الإشعارات${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
                    ].map(t => (
                        <button
                            key={t.id}
                            className={`StudentDashboard-tab${activeTab === t.id ? " StudentDashboard-tabActive" : ""}`}
                            onClick={() => handleNav(t.id)}
                        >{t.label}</button>
                    ))}
                </div>

                {/* Tab: Courses */}
                {activeTab === "courses" && (
                    <div>
                        {enrollments.length === 0 ? (
                            <div className="StudentDashboard-empty">
                                <div>📚</div>
                                <p>لم تسجل في أي كورس بعد</p>
                                <button className="StudentDashboard-exploreBtn" onClick={() => router.push("/")}>
                                    اكتشف الكورسات
                                </button>
                            </div>
                        ) : (
                            <div className="StudentDashboard-coursesList">
                                {enrollments.map(e => (
                                    <div key={e.id} className="StudentDashboard-courseCard">
                                        <img
                                            src={e.courses?.thumbnail}
                                            alt={e.courses?.title}
                                            className="StudentDashboard-courseThumb"
                                        />
                                        <div className="StudentDashboard-courseInfo">
                                            <div className="StudentDashboard-courseTitle">{e.courses?.title}</div>
                                            <div className="StudentDashboard-courseInstructor">
                                                {e.courses?.profiles?.name}
                                            </div>
                                            <div className="StudentDashboard-progressRow">
                                                <div className="StudentDashboard-progressTrack">
                                                    <div
                                                        className="StudentDashboard-progressFill"
                                                        style={{ width: `${e.progress}%` }}
                                                    />
                                                </div>
                                                <span className="StudentDashboard-progressPct">{e.progress}%</span>
                                            </div>
                                        </div>
                                        <button
                                            className="StudentDashboard-resumeBtn"
                                            onClick={() => router.push(`/learn/${e.course_id}/1`)}
                                        >
                                            {e.progress === 0 ? "ابدأ" : "كمّل"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Achievements */}
                {activeTab === "achievements" && (
                    <div className="StudentDashboard-achievementsGrid">
                        {[
                            { icon: "🎯", label: "أول تسجيل", unlocked: enrollments.length > 0 },
                            { icon: "📖", label: "متعلم نشيط", unlocked: enrollments.length >= 3 },
                            { icon: "🏆", label: "أتممت كورساً", unlocked: completedCourses.length > 0 },
                            { icon: "⭐", label: "نجم المنصة", unlocked: completedCourses.length >= 3 },
                        ].map(a => (
                            <div key={a.label} className={`StudentDashboard-achievement${!a.unlocked ? " StudentDashboard-locked" : ""}`}>
                                <div className="StudentDashboard-achievementIcon">{a.icon}</div>
                                <div className="StudentDashboard-achievementLabel">{a.label}</div>
                                {!a.unlocked && <div className="StudentDashboard-lockedLabel">مقفل 🔒</div>}
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab: Notifications */}
                {activeTab === "notifications" && userId && (
                    <NotificationsTab
                        userId={userId}
                        userRole="student"
                        prefix="StudentDashboard"
                    />
                )}
            </main>
        </div>
    );
}