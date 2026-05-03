"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";


const STEPS = ["المعلومات الأساسية", "التسعير", "النشر"];
const CATEGORIES = ["برمجة", "تصميم", "ذكاء اصطناعي", "تسويق", "إدارة", "لغات"];

export default function CourseBuilderPage() {
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [error, setError] = useState("");
    const [videoType, setVideoType] = useState("url");

    const [form, setForm] = useState({
        title: "", description: "", category: "برمجة",
        level: "beginner", language: "ar",
        price: "", old_price: "",
        thumbnail: "", intro_video: "",
    });

    const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleUploadThumbnail = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const ext = file.name.split(".").pop();
            const fileName = `thumbnails/${Date.now()}.${ext}`;
            const { error } = await supabase.storage
                .from("eduplatform")
                .upload(fileName, file, { upsert: true });
            if (error) throw error;
            const { data } = supabase.storage.from("eduplatform").getPublicUrl(fileName);
            update("thumbnail", data.publicUrl);
        } catch (err) { setError(err.message); }
        finally { setUploading(false); }
    };

    const handleUploadVideo = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingVideo(true);
        try {
            const ext = file.name.split(".").pop();
            const fileName = `intro-videos/${Date.now()}.${ext}`;
            const { error } = await supabase.storage
                .from("eduplatform")
                .upload(fileName, file, { upsert: true });
            if (error) throw error;
            const { data } = supabase.storage.from("eduplatform").getPublicUrl(fileName);
            update("intro_video", data.publicUrl);
        } catch (err) { setError(err.message); }
        finally { setUploadingVideo(false); }
    };

    const handlePublish = async () => {
        if (!form.title.trim()) return setError("العنوان مطلوب");
        setLoading(true);
        setError("");
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // أضف الكورس
            const { data: course, error } = await supabase
                .from("courses")
                .insert({
                    title: form.title,
                    description: form.description,
                    category: form.category,
                    level: form.level,
                    language: form.language,
                    price: Number(form.price) || 0,
                    old_price: Number(form.old_price) || null,
                    thumbnail: form.thumbnail || null,
                    intro_video: form.intro_video || null,
                    instructor_id: user.id,
                    status: "review",
                })
                .select()
                .single();

            if (error) throw error;

            // جيب اسم المدرس
            const { data: instructorProfile } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", user.id)
                .single();

            // جيب الأدمن
            const { data: adminProfile } = await supabase
                .from("profiles")
                .select("id")
                .eq("role", "admin")
                .single();

            // ✅ إشعار للأدمن
            if (adminProfile?.id) {
                await supabase.from("notifications").insert({
                    user_id: adminProfile.id,
                    type: "new_course",
                    title: "📚 كورس جديد ينتظر مراجعتك",
                    body: `${instructorProfile?.name ?? "مدرس"} رفع كورس "${form.title}" للمراجعة`,
                    link: "/admin/dashboard",
                });
            }

            router.push("/instructor/dashboard");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className={"CourseBuilder-page"}>
            {/* Topbar */}
            <div className={"CourseBuilder-topbar"}>
                <button className={"CourseBuilder-backBtn"} onClick={() => router.push("/instructor/dashboard")}>
                    ← الداشبورد
                </button>
                <div className={"CourseBuilder-topbarTitle"}>إنشاء كورس جديد</div>
                <button className={"CourseBuilder-publishBtn"} onClick={handlePublish} disabled={loading}>
                    {loading ? "جاري الإرسال..." : "🚀 إرسال للمراجعة"}
                </button>
            </div>

            {/* Steps */}
            <div className={"CourseBuilder-stepsBar"}>
                {STEPS.map((s, i) => (
                    <div
                        key={s}
                        className={`${"CourseBuilder-step"} ${i === step ? "CourseBuilder-stepActive" : ""} ${i < step ? "CourseBuilder-stepDone" : ""}`}
                        onClick={() => setStep(i)}
                    >
                        <div className={"CourseBuilder-stepNum"}>{i < step ? "✓" : i + 1}</div>
                        <div className={"CourseBuilder-stepLabel"}>{s}</div>
                    </div>
                ))}
            </div>

            <div className={"CourseBuilder-content"}>
                <div className={"CourseBuilder-formCard"}>

                    {/* ── Step 0 ── */}
                    {step === 0 && (
                        <>
                            <h2 className={"CourseBuilder-sectionTitle"}>المعلومات الأساسية</h2>

                            <div className={"CourseBuilder-field"}>
                                <label>عنوان الكورس *</label>
                                <input className={"CourseBuilder-input"} placeholder="مثال: تطوير React من الصفر"
                                    value={form.title} onChange={e => update("title", e.target.value)} />
                            </div>

                            <div className={"CourseBuilder-field"}>
                                <label>وصف الكورس</label>
                                <textarea className={"CourseBuilder-textarea"} rows={4}
                                    placeholder="اشرح ما سيتعلمه الطالب..."
                                    value={form.description} onChange={e => update("description", e.target.value)} />
                            </div>

                            <div className={"CourseBuilder-grid2"}>
                                <div className={"CourseBuilder-field"}>
                                    <label>التخصص</label>
                                    <select className={"CourseBuilder-select"} value={form.category} onChange={e => update("category", e.target.value)}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className={"CourseBuilder-field"}>
                                    <label>المستوى</label>
                                    <select className={"CourseBuilder-select"} value={form.level} onChange={e => update("level", e.target.value)}>
                                        <option value="beginner">مبتدئ</option>
                                        <option value="intermediate">متوسط</option>
                                        <option value="advanced">متقدم</option>
                                    </select>
                                </div>
                            </div>

                            {/* Thumbnail */}
                            <div className={"CourseBuilder-field"}>
                                <label>صورة الكورس</label>
                                <div className={"CourseBuilder-uploadArea"}>
                                    {form.thumbnail ? (
                                        <div className={"CourseBuilder-uploadPreview"}>
                                            <img src={form.thumbnail} alt="thumbnail" />
                                            <button type="button" className={"CourseBuilder-removeBtn"}
                                                onClick={() => update("thumbnail", "")}>✕ إزالة</button>
                                        </div>
                                    ) : (
                                        <label className={"CourseBuilder-uploadLabel"}>
                                            <input type="file" accept="image/*"
                                                onChange={handleUploadThumbnail} style={{ display: "none" }} />
                                            <div className={"CourseBuilder-uploadIcon"}>🖼️</div>
                                            <div className={"CourseBuilder-uploadText"}>
                                                {uploading ? "⏳ جاري الرفع..." : "اضغط لرفع صورة الكورس"}
                                            </div>
                                            <div className={"CourseBuilder-uploadHint"}>PNG, JPG — بحد أقصى 5MB</div>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Intro Video */}
                            <div className={"CourseBuilder-field"}>
                                <label>فيديو تعريفي للكورس</label>
                                <div className={"CourseBuilder-videoTabs"}>
                                    <button type="button"
                                        className={`${"CourseBuilder-videoTab"} ${videoType === "url" ? "CourseBuilder-videoTabActive" : ""}`}
                                        onClick={() => setVideoType("url")}>🔗 رابط YouTube/Vimeo</button>
                                    <button type="button"
                                        className={`${"CourseBuilder-videoTab"} ${videoType === "upload" ? "CourseBuilder-videoTabActive" : ""}`}
                                        onClick={() => setVideoType("upload")}>📹 رفع فيديو</button>
                                </div>

                                {videoType === "url" ? (
                                    <input className={"CourseBuilder-input"}
                                        placeholder="https://youtube.com/watch?v=..."
                                        value={form.intro_video}
                                        onChange={e => update("intro_video", e.target.value)} />
                                ) : (
                                    <div className={"CourseBuilder-uploadArea"}>
                                        {form.intro_video ? (
                                            <div className={"CourseBuilder-videoReady"}>
                                                ✅ تم رفع الفيديو بنجاح
                                                <button type="button" className={"CourseBuilder-removeBtn"}
                                                    onClick={() => update("intro_video", "")}>✕ إزالة</button>
                                            </div>
                                        ) : (
                                            <label className={"CourseBuilder-uploadLabel"}>
                                                <input type="file" accept="video/*"
                                                    onChange={handleUploadVideo} style={{ display: "none" }} />
                                                <div className={"CourseBuilder-uploadIcon"}>📹</div>
                                                <div className={"CourseBuilder-uploadText"}>
                                                    {uploadingVideo ? "⏳ جاري الرفع..." : "اضغط لرفع الفيديو التعريفي"}
                                                </div>
                                                <div className={"CourseBuilder-uploadHint"}>MP4, MOV — بحد أقصى 500MB</div>
                                            </label>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ── Step 1 ── */}
                    {step === 1 && (
                        <>
                            <h2 className={"CourseBuilder-sectionTitle"}>التسعير</h2>
                            <div className={"CourseBuilder-grid2"}>
                                <div className={"CourseBuilder-field"}>
                                    <label>السعر (ج.م) *</label>
                                    <input className={"CourseBuilder-input"} type="number" placeholder="499"
                                        value={form.price} onChange={e => update("price", e.target.value)} />
                                </div>
                                <div className={"CourseBuilder-field"}>
                                    <label>السعر الأصلي (قبل الخصم)</label>
                                    <input className={"CourseBuilder-input"} type="number" placeholder="999"
                                        value={form.old_price} onChange={e => update("old_price", e.target.value)} />
                                </div>
                            </div>
                            {form.price && form.old_price && (
                                <div className={"CourseBuilder-discountInfo"}>
                                    خصم {Math.round((1 - form.price / form.old_price) * 100)}% 🎉
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Step 2 ── */}
                    {step === 2 && (
                        <>
                            <h2 className={"CourseBuilder-sectionTitle"}>مراجعة ونشر</h2>
                            <div className={"CourseBuilder-reviewGrid"}>
                                {[
                                    ["العنوان", form.title || "—"],
                                    ["التخصص", form.category],
                                    ["المستوى", form.level],
                                    ["السعر", form.price ? `${form.price} ج.م` : "مجاني"],
                                ].map(([k, v]) => (
                                    <div key={k} className={"CourseBuilder-reviewRow"}>
                                        <span className={"CourseBuilder-reviewKey"}>{k}</span>
                                        <span className={"CourseBuilder-reviewVal"}>{v}</span>
                                    </div>
                                ))}
                            </div>
                            {form.thumbnail && (
                                <img src={form.thumbnail} alt="preview" className={"CourseBuilder-reviewThumb"} />
                            )}
                            {form.intro_video && (
                                <div className={"CourseBuilder-videoReady"} style={{ marginBottom: 16 }}>
                                    ✅ فيديو تعريفي جاهز
                                </div>
                            )}
                            <div className={"CourseBuilder-publishNote"}>
                                ✅ سيتم مراجعة الكورس خلال 24-48 ساعة
                            </div>
                        </>
                    )}

                    {error && <div className={"CourseBuilder-error"}>{error}</div>}

                    <div className={"CourseBuilder-navBtns"}>
                        {step > 0 && (
                            <button className={"CourseBuilder-prevBtn"} onClick={() => setStep(s => s - 1)}>
                                ← السابق
                            </button>
                        )}
                        {step < STEPS.length - 1 ? (
                            <button className={"CourseBuilder-nextBtn"} onClick={() => setStep(s => s + 1)}>
                                التالي ←
                            </button>
                        ) : (
                            <button className={"CourseBuilder-nextBtn"} onClick={handlePublish} disabled={loading}>
                                {loading ? "جاري الإرسال..." : "🚀 إرسال للمراجعة"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}