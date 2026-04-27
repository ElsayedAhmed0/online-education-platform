"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";


const ROLES = [
  { id: "student", label: "طالب", icon: "🎓", desc: "أريد التعلم واكتساب مهارات جديدة" },
  { id: "instructor", label: "مدرس", icon: "👨‍🏫", desc: "أريد تدريس ومشاركة خبرتي مع الآخرين" },
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) return setError("الاسم مطلوب");
    if (!form.email.includes("@")) return setError("بريد إلكتروني غير صحيح");
    if (form.password.length < 6) return setError("كلمة المرور 6 أحرف على الأقل");

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name, role } },
      });
      if (error) throw error;

      // حدّث الـ role في الـ profile
      if (data.user) {
        await supabase
          .from("profiles")
          .update({ role, name: form.name })
          .eq("id", data.user.id);
      }

      // وجّه حسب الـ role
      if (role === "instructor") {
        router.push("/instructor/dashboard");
      } else {
        router.push("/dashboard");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={"auth-page"}>
      {/* Left — Form */}
      <div className={"auth-formSide"}>
        <div className={"auth-card"}>
          <h2 className={"auth-title"}>إنشاء حساب جديد 🎓</h2>
          <p className={"auth-subtitle"}>ابدأ رحلتك مع EduPlatform</p>

          {/* Role selector */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {ROLES.map(r => (
              <div
                key={r.id}
                onClick={() => setRole(r.id)}
                style={{
                  flex: 1, padding: "14px 12px",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${role === r.id ? "var(--primary)" : "var(--border-strong)"}`,
                  background: role === r.id ? "rgba(99,102,241,.1)" : "transparent",
                  cursor: "pointer", textAlign: "center",
                  transition: "all .2s",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {r.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Fields */}
          <div className={"auth-field"}>
            <label>الاسم الكامل</label>
            <input
              className={"auth-input"}
              placeholder="اكتب اسمك..."
              value={form.name}
              onChange={e => update("name", e.target.value)}
            />
          </div>

          <div className={"auth-field"}>
            <label>البريد الإلكتروني</label>
            <input
              className={"auth-input"}
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={e => update("email", e.target.value)}
            />
          </div>

          <div className={"auth-field"}>
            <label>كلمة المرور</label>
            <input
              className={"auth-input"}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => update("password", e.target.value)}
            />
          </div>

          {error && <div className={"auth-error"}>{error}</div>}

          <button
            className={"auth-submitBtn"}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "جاري إنشاء الحساب..." : `إنشاء حساب ${role === "instructor" ? "مدرس" : "طالب"}`}
          </button>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "rgba(255,255,255,.45)" }}>
            عندك حساب؟{" "}
            <Link href="/login" style={{ color: "#818CF8", fontWeight: 700, textDecoration: "none" }}>
              سجّل دخولك
            </Link>
          </div>
        </div>
      </div>

      {/* Right — Visual */}
      <div className={"auth-visualSide"}>
        <div className={"auth-visualContent"}>
          <div className={"auth-bigIcon"}>{role === "instructor" ? "👨‍🏫" : "🎓"}</div>
          <h2 className={"auth-visualTitle"}>
            {role === "instructor" ? "شارك خبرتك مع العالم" : "انضم لأكبر مجتمع تعليمي عربي"}
          </h2>
          <p className={"auth-visualText"}>
            {role === "instructor"
              ? "أنشئ كورساتك واكسب دخلاً إضافياً من مشاركة معرفتك"
              : "تعلّم من أفضل الخبراء واحصل على شهادات معتمدة"}
          </p>
          <div className={"auth-stats"}>
            <div className={"auth-stat"}>
              <strong>52,840+</strong>
              <span>طالب</span>
            </div>
            <div className={"auth-stat"}>
              <strong>1,542</strong>
              <span>كورس</span>
            </div>
            <div className={"auth-stat"}>
              <strong>4.9 ★</strong>
              <span>تقييم</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}