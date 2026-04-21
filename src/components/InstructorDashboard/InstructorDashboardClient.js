"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./InstructorDashboard.module.scss";

const STATUS_LABELS = {
    live: { label: "منشور", color: "#10B981", bg: "rgba(16,185,129,.12)" },
    draft: { label: "مسودة", color: "rgba(255,255,255,.5)", bg: "rgba(255,255,255,.07)" },
    review: { label: "قيد المراجعة", color: "#FBBF24", bg: "rgba(245,158,11,.12)" },
};

export default function InstructorDashboardClient({
    profile, courses, transactions, totalStudents, totalRevenue
}) {
    const router = useRouter();
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState("overview");

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const avgRating = courses.length > 0
        ? (courses.reduce((sum, c) => sum + (c.rating ?? 0), 0) / courses.length).toFixed(1)
        : 0;

    return (
        <div className={styles.page}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.logo} onClick={() => router.push("/")}>
                    <div className={styles.logoIcon}>E</div>
                    <span className={styles.logoName}>Edu<span>Platform</span></span>
                </div>

                <div className={styles.profile}>
                    <div className={styles.profileAvatar}>{profile?.name?.[0] ?? "م"}</div>
                    <div>
                        <div className={styles.profileName}>{profile?.name}</div>
                        <div className={styles.profileRole}>مدرس</div>
                    </div>
                </div>

                <nav className={styles.nav}>
                    {[
                        { id: "overview", label: "الداشبورد", icon: "⊞" },
                        { id: "courses", label: "كورساتي", icon: "📚" },
                        { id: "earnings", label: "الأرباح", icon: "💰" },
                    ].map(item => (
                        <div
                            key={item.id}
                            className={`${styles.navItem} ${activeTab === item.id ? styles.navActive : ""}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </div>
                    ))}
                    <div className={styles.navItem} onClick={() => router.push("/instructor/courses/create")}>
                        <span>➕</span> إنشاء كورس
                    </div>
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.navItem} onClick={() => router.push("/dashboard")}>
                        ↔ عرض كطالب
                    </div>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        تسجيل الخروج
                    </button>
                </div>
            </div>

            {/* Main */}
            <main className={styles.main}>
                <div className={styles.topbar}>
                    <div>
                        <h1 className={styles.pageTitle}>مرحباً، {profile?.name?.split(" ")[0]} 👨‍🏫</h1>
                        <p className={styles.pageSub}>لوحة تحكم المدرس</p>
                    </div>
                    <button
                        className={styles.createBtn}
                        onClick={() => router.push("/instructor/courses/create")}
                    >
                        + إنشاء كورس
                    </button>
                </div>

                {/* KPIs */}
                <div className={styles.kpiGrid}>
                    {[
                        { icon: "👥", label: "إجمالي الطلاب", val: totalStudents, color: "#818CF8" },
                        { icon: "💰", label: "الإيرادات (ج.م)", val: totalRevenue.toLocaleString(), color: "#10B981" },
                        { icon: "⭐", label: "متوسط التقييم", val: avgRating, color: "#FBBF24" },
                        { icon: "📚", label: "الكورسات", val: courses.length, color: "#EC4899" },
                    ].map(k => (
                        <div key={k.label} className={styles.kpiCard}>
                            <div className={styles.kpiIcon}>{k.icon}</div>
                            <div className={styles.kpiVal} style={{ color: k.color }}>{k.val}</div>
                            <div className={styles.kpiLbl}>{k.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    {[
                        { id: "overview", label: "نظرة عامة" },
                        { id: "courses", label: "كورساتي" },
                        { id: "earnings", label: "الأرباح" },
                    ].map(t => (
                        <button
                            key={t.id}
                            className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ""}`}
                            onClick={() => setActiveTab(t.id)}
                        >{t.label}</button>
                    ))}
                </div>

                {/* Tab: Overview */}
                {activeTab === "overview" && (
                    <div className={styles.coursesList}>
                        {courses.slice(0, 3).map(c => {
                            const s = STATUS_LABELS[c.status] ?? STATUS_LABELS.draft;
                            return (
                                <div key={c.id} className={styles.courseRow}>
                                    <img src={c.thumbnail} alt={c.title} className={styles.courseThumb} />
                                    <div className={styles.courseInfo}>
                                        <div className={styles.courseTitle}>{c.title}</div>
                                        <div className={styles.courseMeta}>
                                            {c.enrollments?.[0]?.count ?? 0} طالب · ★ {c.rating}
                                        </div>
                                    </div>
                                    <span className={styles.statusBadge} style={{ color: s.color, background: s.bg }}>
                                        {s.label}
                                    </span>
                                    <div className={styles.courseRevenue}>{c.price} ج.م</div>
                                </div>
                            );
                        })}
                        {courses.length === 0 && (
                            <div className={styles.empty}>
                                <div>📚</div>
                                <p>لم تنشئ أي كورس بعد</p>
                                <button className={styles.createBtn} onClick={() => router.push("/instructor/courses/create")}>
                                    إنشاء أول كورس
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Courses */}
                {activeTab === "courses" && (
                    <div className={styles.coursesList}>
                        {courses.map(c => {
                            const s = STATUS_LABELS[c.status] ?? STATUS_LABELS.draft;
                            return (
                                <div key={c.id} className={styles.courseRow}>
                                    <img src={c.thumbnail} alt={c.title} className={styles.courseThumb} />
                                    <div className={styles.courseInfo}>
                                        <div className={styles.courseTitle}>{c.title}</div>
                                        <div className={styles.courseMeta}>
                                            {c.enrollments?.[0]?.count ?? 0} طالب · ★ {c.rating} · {c.price} ج.م
                                        </div>
                                    </div>
                                    <span className={styles.statusBadge} style={{ color: s.color, background: s.bg }}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                        {courses.length === 0 && (
                            <div className={styles.empty}>
                                <div>📚</div>
                                <p>لم تنشئ أي كورس بعد</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Earnings */}
                {activeTab === "earnings" && (
                    <div className={styles.coursesList}>
                        {transactions.length === 0 ? (
                            <div className={styles.empty}>
                                <div>💰</div>
                                <p>لا توجد معاملات بعد</p>
                            </div>
                        ) : (
                            transactions.map(t => (
                                <div key={t.id} className={styles.txRow}>
                                    <div className={styles.txType}>
                                        {t.type === "purchase" ? "💰 شراء" : "📤 سحب"}
                                    </div>
                                    <div className={styles.txAmount} style={{ color: t.amount > 0 ? "#10B981" : "#818CF8" }}>
                                        {t.amount > 0 ? "+" : ""}{t.amount} ج.م
                                    </div>
                                    <div className={styles.txDate}>
                                        {new Date(t.created_at).toLocaleDateString("ar-EG")}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}