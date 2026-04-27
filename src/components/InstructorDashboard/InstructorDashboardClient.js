"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import AddLessonModal from "./AddLessonModal";
import CouponsManager from "./CouponsManager";

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
    const [showAddLesson, setShowAddLesson] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const avgRating = courses.length > 0
        ? (courses.reduce((sum, c) => sum + (c.rating ?? 0), 0) / courses.length).toFixed(1)
        : 0;

    return (
        <div className={"InstructorDashboard-page"}>
            {/* Sidebar */}
            <div className={"InstructorDashboard-sidebar"}>
                <div className={"InstructorDashboard-logo"} onClick={() => router.push("/")}>
                    <div className={"InstructorDashboard-logoIcon"}>E</div>
                    <span className={"InstructorDashboard-logoName"}>Edu<span>Platform</span></span>
                </div>

                <div className={"InstructorDashboard-profile"}>
                    <div className={"InstructorDashboard-profileAvatar"}>{profile?.name?.[0] ?? "م"}</div>
                    <div>
                        <div className={"InstructorDashboard-profileName"}>{profile?.name}</div>
                        <div className={"InstructorDashboard-profileRole"}>مدرس</div>
                    </div>
                </div>

                <nav className={"InstructorDashboard-nav"}>
                    {[
                        { id: "overview", label: "الداشبورد", icon: "⊞" },
                        { id: "courses", label: "كورساتي", icon: "📚" },
                        { id: "earnings", label: "الأرباح", icon: "💰" },
                    ].map(item => (
                        <div
                            key={item.id}
                            className={`${"InstructorDashboard-navItem"} ${activeTab === item.id ? "InstructorDashboard-navActive" : ""}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </div>
                    ))}
                    <div
                        className={"InstructorDashboard-navItem"}
                        onClick={() => router.push("/instructor/courses/create")}
                    >
                        <span>➕</span> إنشاء كورس
                    </div>
                </nav>

                <div className={"InstructorDashboard-sidebarFooter"}>
                    <div
                        className={"InstructorDashboard-navItem"}
                        onClick={() => router.push("/dashboard")}
                    >
                        ↔ عرض كطالب
                    </div>
                    <button className={"InstructorDashboard-logoutBtn"} onClick={handleLogout}>
                        تسجيل الخروج
                    </button>
                </div>
            </div>

            {/* Main */}
            <main className={"InstructorDashboard-main"}>
                <div className={"InstructorDashboard-topbar"}>
                    <div>
                        <h1 className={"InstructorDashboard-pageTitle"}>
                            مرحباً، {profile?.name?.split(" ")[0]} 👨‍🏫
                        </h1>
                        <p className={"InstructorDashboard-pageSub"}>لوحة تحكم المدرس</p>
                    </div>
                    <button
                        className={"InstructorDashboard-createBtn"}
                        onClick={() => router.push("/instructor/courses/create")}
                    >
                        + إنشاء كورس
                    </button>
                </div>

                {/* KPIs */}
                <div className={"InstructorDashboard-kpiGrid"}>
                    {[
                        { icon: "👥", label: "إجمالي الطلاب", val: totalStudents, color: "#818CF8" },
                        { icon: "💰", label: "الإيرادات (ج.م)", val: totalRevenue.toLocaleString(), color: "#10B981" },
                        { icon: "⭐", label: "متوسط التقييم", val: avgRating, color: "#FBBF24" },
                        { icon: "📚", label: "الكورسات", val: courses.length, color: "#EC4899" },
                    ].map(k => (
                        <div key={k.label} className={"InstructorDashboard-kpiCard"}>
                            <div className={"InstructorDashboard-kpiIcon"}>{k.icon}</div>
                            <div className={"InstructorDashboard-kpiVal"} style={{ color: k.color }}>{k.val}</div>
                            <div className={"InstructorDashboard-kpiLbl"}>{k.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className={"InstructorDashboard-tabs"}>
                    {[
                        { id: "overview", label: "نظرة عامة" },
                        { id: "courses", label: "كورساتي" },
                        { id: "earnings", label: "الأرباح" },
                    ].map(t => (
                        <button
                            key={t.id}
                            className={`${"InstructorDashboard-tab"} ${activeTab === t.id ? "InstructorDashboard-tabActive" : ""}`}
                            onClick={() => setActiveTab(t.id)}
                        >{t.label}</button>
                    ))}
                </div>

                {/* Tab: Overview */}
                {activeTab === "overview" && (
                    <div className={"InstructorDashboard-coursesList"}>
                        {courses.slice(0, 3).map(c => {
                            const s = STATUS_LABELS[c.status] ?? STATUS_LABELS.draft;
                            return (
                                <div key={c.id} className={"InstructorDashboard-courseRow"}>
                                    {c.thumbnail && (
                                        <img src={c.thumbnail} alt={c.title} className={"InstructorDashboard-courseThumb"} />
                                    )}
                                    <div className={"InstructorDashboard-courseInfo"}>
                                        <div className={"InstructorDashboard-courseTitle"}>{c.title}</div>
                                        <div className={"InstructorDashboard-courseMeta"}>
                                            {c.enrollments?.[0]?.count ?? 0} طالب · ★ {c.rating}
                                        </div>
                                    </div>
                                    <span
                                        className={"InstructorDashboard-statusBadge"}
                                        style={{ color: s.color, background: s.bg }}
                                    >{s.label}</span>
                                    <div className={"InstructorDashboard-courseRevenue"}>{c.price} ج.م</div>
                                </div>
                            );
                        })}
                        {courses.length === 0 && (
                            <div className={"InstructorDashboard-empty"}>
                                <div>📚</div>
                                <p>لم تنشئ أي كورس بعد</p>
                                <button
                                    className={"InstructorDashboard-createBtn"}
                                    onClick={() => router.push("/instructor/courses/create")}
                                >إنشاء أول كورس</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Courses */}
                {activeTab === "courses" && (
                    <div className={"InstructorDashboard-coursesList"}>
                        {courses.map(c => {
                            const s = STATUS_LABELS[c.status] ?? STATUS_LABELS.draft;
                            return (
                                <div key={c.id} className={"InstructorDashboard-courseRow"}>
                                    {c.thumbnail && (
                                        <img src={c.thumbnail} alt={c.title} className={"InstructorDashboard-courseThumb"} />
                                    )}
                                    <div className={"InstructorDashboard-courseInfo"}>
                                        <div className={"InstructorDashboard-courseTitle"}>{c.title}</div>
                                        <div className={"InstructorDashboard-courseMeta"}>
                                            {c.enrollments?.[0]?.count ?? 0} طالب · ★ {c.rating} · {c.price} ج.م
                                        </div>
                                    </div>
                                    <span
                                        className={"InstructorDashboard-statusBadge"}
                                        style={{ color: s.color, background: s.bg }}
                                    >{s.label}</span>
                                    <button
                                        className={"InstructorDashboard-addLessonBtn"}
                                        onClick={() => {
                                            setSelectedCourse(c.id);
                                            setShowAddLesson(true);
                                        }}
                                    >+ إضافة درس</button>
                                </div>
                            );
                        })}
                        {courses.length === 0 && (
                            <div className={"InstructorDashboard-empty"}>
                                <div>📚</div>
                                <p>لم تنشئ أي كورس بعد</p>
                            </div>
                        )}
                    </div>

                )}
                <CouponsManager courses={courses} />
                {/* Tab: Earnings */}
                {activeTab === "earnings" && (
                    <div className={"InstructorDashboard-coursesList"}>
                        {transactions.length === 0 ? (
                            <div className={"InstructorDashboard-empty"}>
                                <div>💰</div>
                                <p>لا توجد معاملات بعد</p>
                            </div>
                        ) : (
                            transactions.map(t => (
                                <div key={t.id} className={"InstructorDashboard-txRow"}>
                                    <div className={"InstructorDashboard-txType"}>
                                        {t.type === "purchase" ? "💰 شراء" : "📤 سحب"}
                                    </div>
                                    <div
                                        className={"InstructorDashboard-txAmount"}
                                        style={{ color: t.amount > 0 ? "#10B981" : "#818CF8" }}
                                    >
                                        {t.amount > 0 ? "+" : ""}{t.amount} ج.م
                                    </div>
                                    <div className={"InstructorDashboard-txDate"}>
                                        {new Date(t.created_at).toLocaleDateString("ar-EG")}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* Add Lesson Modal */}
            {showAddLesson && selectedCourse && (
                <AddLessonModal
                    courseId={selectedCourse}
                    onClose={() => setShowAddLesson(false)}
                    onSuccess={() => router.refresh()}
                />
            )}
        </div>
    );
}