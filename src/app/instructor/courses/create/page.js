"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./CourseBuilder.module.scss";

const STEPS = ["المعلومات الأساسية", "التسعير", "النشر"];
const CATEGORIES = ["برمجة", "تصميم", "ذكاء اصطناعي", "تسويق", "إدارة", "لغات"];

export default function CourseBuilderPage() {
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        title: "", description: "", category: "برمجة",
        level: "beginner", language: "ar",
        price: "", old_price: "", thumbnail: "",
    });

    const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handlePublish = async () => {
        if (!form.title.trim()) return setError("العنوان مطلوب");
        setLoading(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase.from("courses").insert({
                title: form.title,
                description: form.description,
                category: form.category,
                level: form.level,
                language: form.language,
                price: Number(form.price) || 0,
                old_price: Number(form.old_price) || null,
                thumbnail: form.thumbnail || null,
                instructor_id: user.id,
                status: "review",
            });

            if (error) throw error;
            router.push("/instructor/dashboard");

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            {/* Topbar */}
            <div className={styles.topbar}>
                <button className={styles.backBtn} onClick={() => router.push("/instructor/dashboard")}>
                    ← الداشبورد
                </button>
                <div className={styles.topbarTitle}>إنشاء كورس جديد</div>
                <button
                    className={styles.publishBtn}
                    onClick={handlePublish}
                    disabled={loading}
                >
                    {loading ? "جاري الإرسال..." : "🚀 إرسال للمراجعة"}
                </button>
            </div>

            {/* Steps */}
            <div className={styles.stepsBar}>
                {STEPS.map((s, i) => (
                    <div
                        key={s}
                        className={`${styles.step} ${i === step ? styles.stepActive : ""} ${i < step ? styles.stepDone : ""}`}
                        onClick={() => setStep(i)}
                    >
                        <div className={styles.stepNum}>{i < step ? "✓" : i + 1}</div>
                        <div className={styles.stepLabel}>{s}</div>
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className={styles.content}>
                <div className={styles.formCard}>

                    {/* Step 0: Basic info */}
                    {step === 0 && (
                        <>
                            <h2 className={styles.sectionTitle}>المعلومات الأساسية</h2>

                            <div className={styles.field}>
                                <label>عنوان الكورس *</label>
                                <input
                                    className={styles.input}
                                    placeholder="مثال: تطوير React من الصفر"
                                    value={form.title}
                                    onChange={e => update("title", e.target.value)}
                                />
                            </div>

                            <div className={styles.field}>
                                <label>وصف الكورس</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="اشرح ما سيتعلمه الطالب..."
                                    value={form.description}
                                    onChange={e => update("description", e.target.value)}
                                    rows={4}
                                />
                            </div>

                            <div className={styles.grid2}>
                                <div className={styles.field}>
                                    <label>التخصص</label>
                                    <select className={styles.select} value={form.category} onChange={e => update("category", e.target.value)}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label>المستوى</label>
                                    <select className={styles.select} value={form.level} onChange={e => update("level", e.target.value)}>
                                        <option value="beginner">مبتدئ</option>
                                        <option value="intermediate">متوسط</option>
                                        <option value="advanced">متقدم</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label>رابط صورة الكورس</label>
                                <input
                                    className={styles.input}
                                    placeholder="https://..."
                                    value={form.thumbnail}
                                    onChange={e => update("thumbnail", e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* Step 1: Pricing */}
                    {step === 1 && (
                        <>
                            <h2 className={styles.sectionTitle}>التسعير</h2>
                            <div className={styles.grid2}>
                                <div className={styles.field}>
                                    <label>السعر (ج.م) *</label>
                                    <input
                                        className={styles.input}
                                        type="number"
                                        placeholder="499"
                                        value={form.price}
                                        onChange={e => update("price", e.target.value)}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>السعر الأصلي (قبل الخصم)</label>
                                    <input
                                        className={styles.input}
                                        type="number"
                                        placeholder="999"
                                        value={form.old_price}
                                        onChange={e => update("old_price", e.target.value)}
                                    />
                                </div>
                            </div>
                            {form.price && form.old_price && (
                                <div className={styles.discountInfo}>
                                    خصم {Math.round((1 - form.price / form.old_price) * 100)}% 🎉
                                </div>
                            )}
                        </>
                    )}

                    {/* Step 2: Review */}
                    {step === 2 && (
                        <>
                            <h2 className={styles.sectionTitle}>مراجعة ونشر</h2>
                            <div className={styles.reviewGrid}>
                                {[
                                    ["العنوان", form.title || "—"],
                                    ["التخصص", form.category],
                                    ["المستوى", form.level],
                                    ["السعر", form.price ? `${form.price} ج.م` : "مجاني"],
                                ].map(([k, v]) => (
                                    <div key={k} className={styles.reviewRow}>
                                        <span className={styles.reviewKey}>{k}</span>
                                        <span className={styles.reviewVal}>{v}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.publishNote}>
                                ✅ سيتم مراجعة الكورس خلال 24-48 ساعة
                            </div>
                        </>
                    )}

                    {error && <div className={styles.error}>{error}</div>}

                    {/* Navigation */}
                    <div className={styles.navBtns}>
                        {step > 0 && (
                            <button className={styles.prevBtn} onClick={() => setStep(s => s - 1)}>
                                ← السابق
                            </button>
                        )}
                        {step < STEPS.length - 1 ? (
                            <button className={styles.nextBtn} onClick={() => setStep(s => s + 1)}>
                                التالي ←
                            </button>
                        ) : (
                            <button
                                className={styles.nextBtn}
                                onClick={handlePublish}
                                disabled={loading}
                            >
                                {loading ? "جاري الإرسال..." : "🚀 إرسال للمراجعة"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}