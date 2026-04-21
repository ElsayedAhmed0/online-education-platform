"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./StudentDashboard.module.scss";

export default function StudentDashboardClient({ profile, enrollments }) {
    const router = useRouter();
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState("courses");

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const completedCourses = enrollments.filter(e => e.progress === 100);
    const inProgressCourses = enrollments.filter(e => e.progress < 100);
    const totalHours = enrollments.length * 4;

    const TABS = [
        { id: "courses", label: "كورساتي" },
        { id: "achievements", label: "الإنجازات" },
    ];

    return (
        <div className={styles.page}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.logo} onClick={() => router.push("/")}>
                    <div className={styles.logoIcon}>E</div>
                    <span className={styles.logoName}>Edu<span>Platform</span></span>
                </div>

                <div className={styles.profile}>
                    <div className={styles.profileAvatar}>
                        {profile?.name?.[0] ?? "ط"}
                    </div>
                    <div>
                        <div className={styles.profileName}>{profile?.name}</div>
                        <div className={styles.profileRole}>طالب</div>
                    </div>
                </div>

                <nav className={styles.nav}>
                    <div className={`${styles.navItem} ${activeTab === "courses" ? styles.navActive : ""}`}
                        onClick={() => setActiveTab("courses")}>
                        📚 كورساتي
                    </div>
                    <div className={`${styles.navItem} ${activeTab === "achievements" ? styles.navActive : ""}`}
                        onClick={() => setActiveTab("achievements")}>
                        🏆 الإنجازات
                    </div>
                    <div className={styles.navItem} onClick={() => router.push("/")}>
                        🔍 اكتشف كورسات
                    </div>
                </nav>

                <div className={styles.sidebarFooter}>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        تسجيل الخروج
                    </button>
                </div>
            </div>

            {/* Main */}
            <main className={styles.main}>
                {/* Topbar */}
                <div className={styles.topbar}>
                    <div>
                        <h1 className={styles.pageTitle}>
                            أهلاً، {profile?.name?.split(" ")[0]} 👋
                        </h1>
                        <p className={styles.pageSub}>تابع رحلتك التعليمية</p>
                    </div>
                </div>

                {/* Stats */}
                <div className={styles.statsGrid}>
                    {[
                        { icon: "📚", label: "كورسات مسجلة", val: enrollments.length, color: "#818CF8" },
                        { icon: "✅", label: "كورسات مكتملة", val: completedCourses.length, color: "#10B981" },
                        { icon: "⏱️", label: "ساعات تعلّم", val: totalHours, color: "#FBBF24" },
                        { icon: "🔥", label: "قيد التعلم", val: inProgressCourses.length, color: "#EC4899" },
                    ].map(s => (
                        <div key={s.label} className={styles.statCard}>
                            <div className={styles.statIcon}>{s.icon}</div>
                            <div className={styles.statVal} style={{ color: s.color }}>{s.val}</div>
                            <div className={styles.statLbl}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ""}`}
                            onClick={() => setActiveTab(t.id)}
                        >{t.label}</button>
                    ))}
                </div>

                {/* Tab: Courses */}
                {activeTab === "courses" && (
                    <div>
                        {enrollments.length === 0 ? (
                            <div className={styles.empty}>
                                <div>📚</div>
                                <p>لم تسجل في أي كورس بعد</p>
                                <button
                                    className={styles.exploreBtn}
                                    onClick={() => router.push("/")}
                                >اكتشف الكورسات</button>
                            </div>
                        ) : (
                            <div className={styles.coursesList}>
                                {enrollments.map(e => (
                                    <div key={e.id} className={styles.courseCard}>
                                        <img
                                            src={e.courses?.thumbnail}
                                            alt={e.courses?.title}
                                            className={styles.courseThumb}
                                        />
                                        <div className={styles.courseInfo}>
                                            <div className={styles.courseTitle}>{e.courses?.title}</div>
                                            <div className={styles.courseInstructor}>
                                                {e.courses?.profiles?.name}
                                            </div>
                                            <div className={styles.progressRow}>
                                                <div className={styles.progressTrack}>
                                                    <div
                                                        className={styles.progressFill}
                                                        style={{ width: `${e.progress}%` }}
                                                    />
                                                </div>
                                                <span className={styles.progressPct}>{e.progress}%</span>
                                            </div>
                                        </div>
                                        <button
                                            className={styles.resumeBtn}
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
                    <div className={styles.achievementsGrid}>
                        {[
                            { icon: "🎯", label: "أول تسجيل", unlocked: enrollments.length > 0 },
                            { icon: "📖", label: "متعلم نشيط", unlocked: enrollments.length >= 3 },
                            { icon: "🏆", label: "أتممت كورساً", unlocked: completedCourses.length > 0 },
                            { icon: "⭐", label: "نجم المنصة", unlocked: completedCourses.length >= 3 },
                        ].map(a => (
                            <div key={a.label} className={`${styles.achievement} ${!a.unlocked ? styles.locked : ""}`}>
                                <div className={styles.achievementIcon}>{a.icon}</div>
                                <div className={styles.achievementLabel}>{a.label}</div>
                                {!a.unlocked && <div className={styles.lockedLabel}>مقفل 🔒</div>}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}