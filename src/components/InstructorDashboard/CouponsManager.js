"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export default function CouponsManager({ courses }) {
    const supabase = createClient();

    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        code: "",
        discount: 10,
        course_id: courses[0]?.id ?? "",
        max_uses: "",
        expires_at: "",
    });

    const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    // جيب الكوبونات
    const fetchCoupons = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data } = await supabase
            .from("coupons")
            .select("*, courses(title)")
            .eq("instructor_id", user.id)
            .order("created_at", { ascending: false });
        setCoupons(data ?? []);
        setLoading(false);
    };

    useEffect(() => { fetchCoupons(); }, []);

    const handleSave = async () => {
        if (!form.code.trim()) return setError("كود الخصم مطلوب");
        if (!form.course_id) return setError("اختر الكورس");
        if (form.discount < 1 || form.discount > 100) return setError("الخصم بين 1 و 100");

        setSaving(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase.from("coupons").insert({
                code: form.code.toUpperCase(),
                discount: Number(form.discount),
                course_id: form.course_id,
                instructor_id: user.id,
                max_uses: form.max_uses ? Number(form.max_uses) : null,
                expires_at: form.expires_at || null,
            });

            if (error) throw error;

            setShowForm(false);
            setForm({ code: "", discount: 10, course_id: courses[0]?.id ?? "", max_uses: "", expires_at: "" });
            fetchCoupons();

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        await supabase.from("coupons").delete().eq("id", id);
        fetchCoupons();
    };

    const generateCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        update("code", code);
    };

    return (
        <div className="wrap">
            {/* Header */}
            <div className="head">
                <div className="headTitle">🎟️ كوبونات الخصم</div>
                <button className="addBtn" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "✕ إلغاء" : "+ كوبون جديد"}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="form">
                    <div className="grid2">
                        <div className="field">
                            <label>كود الخصم *</label>
                            <div className="codeRow">
                                <input
                                    className="input"
                                    placeholder="مثال: SAVE20"
                                    value={form.code}
                                    onChange={e => update("code", e.target.value.toUpperCase())}
                                    style={{ flex: 1, letterSpacing: 2 }}
                                />
                                <button className="generateBtn" onClick={generateCode}>
                                    🎲 عشوائي
                                </button>
                            </div>
                        </div>
                        <div className="field">
                            <label>نسبة الخصم % *</label>
                            <input
                                className="input"
                                type="number"
                                min={1} max={100}
                                value={form.discount}
                                onChange={e => update("discount", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="field">
                        <label>الكورس *</label>
                        <select
                            className="select"
                            value={form.course_id}
                            onChange={e => update("course_id", e.target.value)}
                        >
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid2">
                        <div className="field">
                            <label>الحد الأقصى للاستخدام</label>
                            <input
                                className="input"
                                type="number"
                                placeholder="اتركه فاضي = غير محدود"
                                value={form.max_uses}
                                onChange={e => update("max_uses", e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label>تاريخ الانتهاء</label>
                            <input
                                className="input"
                                type="date"
                                value={form.expires_at}
                                onChange={e => update("expires_at", e.target.value)}
                            />
                        </div>
                    </div>

                    {error && <div className="error">{error}</div>}

                    <button
                        className="saveBtn"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "جاري الحفظ..." : "💾 حفظ الكوبون"}
                    </button>
                </div>
            )}

            {/* Coupons list */}
            {loading ? (
                <div className="empty">جاري التحميل...</div>
            ) : coupons.length === 0 ? (
                <div className="empty">
                    <div>🎟️</div>
                    <p>لا توجد كوبونات بعد — أنشئ أول كوبون!</p>
                </div>
            ) : (
                <div className="list">
                    {coupons.map(c => (
                        <div key={c.id} className="couponRow">
                            <div className="couponCode">{c.code}</div>
                            <div className="couponDiscount">خصم {c.discount}%</div>
                            <div className="couponCourse">{c.courses?.title}</div>
                            <div className="couponMeta">
                                {c.used_count ?? 0} استخدام
                                {c.max_uses ? ` / ${c.max_uses}` : " / غير محدود"}
                            </div>
                            {c.expires_at && (
                                <div className="couponExpiry">
                                    ينتهي: {new Date(c.expires_at).toLocaleDateString("ar-EG")}
                                </div>
                            )}
                            <button
                                className="deleteBtn"
                                onClick={() => handleDelete(c.id)}
                            >🗑</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}