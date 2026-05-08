"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import LandingEditor from "./LandingEditor";
import NotificationsTab from "@/components/common/NotificationsTab";


const ROLE_STYLE = {
  student: { label: "طالب", color: "#818CF8", bg: "rgba(99,102,241,.12)" },
  instructor: { label: "مدرس", color: "#10B981", bg: "rgba(16,185,129,.12)" },
  admin: { label: "أدمن", color: "#EF4444", bg: "rgba(239,68,68,.12)" },
};

const STATUS_STYLE = {
  live: { label: "منشور", color: "#10B981", bg: "rgba(16,185,129,.12)" },
  draft: { label: "مسودة", color: "rgba(255,255,255,.5)", bg: "rgba(255,255,255,.07)" },
  review: { label: "قيد المراجعة", color: "#FBBF24", bg: "rgba(245,158,11,.12)" },
};

export default function AdminDashboardClient({
  profile, users, courses: initialCourses, transactions, totalRevenue, siteSettings, platformReviews: initialPlatformReviews
}) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [userId, setUserId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [courses, setCourses] = useState(initialCourses);
  const [platformReviews, setPlatformReviews] = useState(initialPlatformReviews || []);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const pendingReviews = platformReviews.filter(r => r.status === "pending");

  // ✅ دالة تجيب الكورسات من Supabase
  const fetchCourses = async () => {
    const { data } = await supabase
      .from("courses")
      .select("*, profiles(name), instructor_id")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setCourses(data);
  };

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
      const { error: uploadErr } = await supabase.storage.from("eduplatform").upload(path, file, { upsert: true });
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

  const approveCourse = async (courseId) => {
    try {
      const res = await fetch("/api/approve-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // ✅ حدّث الكورسات فوراً
      await fetchCourses();

    } catch (err) {
      alert("حصل خطأ: " + err.message);
    }
  };

  const updateReviewStatus = async (reviewId, newStatus) => {
    try {
      const res = await fetch("/api/admin/review-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Update local state immediately
      setPlatformReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert("حصل خطأ: " + err.message);
    }
  };

  const totalStudents = users.filter(u => u.role === "student").length;
  const totalInstructors = users.filter(u => u.role === "instructor").length;
  const pendingCourses = courses.filter(c => c.status === "review"); // ✅ من الـ state
  return (
    <div className={"AdminDashboard-page"}>
      {/* Sidebar */}
      <div className={"AdminDashboard-sidebar"}>
        <div className={"AdminDashboard-logo"} onClick={() => router.push("/")} style={{ marginBottom: "8px" }}>
          <div className={"AdminDashboard-logoIconAdmin"}>🛡</div>
          <div>
            <div className={"AdminDashboard-logoName"}>EduPlatform</div>
            <div className={"AdminDashboard-adminLabel"}>Admin Panel</div>
          </div>
        </div>

        {/* Admin Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", marginBottom: "8px" }}>
          <label
            htmlFor="avatarUploadAdmin"
            title={uploadingAvatar ? "جاري الرفع..." : "تغيير الصورة"}
            style={{ position: "relative", cursor: "pointer", display: "inline-block", borderRadius: "50%", flexShrink: 0 }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile?.name} style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "2px solid #EF4444", display: "block" }} />
            ) : (
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(239,68,68,.2)", border: "2px solid #EF4444", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px", color: "#EF4444" }}>
                {(profile?.name ?? "").split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase() || "أ"}
              </div>
            )}
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .2s", fontSize: "14px" }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >{uploadingAvatar ? "⏳" : "📷"}</div>
            <input id="avatarUploadAdmin" type="file" accept="image/*" hidden disabled={uploadingAvatar} onChange={handleAvatarUpload} />
          </label>
          <div>
            <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "13px" }}>{profile?.name}</div>
            <div style={{ color: "#EF4444", fontSize: "11px", fontWeight: 600 }}>🛡 Super Admin</div>
          </div>
        </div>

        <nav className={"AdminDashboard-nav"}>
          {[
            { id: "overview", icon: "⊞", label: "الداشبورد" },
            { id: "users", icon: "👥", label: "المستخدمون" },
            { id: "courses", icon: "📚", label: "الكورسات" },
            { id: "finance", icon: "💰", label: "المالية" },
            { id: "landing", icon: "🔊", label: "الصفحة الرئيسية", badge: pendingReviews.length },
            { id: "notifications", icon: "🔔", label: "الإشعارات", badge: unreadCount },
          ].map(item => (
            <div
              key={item.id}
              className={`${"AdminDashboard-navItem"} ${activeTab === item.id ? "AdminDashboard-navActive" : ""}`}
              onClick={() => { setActiveTab(item.id); if (item.id === "notifications") setUnreadCount(0); }}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.badge > 0 && (
                <span className={"AdminDashboard-navBadge"}>{item.badge > 9 ? "9+" : item.badge}</span>
              )}
            </div>
          ))}
        </nav>

        <div className={"AdminDashboard-sidebarFooter"}>
          <button className={"AdminDashboard-logoutBtn"} onClick={handleLogout}>
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Main */}
      <main className={"AdminDashboard-main"}>
        <div className={"AdminDashboard-topbar"}>
          <div>
            <h1 className={"AdminDashboard-pageTitle"}>لوحة تحكم الأدمن 🛡️</h1>
            <p className={"AdminDashboard-pageSub"}>نظرة شاملة على المنصة</p>
          </div>
          <span className={"AdminDashboard-adminBadge"}>🛡 Super Admin</span>
        </div>

        {/* KPIs */}
        <div className={"AdminDashboard-kpiGrid"}>
          {[
            { icon: "👥", label: "إجمالي المستخدمين", val: users.length, color: "#818CF8" },
            { icon: "💰", label: "إجمالي الإيرادات", val: `${totalRevenue} ج.م`, color: "#10B981" },
            { icon: "📚", label: "الكورسات المنشورة", val: courses.filter(c => c.status === "live").length, color: "#FBBF24" },
            { icon: "⏳", label: "تنتظر المراجعة", val: pendingCourses.length, color: "#EC4899" },
          ].map(k => (
            <div key={k.label} className={"AdminDashboard-kpiCard"}>
              <div className={"AdminDashboard-kpiIcon"}>{k.icon}</div>
              <div className={"AdminDashboard-kpiVal"} style={{ color: k.color }}>{k.val}</div>
              <div className={"AdminDashboard-kpiLbl"}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={"AdminDashboard-tabs"}>
          {[
            { id: "overview", label: "نظرة عامة" },
            { id: "users", label: "المستخدمون" },
            { id: "courses", label: "الكورسات" },
            { id: "finance", label: "المالية" },
            { id: "landing", label: `🔊 الصفحة الرئيسية${pendingReviews.length > 0 ? ` (${pendingReviews.length})` : ""}` },
            { id: "notifications", label: `🔔 الإشعارات${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
          ].map(t => (
            <button
              key={t.id}
              className={`${"AdminDashboard-tab"} ${activeTab === t.id ? "AdminDashboard-tabActive" : ""}`}
              onClick={() => { setActiveTab(t.id); if (t.id === "notifications") setUnreadCount(0); }}
            >{t.label}</button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div>
            {pendingCourses.length > 0 && (
              <div className={"AdminDashboard-section"}>
                <div className={"AdminDashboard-sectionTitle"}>
                  📋 كورسات تنتظر الموافقة
                  <span className={"AdminDashboard-badge"}>{pendingCourses.length}</span>
                </div>
                {pendingCourses.map(c => (
                  <div key={c.id} className={"AdminDashboard-row"}>
                    <img src={c.thumbnail} alt={c.title} className={"AdminDashboard-thumb"} />
                    <div className={"AdminDashboard-rowInfo"}>
                      <div className={"AdminDashboard-rowTitle"}>{c.title}</div>
                      <div className={"AdminDashboard-rowMeta"}>{c.profiles?.name}</div>
                    </div>
                    <button
                      className={"AdminDashboard-approveBtn"}
                      onClick={() => approveCourse(c.id)}
                    >✓ موافقة</button>
                  </div>
                ))}
              </div>
            )}

            <div className={"AdminDashboard-statsRow"}>
              <div className={"AdminDashboard-statBox"}>
                <div className={"AdminDashboard-statNum"} style={{ color: "#818CF8" }}>{totalStudents}</div>
                <div className={"AdminDashboard-statLbl"}>طالب</div>
              </div>
              <div className={"AdminDashboard-statBox"}>
                <div className={"AdminDashboard-statNum"} style={{ color: "#10B981" }}>{totalInstructors}</div>
                <div className={"AdminDashboard-statLbl"}>مدرس</div>
              </div>
              <div className={"AdminDashboard-statBox"}>
                <div className={"AdminDashboard-statNum"} style={{ color: "#FBBF24" }}>{courses.filter(c => c.status === "live").length}</div>
                <div className={"AdminDashboard-statLbl"}>كورس منشور</div>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <div className={"AdminDashboard-tableWrap"}>
            <table className={"AdminDashboard-table"}>
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>الدور</th>
                  <th>تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const rs = ROLE_STYLE[u.role] ?? ROLE_STYLE.student;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className={"AdminDashboard-userCell"}>
                          <div className={"AdminDashboard-userAvatar"}>{u.name?.[0] ?? "U"}</div>
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={"AdminDashboard-pill"} style={{ color: rs.color, background: rs.bg }}>
                          {rs.label}
                        </span>
                      </td>
                      <td className={"AdminDashboard-muted"}>
                        {new Date(u.created_at).toLocaleDateString("ar-EG")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Courses */}
        {activeTab === "courses" && (
          <div className={"AdminDashboard-tableWrap"}>
            <table className={"AdminDashboard-table"}>
              <thead>
                <tr>
                  <th>الكورس</th>
                  <th>المدرس</th>
                  <th>السعر</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => {
                  const ss = STATUS_STYLE[c.status] ?? STATUS_STYLE.draft;
                  return (
                    <tr key={c.id}>
                      <td style={{ color: "#fff", fontWeight: 700 }}>{c.title}</td>
                      <td className={"AdminDashboard-muted"}>{c.profiles?.name}</td>
                      <td style={{ color: "#10B981", fontWeight: 700 }}>{c.price} ج.م</td>
                      <td>
                        <span className={"AdminDashboard-pill"} style={{ color: ss.color, background: ss.bg }}>
                          {ss.label}
                        </span>
                      </td>
                      <td>
                        {c.status === "review" && (
                          <button
                            className={"AdminDashboard-approveBtn"}
                            onClick={() => approveCourse(c.id)}
                          >✓ موافقة</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Finance */}
        {activeTab === "finance" && (
          <div className={"AdminDashboard-tableWrap"}>
            <table className={"AdminDashboard-table"}>
              <thead>
                <tr>
                  <th>النوع</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td style={{ color: "#fff" }}>
                      {t.type === "purchase" ? "💰 شراء" : "📤 سحب"}
                    </td>
                    <td style={{ color: t.amount > 0 ? "#10B981" : "#818CF8", fontWeight: 700 }}>
                      {t.amount > 0 ? "+" : ""}{t.amount} ج.م
                    </td>
                    <td className={"AdminDashboard-muted"}>
                      {new Date(t.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td>
                      <span className={"AdminDashboard-pill"} style={{ color: "#10B981", background: "rgba(16,185,129,.12)" }}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,.3)" }}>
                      لا توجد معاملات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Landing Page Editor */}
        {activeTab === "landing" && (
          <LandingEditor 
            siteSettings={siteSettings} 
            platformReviews={platformReviews}
            onUpdateReviewStatus={updateReviewStatus}
          />
        )}

        {/* Notifications */}
        {activeTab === "notifications" && userId && (
          <NotificationsTab
            userId={userId}
            userRole="admin"
            prefix="AdminDashboard"
          />
        )}
      </main>
    </div>
  );
}