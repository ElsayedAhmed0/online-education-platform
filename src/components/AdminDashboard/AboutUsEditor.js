"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

const DEFAULT_ABOUT = {
    hero_title: "عن منصة إيدو بلاتفورم",
    hero_subtitle: "بوابتك نحو التميز والاحتراف في العالم الرقمي",
    description: "نحن في إيدو بلاتفورم نؤمن بأن التعليم هو المفتاح الوحيد لتطوير المجتمعات. انطلقت منصتنا لتوفير تجربة تعليمية فريدة تجمع بين المحتوى الأكاديمي الرصين والمهارات العملية التي يتطلبها سوق العمل.",
    mission: "تمكين الشباب العربي من اكتساب المهارات التقنية والمهنية اللازمة للمنافسة عالمياً من خلال محتوى تعليمي عالي الجودة وبأسعار في المتناول.",
    vision: "أن نصبح المنصة الأولى والرائدة في التعليم الرقمي في الوطن العربي، والمصدر الموثوق لكل باحث عن التميز المهني.",
    features: [
        { icon: "🎓", title: "محتوى احترافي", description: "كورسات مصممة من قبل خبراء في مجالاتهم" },
        { icon: "🛡️", title: "شهادات معتمدة", description: "احصل على شهادة إتمام عند نهاية كل كورس" },
        { icon: "💬", title: "دعم مستمر", description: "تواصل مباشر مع المدرسين لحل استفساراتك" },
    ]
};

function Field({ label, children }) {
    return (
        <div className="LandingEditor-field">
            <label className="LandingEditor-label">{label}</label>
            {children}
        </div>
    );
}

export default function AboutUsEditor({ siteSettings }) {
    const supabase = createClient();
    const getVal = (id, def) => siteSettings?.find(s => s.id === id)?.value ?? def;

    const [about, setAbout] = useState(getVal("about_us", DEFAULT_ABOUT));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    const updateAbout = (key, val) => setAbout(prev => ({ ...prev, [key]: val }));

    const updateFeature = (idx, key, val) => {
        const next = about.features.map((f, i) => i === idx ? { ...f, [key]: val } : f);
        updateAbout("features", next);
    };

    const addFeature = () => 
        updateAbout("features", [...(about.features || []), { icon: "✨", title: "", description: "" }]);

    const removeFeature = (idx) => 
        updateAbout("features", about.features.filter((_, i) => i !== idx));

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSaved(false);

        try {
            const { error: err } = await supabase
                .from("site_settings")
                .upsert({ id: "about_us", value: about }, { onConflict: "id" });

            if (err) throw err;
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            setError(e.message || "حدث خطأ أثناء الحفظ");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="LandingEditor-root">
            <div className="LandingEditor-topbar">
                <div>
                    <h2 className="LandingEditor-pageTitle">🖊 تحرير صفحة "من نحن"</h2>
                    <p className="LandingEditor-pageSub">تعديل محتوى الصفحة التعريفية للمنصة</p>
                </div>
                <div className="LandingEditor-saveArea">
                    {error && <span className="LandingEditor-error">⚠ {error}</span>}
                    {saved && <span className="LandingEditor-successMsg">✓ تم الحفظ!</span>}
                    <button 
                        className={`LandingEditor-saveBtn ${saving ? "LandingEditor-savingBtn" : ""}`}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "⏳ جاري الحفظ..." : "💾 حفظ التغييرات"}
                    </button>
                </div>
            </div>

            <div className="LandingEditor-accordion">
                <div className="LandingEditor-section">
                    <div className="LandingEditor-sectionHeader" style={{ cursor: "default" }}>
                        <span className="LandingEditor-sectionIcon">📌</span>
                        <span className="LandingEditor-sectionTitle">المعلومات الأساسية</span>
                    </div>
                    <div className="LandingEditor-body">
                        <div className="LandingEditor-grid2">
                            <Field label="عنوان الصفحة الرئيسي">
                                <input 
                                    className="LandingEditor-input"
                                    value={about.hero_title}
                                    onChange={e => updateAbout("hero_title", e.target.value)}
                                />
                            </Field>
                            <Field label="العنوان الفرعي">
                                <input 
                                    className="LandingEditor-input"
                                    value={about.hero_subtitle}
                                    onChange={e => updateAbout("hero_subtitle", e.target.value)}
                                />
                            </Field>
                        </div>
                        <Field label="وصف المنصة / من نحن">
                            <textarea 
                                className="LandingEditor-textarea"
                                rows={4}
                                value={about.description}
                                onChange={e => updateAbout("description", e.target.value)}
                            />
                        </Field>
                        <div className="LandingEditor-grid2">
                            <Field label="رسالتنا (Mission)">
                                <textarea 
                                    className="LandingEditor-textarea"
                                    rows={3}
                                    value={about.mission}
                                    onChange={e => updateAbout("mission", e.target.value)}
                                />
                            </Field>
                            <Field label="رؤيتنا (Vision)">
                                <textarea 
                                    className="LandingEditor-textarea"
                                    rows={3}
                                    value={about.vision}
                                    onChange={e => updateAbout("vision", e.target.value)}
                                />
                            </Field>
                        </div>
                    </div>
                </div>

                <div className="LandingEditor-section" style={{ marginTop: "20px" }}>
                    <div className="LandingEditor-sectionHeader" style={{ cursor: "default" }}>
                        <span className="LandingEditor-sectionIcon">💎</span>
                        <span className="LandingEditor-sectionTitle">مميزات المنصة</span>
                        <button className="LandingEditor-addBtn" style={{ marginRight: "auto" }} onClick={addFeature}>+ إضافة</button>
                    </div>
                    <div className="LandingEditor-body">
                        {about.features.map((f, idx) => (
                            <div key={idx} className="LandingEditor-statRow" style={{ display: "flex", gap: "10px", marginBottom: "15px", alignItems: "flex-start", background: "rgba(255,255,255,0.02)", padding: "15px", borderRadius: "8px" }}>
                                <div style={{ flex: "0 0 60px" }}>
                                    <Field label="أيقونة">
                                        <input className="LandingEditor-input" style={{ textAlign: "center" }} value={f.icon} onChange={e => updateFeature(idx, "icon", e.target.value)} />
                                    </Field>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Field label="العنوان">
                                        <input className="LandingEditor-input" value={f.title} onChange={e => updateFeature(idx, "title", e.target.value)} />
                                    </Field>
                                </div>
                                <div style={{ flex: 2 }}>
                                    <Field label="الوصف">
                                        <input className="LandingEditor-input" value={f.description} onChange={e => updateFeature(idx, "description", e.target.value)} />
                                    </Field>
                                </div>
                                <button className="LandingEditor-removeBtn" style={{ marginTop: "30px" }} onClick={() => removeFeature(idx)}>✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
