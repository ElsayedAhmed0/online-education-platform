"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import AddLessonModal from "./AddLessonModal";
import CouponsManager from "./CouponsManager";
import NotificationsTab from "@/components/common/NotificationsTab";

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
    const [userId, setUserId] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [students, setStudents] = useState([]);
    const [studentsLoaded, setStudentsLoaded] = useState(false);
    const [selectedCourseStudents, setSelectedCourseStudents] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            setUserId(user.id);
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

    const fetchStudents = async (courseId) => {
        setSelectedCourseStudents(courseId);
        const { data } = await supabase
            .from("enrollments")
            .select("*, profiles(id, name)")
            .eq("course_id", courseId)
            .eq("status", "active");
        setStudents(data ?? []);
        setStudentsLoaded(true);
    };

    const removeStudent = async (studentId, courseId) => {
        // شيل الـ confirm مؤقتاً
        // const confirmed = window.confirm("هتلغي اشتراك الطالب ده؟");
        // if (!confirmed) return;

        console.log("=== بدأ الإلغاء ===");
        console.log("studentId:", studentId);
        console.log("courseId:", courseId);

        try {
            const res = await fetch("/api/instructor/remove-student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, courseId }),
            });

            console.log("HTTP Status:", res.status);
            const data = await res.json();
            console.log("Response:", data);

            if (!res.ok) {
                alert("❌ خطأ: " + data.error);
                return;
            }

            alert("✅ تم الإلغاء");
            await fetchStudents(courseId);

        } catch (err) {
            console.log("❌ Fetch error:", err.message);
            alert("❌ مشكلة: " + err.message);
        }
    };

    const handleDeleteCourse = async (courseId, courseTitle) => {
        if (!window.confirm(`هل أنت متأكد من حذف كورس "${courseTitle}"؟\nسيتم حذف جميع الدروس والبيانات المرتبطة به نهائياً!`)) {
            return;
        }

        try {
            const res = await fetch("/api/instructor/delete-course", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert("❌ خطأ: " + (data.error || "فشل حذف الكورس"));
                return;
            }

            alert("✅ تم حذف الكورس بنجاح");
            router.refresh(); // لإعادة تحميل البيانات من السيرفر

        } catch (err) {
            alert("❌ حدث خطأ: " + err.message);
        }
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
                    <label
                        htmlFor="avatarUpload"
                        title={uploadingAvatar ? "جاري الرفع..." : "تغيير الصورة"}
                        style={{
                            position: "relative", cursor: "pointer", display: "inline-block",
                            borderRadius: "50%", flexShrink: 0,
                        }}
                    >
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={profile?.name}
                                style={{
                                    width: "48px", height: "48px", borderRadius: "50%",
                                    objectFit: "cover", border: "2px solid var(--primary)",
                                    display: "block",
                                }}
                            />
                        ) : (
                            <div className={"InstructorDashboard-profileAvatar"}>
                                {(profile?.name ?? "").split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase() || "م"}
                            </div>
                        )}
                        {/* Camera overlay */}
                        <div style={{
                            position: "absolute", inset: 0, borderRadius: "50%",
                            background: "rgba(0,0,0,0.45)", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            opacity: 0, transition: "opacity .2s",
                            fontSize: "18px",
                        }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0}
                        >
                            {uploadingAvatar ? "⏳" : "📷"}
                        </div>
                        <input
                            id="avatarUpload"
                            type="file"
                            accept="image/*"
                            hidden
                            disabled={uploadingAvatar}
                            onChange={handleAvatarUpload}
                        />
                    </label>
                    <div>
                        <div className={"InstructorDashboard-profileName"}>{profile?.name}</div>
                        <div className={"InstructorDashboard-profileRole"}>مدرس</div>
                    </div>
                </div>

                <nav className={"InstructorDashboard-nav"}>
                    {[
                        { id: "overview", label: "الداشبورد", icon: "⊞" },
                        { id: "courses", label: "كورساتي", icon: "📚" },
                        { id: "students", label: "طلابي", icon: "👥" },
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
                        className={`${"InstructorDashboard-navItem"} ${activeTab === "notifications" ? "InstructorDashboard-navActive" : ""}`}
                        onClick={() => { setActiveTab("notifications"); setUnreadCount(0); }}
                    >
                        <span>🔔</span> الإشعارات
                        {unreadCount > 0 && (
                            <span className={"InstructorDashboard-navBadge"}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                        )}
                    </div>
                    <div
                        className={"InstructorDashboard-navItem"}
                        onClick={() => router.push("/instructor/courses/create")}
                    >
                        <span>➕</span> إنشاء كورس
                    </div>
                </nav>

                <div className={"InstructorDashboard-sidebarFooter"}>
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
                        { id: "students", label: "👥 طلابي" },
                        { id: "earnings", label: "الأرباح" },
                        { id: "notifications", label: `🔔 الإشعارات${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
                    ].map(t => (
                        <button
                            key={t.id}
                            className={`${"InstructorDashboard-tab"} ${activeTab === t.id ? "InstructorDashboard-tabActive" : ""}`}
                            onClick={() => { setActiveTab(t.id); if (t.id === "notifications") setUnreadCount(0); }}
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
                                        onClick={() => router.push(`/instructor/courses/${c.id}/manage`)}
                                    >+ إضافة درس</button>
                                    <button
                                        className={"InstructorDashboard-deleteCourseBtn"}
                                        style={{
                                            background: "rgba(239,68,68,0.1)",
                                            color: "#EF4444",
                                            border: "1px solid rgba(239,68,68,0.2)",
                                            borderRadius: "8px",
                                            padding: "8px 16px",
                                            cursor: "pointer",
                                            fontWeight: 700,
                                            fontSize: "13px",
                                            marginRight: "8px"
                                        }}
                                        onClick={() => handleDeleteCourse(c.id, c.title)}
                                    >🗑️ مسح</button>
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

                {/* Tab: Students */}
                {activeTab === "students" && (
                    <div className={"InstructorDashboard-coursesList"}>
                        <div style={{ marginBottom: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {courses.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => fetchStudents(c.id)}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: "8px",
                                        border: "1px solid",
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        fontSize: "13px",
                                        background: selectedCourseStudents === c.id ? "rgba(129,140,248,0.2)" : "rgba(255,255,255,0.05)",
                                        color: selectedCourseStudents === c.id ? "#818CF8" : "rgba(255,255,255,0.6)",
                                        borderColor: selectedCourseStudents === c.id ? "#818CF8" : "rgba(255,255,255,0.1)",
                                    }}
                                >
                                    {c.title}
                                </button>
                            ))}
                        </div>

                        {studentsLoaded && (
                            students.length === 0 ? (
                                <div className={"InstructorDashboard-empty"}>
                                    <div>👥</div>
                                    <p>لا يوجد طلاب في هذا الكورس</p>
                                </div>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                            <th style={{ padding: "12px", textAlign: "right", color: "rgba(255,255,255,0.5)" }}>الطالب</th>
                                            <th style={{ padding: "12px", textAlign: "right", color: "rgba(255,255,255,0.5)" }}>التقدم</th>
                                            <th style={{ padding: "12px", textAlign: "right", color: "rgba(255,255,255,0.5)" }}>إجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(s => {
                                            console.log("student record:", s);
                                            return (
                                                <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                                    <td style={{ padding: "12px", color: "#fff", fontWeight: 700 }}>
                                                        {s.profiles?.name ?? "طالب"}
                                                    </td>
                                                    <td style={{ padding: "12px", color: "#10B981" }}>
                                                        {s.progress ?? 0}%
                                                    </td>
                                                    <td style={{ padding: "12px" }}>
                                                        <button
                                                            onClick={() => {
                                                                console.log("=== ضغط الزرار ===");
                                                                console.log("s.user_id:", s.user_id);
                                                                console.log("selectedCourseStudents:", selectedCourseStudents);
                                                                removeStudent(s.user_id, selectedCourseStudents);
                                                            }}
                                                            style={{
                                                                background: "rgba(239,68,68,0.15)",
                                                                color: "#EF4444",
                                                                border: "1px solid rgba(239,68,68,0.3)",
                                                                borderRadius: "6px",
                                                                padding: "4px 12px",
                                                                cursor: "pointer",
                                                                fontSize: "13px",
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            🗑️ إلغاء الاشتراك
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )
                        )}
                    </div>
                )}

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

                {/* Tab: Notifications */}
                {activeTab === "notifications" && userId && (
                    <NotificationsTab
                        userId={userId}
                        userRole="instructor"
                        prefix="InstructorDashboard"
                    />
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