"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./AdminDashboard.module.scss";

const ROLE_STYLE = {
  student:    { label:"طالب",  color:"#818CF8", bg:"rgba(99,102,241,.12)"  },
  instructor: { label:"مدرس",  color:"#10B981", bg:"rgba(16,185,129,.12)"  },
  admin:      { label:"أدمن",  color:"#EF4444", bg:"rgba(239,68,68,.12)"   },
};

const STATUS_STYLE = {
  live:   { label:"منشور",         color:"#10B981", bg:"rgba(16,185,129,.12)" },
  draft:  { label:"مسودة",         color:"rgba(255,255,255,.5)", bg:"rgba(255,255,255,.07)" },
  review: { label:"قيد المراجعة",  color:"#FBBF24", bg:"rgba(245,158,11,.12)" },
};

export default function AdminDashboardClient({
  profile, users, courses, transactions, totalRevenue
}) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("overview");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const approveCourse = async (courseId) => {
    await supabase.from("courses").update({ status: "live" }).eq("id", courseId);
    router.refresh();
  };

  const totalStudents    = users.filter(u => u.role === "student").length;
  const totalInstructors = users.filter(u => u.role === "instructor").length;
  const pendingCourses   = courses.filter(c => c.status === "review");

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.logo} onClick={() => router.push("/")}>
          <div className={styles.logoIconAdmin}>🛡</div>
          <div>
            <div className={styles.logoName}>EduPlatform</div>
            <div className={styles.adminLabel}>Admin Panel</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {[
            { id:"overview",  icon:"⊞", label:"الداشبورد"   },
            { id:"users",     icon:"👥", label:"المستخدمون"  },
            { id:"courses",   icon:"📚", label:"الكورسات"    },
            { id:"finance",   icon:"💰", label:"المالية"     },
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
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>لوحة تحكم الأدمن 🛡️</h1>
            <p className={styles.pageSub}>نظرة شاملة على المنصة</p>
          </div>
          <span className={styles.adminBadge}>🛡 Super Admin</span>
        </div>

        {/* KPIs */}
        <div className={styles.kpiGrid}>
          {[
            { icon:"👥", label:"إجمالي المستخدمين",  val:users.length,          color:"#818CF8" },
            { icon:"💰", label:"إجمالي الإيرادات",   val:`${totalRevenue} ج.م`, color:"#10B981" },
            { icon:"📚", label:"الكورسات المنشورة",   val:courses.filter(c=>c.status==="live").length, color:"#FBBF24" },
            { icon:"⏳", label:"تنتظر المراجعة",      val:pendingCourses.length, color:"#EC4899" },
          ].map(k => (
            <div key={k.label} className={styles.kpiCard}>
              <div className={styles.kpiIcon}>{k.icon}</div>
              <div className={styles.kpiVal} style={{ color:k.color }}>{k.val}</div>
              <div className={styles.kpiLbl}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {[
            { id:"overview", label:"نظرة عامة"  },
            { id:"users",    label:"المستخدمون" },
            { id:"courses",  label:"الكورسات"   },
            { id:"finance",  label:"المالية"    },
          ].map(t => (
            <button
              key={t.id}
              className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(t.id)}
            >{t.label}</button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div>
            {pendingCourses.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  📋 كورسات تنتظر الموافقة
                  <span className={styles.badge}>{pendingCourses.length}</span>
                </div>
                {pendingCourses.map(c => (
                  <div key={c.id} className={styles.row}>
                    <img src={c.thumbnail} alt={c.title} className={styles.thumb} />
                    <div className={styles.rowInfo}>
                      <div className={styles.rowTitle}>{c.title}</div>
                      <div className={styles.rowMeta}>{c.profiles?.name}</div>
                    </div>
                    <button
                      className={styles.approveBtn}
                      onClick={() => approveCourse(c.id)}
                    >✓ موافقة</button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <div className={styles.statNum} style={{ color:"#818CF8" }}>{totalStudents}</div>
                <div className={styles.statLbl}>طالب</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNum} style={{ color:"#10B981" }}>{totalInstructors}</div>
                <div className={styles.statLbl}>مدرس</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNum} style={{ color:"#FBBF24" }}>{courses.filter(c=>c.status==="live").length}</div>
                <div className={styles.statLbl}>كورس منشور</div>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
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
                        <div className={styles.userCell}>
                          <div className={styles.userAvatar}>{u.name?.[0] ?? "U"}</div>
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.pill} style={{ color:rs.color, background:rs.bg }}>
                          {rs.label}
                        </span>
                      </td>
                      <td className={styles.muted}>
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
          <div className={styles.tableWrap}>
            <table className={styles.table}>
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
                      <td style={{ color:"#fff", fontWeight:700 }}>{c.title}</td>
                      <td className={styles.muted}>{c.profiles?.name}</td>
                      <td style={{ color:"#10B981", fontWeight:700 }}>{c.price} ج.م</td>
                      <td>
                        <span className={styles.pill} style={{ color:ss.color, background:ss.bg }}>
                          {ss.label}
                        </span>
                      </td>
                      <td>
                        {c.status === "review" && (
                          <button
                            className={styles.approveBtn}
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
          <div className={styles.tableWrap}>
            <table className={styles.table}>
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
                    <td style={{ color:"#fff" }}>
                      {t.type === "purchase" ? "💰 شراء" : "📤 سحب"}
                    </td>
                    <td style={{ color: t.amount > 0 ? "#10B981":"#818CF8", fontWeight:700 }}>
                      {t.amount > 0 ? "+" : ""}{t.amount} ج.م
                    </td>
                    <td className={styles.muted}>
                      {new Date(t.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td>
                      <span className={styles.pill} style={{ color:"#10B981", background:"rgba(16,185,129,.12)" }}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign:"center", padding:"40px", color:"rgba(255,255,255,.3)" }}>
                      لا توجد معاملات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}