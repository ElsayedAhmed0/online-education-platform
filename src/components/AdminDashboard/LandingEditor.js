"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

/* ── Default values (fallback لو مفيش بيانات في Supabase) ── */
const DEFAULT_HERO = {
    title: "تعلّم واحترف في",
    highlight: "أي مجال تحب",
    subtitle: "منصة تعليمية عربية متكاملة — كورسات احترافية بشهادات معتمدة",
    cta_primary: "ابدأ الآن مجاناً",
    cta_secondary: "شاهد كيف تعمل",
    welcome_video_url: "",
    stats: [
        { value: "+10,000", label: "طالب نشط" },
        { value: "+500", label: "كورس متاح" },
        { value: "4.9★", label: "تقييم المنصة" },
    ],
};

const DEFAULT_CTA = {
    title: "ابدأ رحلتك التعليمية اليوم",
    subtitle: "انضم لآلاف الطلاب وابدأ رحلتك نحو الاحتراف",
    cta_primary: "سجل الآن مجاناً",
    cta_secondary: "تصفح الكورسات",
    features: ["بدون رسوم اشتراك", "كورسات محدّثة باستمرار", "شهادات معتمدة"],
};

/* ── Sub-components ── */

function SectionHeader({ icon, title, isOpen, onToggle }) {
    return (
        <button className="LandingEditor-sectionHeader" onClick={onToggle} type="button">
            <span className="LandingEditor-sectionIcon">{icon}</span>
            <span className="LandingEditor-sectionTitle">{title}</span>
            <span className="LandingEditor-sectionChevron">{isOpen ? "▲" : "▼"}</span>
        </button>
    );
}

function Field({ label, children }) {
    return (
        <div className="LandingEditor-field">
            <label className="LandingEditor-label">{label}</label>
            {children}
        </div>
    );
}

/* ── Hero Section ── */
function HeroEditor({ hero, onChange, supabase }) {
    const [uploadingVideo, setUploadingVideo] = useState(false);

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingVideo(true);
        try {
            const path = `welcome-video/${Date.now()}_${file.name}`;
            const { error } = await supabase.storage.from("eduplatform").upload(path, file, { upsert: true });
            if (error) throw error;
            
            const { data } = supabase.storage.from("eduplatform").getPublicUrl(path);
            onChange({ ...hero, welcome_video_url: data.publicUrl });
        } catch (err) {
            alert("خطأ في رفع الفيديو: " + err.message);
        } finally {
            setUploadingVideo(false);
            e.target.value = ""; // reset input
        }
    };

    const updateStat = (idx, key, val) => {
        const next = hero.stats.map((s, i) => i === idx ? { ...s, [key]: val } : s);
        onChange({ ...hero, stats: next });
    };

    const addStat = () =>
        onChange({ ...hero, stats: [...(hero.stats ?? []), { value: "", label: "" }] });

    const removeStat = (idx) =>
        onChange({ ...hero, stats: hero.stats.filter((_, i) => i !== idx) });

    return (
        <div className="LandingEditor-body">
            <div className="LandingEditor-grid2">
                <Field label="العنوان الرئيسي">
                    <input
                        className="LandingEditor-input"
                        value={hero.title ?? ""}
                        onChange={e => onChange({ ...hero, title: e.target.value })}
                        placeholder="تعلّم واحترف في"
                    />
                </Field>
                <Field label="الكلمة المميّزة (ملوّنة)">
                    <input
                        className="LandingEditor-input"
                        value={hero.highlight ?? ""}
                        onChange={e => onChange({ ...hero, highlight: e.target.value })}
                        placeholder="أي مجال تحب"
                    />
                </Field>
            </div>

            <Field label="الوصف / Subtitle">
                <textarea
                    className="LandingEditor-textarea"
                    rows={3}
                    value={hero.subtitle ?? ""}
                    onChange={e => onChange({ ...hero, subtitle: e.target.value })}
                    placeholder="منصة تعليمية عربية متكاملة..."
                />
            </Field>

            <div className="LandingEditor-grid2">
                <Field label="نص الزر الأساسي">
                    <input
                        className="LandingEditor-input"
                        value={hero.cta_primary ?? ""}
                        onChange={e => onChange({ ...hero, cta_primary: e.target.value })}
                        placeholder="ابدأ الآن مجاناً"
                    />
                </Field>
                <Field label="نص الزر الثانوي">
                    <input
                        className="LandingEditor-input"
                        value={hero.cta_secondary ?? ""}
                        onChange={e => onChange({ ...hero, cta_secondary: e.target.value })}
                        placeholder="تصفح الكورسات"
                    />
                </Field>
            </div>

            <Field label="الفيديو الترحيبي (رابط يوتيوب أو رفع من الجهاز)">
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                        className="LandingEditor-input"
                        value={hero.welcome_video_url ?? ""}
                        onChange={e => onChange({ ...hero, welcome_video_url: e.target.value })}
                        placeholder="رابط يوتيوب أو مسار الملف المرفوع..."
                        style={{ flex: 1 }}
                    />
                    <label 
                        className="LandingEditor-uploadBtn" 
                        style={{ 
                            cursor: uploadingVideo ? "not-allowed" : "pointer", 
                            padding: "10px 16px", 
                            background: "var(--color-1)", 
                            borderRadius: "var(--radius-sm)", 
                            color: "var(--text-primary)", 
                            fontWeight: "bold", 
                            whiteSpace: "nowrap",
                            opacity: uploadingVideo ? 0.6 : 1
                        }}
                    >
                        {uploadingVideo ? "⏳ جاري الرفع..." : "📁 رفع فيديو"}
                        <input 
                            type="file" 
                            accept="video/*" 
                            hidden 
                            disabled={uploadingVideo} 
                            onChange={handleVideoUpload} 
                        />
                    </label>
                </div>
            </Field>

            {/* Stats */}
            <div className="LandingEditor-statsHeader">
                <span className="LandingEditor-label">الإحصائيات (Stats)</span>
                <button className="LandingEditor-addBtn" onClick={addStat} type="button">
                    + إضافة إحصائية
                </button>
            </div>

            <div className="LandingEditor-statsList">
                {(hero.stats ?? []).map((stat, idx) => (
                    <div key={idx} className="LandingEditor-statRow">
                        <input
                            className="LandingEditor-input LandingEditor-statVal"
                            value={stat.value}
                            onChange={e => updateStat(idx, "value", e.target.value)}
                            placeholder="مثال: +10,000"
                        />
                        <input
                            className="LandingEditor-input LandingEditor-statLbl"
                            value={stat.label}
                            onChange={e => updateStat(idx, "label", e.target.value)}
                            placeholder="مثال: طالب نشط"
                        />
                        <button
                            className="LandingEditor-removeBtn"
                            onClick={() => removeStat(idx)}
                            type="button"
                            title="حذف"
                        >✕</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Reviews Manager Section ── */
function ReviewsManager({ platformReviews, onUpdateReviewStatus }) {
    const STATUS_LABELS = {
        approved: { label: "ظاهر", color: "#10B981", bg: "rgba(16,185,129,.12)" },
        pending:  { label: "بانتظار", color: "#FBBF24", bg: "rgba(251,191,36,.12)" },
        rejected: { label: "مخفي", color: "#EF4444", bg: "rgba(239,68,68,.12)" },
    };

    return (
        <div className="LandingEditor-body">
            {platformReviews.length === 0 && (
                <p style={{ color: "rgba(255,255,255,.4)", textAlign: "center", padding: "40px" }}>
                    لا توجد تقييمات حتى الآن
                </p>
            )}
            {platformReviews.map(r => {
                const s = STATUS_LABELS[r.status] ?? STATUS_LABELS.pending;
                return (
                    <div key={r.id} style={{
                        display: "flex", gap: "16px", alignItems: "flex-start",
                        background: "rgba(255,255,255,0.03)", borderRadius: "12px",
                        padding: "16px", border: "1px solid rgba(255,255,255,0.06)",
                        marginBottom: "12px",
                    }}>
                        {/* Avatar */}
                        <div style={{
                            width: "42px", height: "42px", borderRadius: "50%",
                            background: "var(--primary)", display: "flex", alignItems: "center",
                            justifyContent: "center", fontWeight: "bold", flexShrink: 0,
                        }}>
                            {r.profiles?.name?.[0] ?? "م"}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                                <strong style={{ color: "var(--text-primary)" }}>{r.profiles?.name}</strong>
                                <span style={{ color: "#FBBF24", fontSize: "13px" }}>{"\u2605".repeat(r.rating)}</span>
                                <span style={{
                                    background: s.bg, color: s.color,
                                    borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: 700,
                                }}>{s.label}</span>
                                <span style={{ color: "rgba(255,255,255,.35)", fontSize: "12px", marginRight: "auto" }}>
                                    {new Date(r.created_at).toLocaleDateString("ar-EG")}
                                </span>
                            </div>
                            <p style={{ color: "rgba(255,255,255,.7)", margin: 0, lineHeight: "1.6", fontSize: "14px" }}>
                                {r.comment}
                            </p>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                            {r.status !== "approved" && (
                                <button
                                    onClick={() => onUpdateReviewStatus(r.id, "approved")}
                                    style={{
                                        background: "rgba(16,185,129,.15)", color: "#10B981",
                                        border: "1px solid rgba(16,185,129,.3)", borderRadius: "6px",
                                        padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontWeight: 700,
                                    }}
                                >✓ إظهار</button>
                            )}
                            {r.status !== "rejected" && (
                                <button
                                    onClick={() => onUpdateReviewStatus(r.id, "rejected")}
                                    style={{
                                        background: "rgba(239,68,68,.15)", color: "#EF4444",
                                        border: "1px solid rgba(239,68,68,.3)", borderRadius: "6px",
                                        padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontWeight: 700,
                                    }}
                                >✕ إخفاء</button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ── CTA Section ── */
function CtaEditor({ cta, onChange }) {
    const updateFeature = (idx, val) => {
        const next = (cta.features ?? []).map((f, i) => i === idx ? val : f);
        onChange({ ...cta, features: next });
    };

    const addFeature = () =>
        onChange({ ...cta, features: [...(cta.features ?? []), ""] });

    const removeFeature = (idx) =>
        onChange({ ...cta, features: (cta.features ?? []).filter((_, i) => i !== idx) });

    return (
        <div className="LandingEditor-body">
            <div className="LandingEditor-grid2">
                <Field label="عنوان CTA">
                    <input
                        className="LandingEditor-input"
                        value={cta.title ?? ""}
                        onChange={e => onChange({ ...cta, title: e.target.value })}
                        placeholder="ابدأ رحلتك التعليمية اليوم"
                    />
                </Field>
                <Field label="وصف CTA">
                    <input
                        className="LandingEditor-input"
                        value={cta.subtitle ?? ""}
                        onChange={e => onChange({ ...cta, subtitle: e.target.value })}
                        placeholder="انضم لآلاف الطلاب..."
                    />
                </Field>
            </div>

            <div className="LandingEditor-grid2">
                <Field label="نص الزر الأساسي">
                    <input
                        className="LandingEditor-input"
                        value={cta.cta_primary ?? ""}
                        onChange={e => onChange({ ...cta, cta_primary: e.target.value })}
                        placeholder="سجل الآن مجاناً"
                    />
                </Field>
                <Field label="نص الزر الثانوي">
                    <input
                        className="LandingEditor-input"
                        value={cta.cta_secondary ?? ""}
                        onChange={e => onChange({ ...cta, cta_secondary: e.target.value })}
                        placeholder="تصفح الكورسات"
                    />
                </Field>
            </div>

            {/* Features */}
            <div className="LandingEditor-statsHeader">
                <span className="LandingEditor-label">المميزات (Features)</span>
                <button className="LandingEditor-addBtn" onClick={addFeature} type="button">
                    + إضافة ميزة
                </button>
            </div>

            <div className="LandingEditor-statsList">
                {(cta.features ?? []).map((f, idx) => (
                    <div key={idx} className="LandingEditor-statRow">
                        <input
                            className="LandingEditor-input"
                            value={f}
                            onChange={e => updateFeature(idx, e.target.value)}
                            placeholder="مثال: بدون رسوم اشتراك"
                            style={{ flex: 1 }}
                        />
                        <button
                            className="LandingEditor-removeBtn"
                            onClick={() => removeFeature(idx)}
                            type="button"
                            title="حذف"
                        >✕</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ══ Main LandingEditor ══ */
export default function LandingEditor({ siteSettings, platformReviews = [], onUpdateReviewStatus }) {
    const getVal = (id, def) =>
        siteSettings?.find(s => s.id === id)?.value ?? def;

    const [hero, setHero] = useState(getVal("hero", DEFAULT_HERO));
    const [cta, setCta]   = useState(getVal("cta", DEFAULT_CTA));

    const [openSection, setOpenSection] = useState("hero");
    const [saving, setSaving]           = useState(false);
    const [saved, setSaved]             = useState(false);
    const [error, setError]             = useState(null);

    const supabase = createClient();

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSaved(false);

        try {
            const rows = [
                { id: "hero", value: hero },
                { id: "cta",  value: cta },
            ];

            const { error: err } = await supabase
                .from("site_settings")
                .upsert(rows, { onConflict: "id" });

            if (err) throw err;

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            setError(e.message ?? "حدث خطأ أثناء الحفظ");
        } finally {
            setSaving(false);
        }
    };

    const pendingCount = platformReviews.filter(r => r.status === "pending").length;

    const sections = [
        {
            id: "hero",
            icon: "🚀",
            title: "Hero Section — العنوان والإحصائيات",
            content: <HeroEditor hero={hero} onChange={setHero} supabase={supabase} />,
        },
        {
            id: "reviews",
            icon: "💬",
            title: `آراء الطلاب — مساهمات التقييم${pendingCount > 0 ? ` (• ${pendingCount} بانتظار)` : ""}`,
            content: <ReviewsManager platformReviews={platformReviews} onUpdateReviewStatus={onUpdateReviewStatus} />,
        },
        {
            id: "cta",
            icon: "🎯",
            title: "CTA Section — الدعوة للتسجيل",
            content: <CtaEditor cta={cta} onChange={setCta} />,
        },
    ];

    return (
        <div className="LandingEditor-root">
            <div className="LandingEditor-topbar">
                <div>
                    <h2 className="LandingEditor-pageTitle">🖊 تحرير محتوى الصفحة الرئيسية</h2>
                    <p className="LandingEditor-pageSub">
                        أي تغيير تحفظه هيظهر فوراً للزوار في الصفحة الرئيسية
                    </p>
                </div>

                <div className="LandingEditor-saveArea">
                    {error && <span className="LandingEditor-error">⚠ {error}</span>}
                    {saved && <span className="LandingEditor-successMsg">✓ تم الحفظ بنجاح!</span>}
                    <button
                        className={`LandingEditor-saveBtn${saving ? " LandingEditor-savingBtn" : ""}`}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "⏳ جاري الحفظ..." : "💾 حفظ التغييرات"}
                    </button>
                </div>
            </div>

            {/* Live Preview hint */}
            <div className="LandingEditor-previewHint">
                <span>👁</span>
                <span>
                    لمعاينة التغييرات انتقل للـ{" "}
                    <a href="/" target="_blank" rel="noreferrer" className="LandingEditor-previewLink">
                        الصفحة الرئيسية ↗
                    </a>
                    {" "}بعد الحفظ
                </span>
            </div>

            {/* Accordion Sections */}
            <div className="LandingEditor-accordion">
                {sections.map(sec => (
                    <div key={sec.id} className="LandingEditor-section">
                        <SectionHeader
                            icon={sec.icon}
                            title={sec.title}
                            isOpen={openSection === sec.id}
                            onToggle={() => setOpenSection(openSection === sec.id ? null : sec.id)}
                        />
                        {openSection === sec.id && sec.content}
                    </div>
                ))}
            </div>
        </div>
    );
}
