"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import LandingEditor from "./LandingEditor";


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
  profile, users, courses, transactions, totalRevenue, siteSettings
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
    <div className={"AdminDashboard-page"}>
      {/* Sidebar */}
      <div className={"AdminDashboard-sidebar"}>
        <div className={"AdminDashboard-logo"} onClick={() => router.push("/")}>
          <div className={"AdminDashboard-logoIconAdmin"}>🛡</div>
          <div>
            <div className={"AdminDashboard-logoName"}>EduPlatform</div>
            <div className={"AdminDashboard-adminLabel"}>Admin Panel</div>
          </div>
        </div>

        <nav className={"AdminDashboard-nav"}>
          {[
            { id:"overview",  icon:"⊞",  label:"الداشبورد"         },
            { id:"users",     icon:"👥",  label:"المستخدمون"        },
            { id:"courses",   icon:"📚",  label:"الكورسات"          },
            { id:"finance",   icon:"💰",  label:"المالية"           },
            { id:"landing",   icon:"🖊",  label:"الصفحة الرئيسية"  },
          ].map(item => (
            <div
              key={item.id}
              className={`${"AdminDashboard-navItem"} ${activeTab === item.id ? "AdminDashboard-navActive" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
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
            { icon:"👥", label:"إجمالي المستخدمين",  val:users.length,          color:"#818CF8" },
            { icon:"💰", label:"إجمالي الإيرادات",   val:`${totalRevenue} ج.م`, color:"#10B981" },
            { icon:"📚", label:"الكورسات المنشورة",   val:courses.filter(c=>c.status==="live").length, color:"#FBBF24" },
            { icon:"⏳", label:"تنتظر المراجعة",      val:pendingCourses.length, color:"#EC4899" },
          ].map(k => (
            <div key={k.label} className={"AdminDashboard-kpiCard"}>
              <div className={"AdminDashboard-kpiIcon"}>{k.icon}</div>
              <div className={"AdminDashboard-kpiVal"} style={{ color:k.color }}>{k.val}</div>
              <div className={"AdminDashboard-kpiLbl"}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={"AdminDashboard-tabs"}>
          {[
            { id:"overview", label:"نظرة عامة"        },
            { id:"users",    label:"المستخدمون"       },
            { id:"courses",  label:"الكورسات"         },
            { id:"finance",  label:"المالية"          },
            { id:"landing",  label:"🖊 الصفحة الرئيسية" },
          ].map(t => (
            <button
              key={t.id}
              className={`${"AdminDashboard-tab"} ${activeTab === t.id ? "AdminDashboard-tabActive" : ""}`}
              onClick={() => setActiveTab(t.id)}
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
                <div className={"AdminDashboard-statNum"} style={{ color:"#818CF8" }}>{totalStudents}</div>
                <div className={"AdminDashboard-statLbl"}>طالب</div>
              </div>
              <div className={"AdminDashboard-statBox"}>
                <div className={"AdminDashboard-statNum"} style={{ color:"#10B981" }}>{totalInstructors}</div>
                <div className={"AdminDashboard-statLbl"}>مدرس</div>
              </div>
              <div className={"AdminDashboard-statBox"}>
                <div className={"AdminDashboard-statNum"} style={{ color:"#FBBF24" }}>{courses.filter(c=>c.status==="live").length}</div>
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
                        <span className={"AdminDashboard-pill"} style={{ color:rs.color, background:rs.bg }}>
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
                      <td style={{ color:"#fff", fontWeight:700 }}>{c.title}</td>
                      <td className={"AdminDashboard-muted"}>{c.profiles?.name}</td>
                      <td style={{ color:"#10B981", fontWeight:700 }}>{c.price} ج.م</td>
                      <td>
                        <span className={"AdminDashboard-pill"} style={{ color:ss.color, background:ss.bg }}>
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
                    <td style={{ color:"#fff" }}>
                      {t.type === "purchase" ? "💰 شراء" : "📤 سحب"}
                    </td>
                    <td style={{ color: t.amount > 0 ? "#10B981":"#818CF8", fontWeight:700 }}>
                      {t.amount > 0 ? "+" : ""}{t.amount} ج.م
                    </td>
                    <td className={"AdminDashboard-muted"}>
                      {new Date(t.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td>
                      <span className={"AdminDashboard-pill"} style={{ color:"#10B981", background:"rgba(16,185,129,.12)" }}>
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

        {/* Landing Page Editor */}
        {activeTab === "landing" && (
          <LandingEditor siteSettings={siteSettings} />
        )}
      </main>
    </div>
  );
}