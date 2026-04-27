"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";


export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleSubmit = async () => {
        setError("");
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: form.email,
                password: form.password,
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
        <div className={"auth-page"}>
            {/* Left — Form */}
            <div className={"auth-formSide"}>

                <div className={"auth-card"}>
                    <h2 className={"auth-title"}>أهلاً بعودتك 👋</h2>
                    <p className={"auth-subtitle"}>سجّل دخولك وتابع رحلتك التعليمية</p>

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
                        {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                    </button>

                    <div style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "rgba(255,255,255,.45)" }}>
                        مش عندك حساب؟{" "}
                        <Link href="/register" style={{ color: "#818CF8", fontWeight: 700, textDecoration: "none" }}>
                            إنشاء حساب جديد
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right — Visual */}
            <div className={"auth-visualSide"}>
                <div className={"auth-visualContent"}>
                    <div className={"auth-bigIcon"}>🎓</div>
                    <h2 className={"auth-visualTitle"}>منصة التعلم العربية الأولى</h2>
                    <p className={"auth-visualText"}>تعلّم من أفضل الخبراء واحصل على شهادات معتمدة</p>
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