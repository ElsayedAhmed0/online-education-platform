"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../login/auth.module.scss";

export default function RegisterPage() {
    const router = useRouter();
    const supabase = createClient();

    const [form, setForm] = useState({ name: "", email: "", password: "" });
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
            const { error } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: { data: { name: form.name } },
            });
            if (error) throw error;
            router.push("/dashboard");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            {/* Left — Form */}
            <div className={styles.formSide}>


                <div className={styles.card}>
                    <h2 className={styles.title}>إنشاء حساب جديد 🎓</h2>
                    <p className={styles.subtitle}>ابدأ رحلتك التعليمية مع أفضل الكورسات</p>

                    <div className={styles.field}>
                        <label>الاسم الكامل</label>
                        <input
                            className={styles.input}
                            placeholder="اكتب اسمك..."
                            value={form.name}
                            onChange={e => update("name", e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>البريد الإلكتروني</label>
                        <input
                            className={styles.input}
                            type="email"
                            placeholder="example@email.com"
                            value={form.email}
                            onChange={e => update("email", e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>كلمة المرور</label>
                        <input
                            className={styles.input}
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => update("password", e.target.value)}
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
                    </button>

                    <div style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "rgba(255,255,255,.45)" }}>
                        عندك حساب؟{" "}
                        <Link href="/login" style={{ color: "#818CF8", fontWeight: 700, textDecoration: "none" }}>
                            سجّل دخولك
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right — Visual */}
            <div className={styles.visualSide}>
                <div className={styles.visualContent}>
                    <div className={styles.bigIcon}>🚀</div>
                    <h2 className={styles.visualTitle}>انضم لأكبر مجتمع تعليمي عربي</h2>
                    <p className={styles.visualText}>تعلّم من أفضل الخبراء واحصل على شهادات معتمدة تفتح لك أبواب الفرص</p>
                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <strong>52,840+</strong>
                            <span>طالب</span>
                        </div>
                        <div className={styles.stat}>
                            <strong>1,542</strong>
                            <span>كورس</span>
                        </div>
                        <div className={styles.stat}>
                            <strong>4.9 ★</strong>
                            <span>تقييم</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}