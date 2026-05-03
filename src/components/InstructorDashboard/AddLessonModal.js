"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";


export default function AddLessonModal({ courseId, onClose, onSuccess }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        sectionTitle: "",
        lessonTitle: "",
        duration: "",
        type: "video",
        videoUrl: "",
        isPreview: false,
    });

    const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleUploadVideo = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const ext = file.name.split(".").pop();
            const fileName = `videos/${courseId}/${Date.now()}.${ext}`;

            const { error } = await supabase.storage
                .from("eduplatform")
                .upload(fileName, file, { upsert: true });

            if (error) throw error;

            const { data } = supabase.storage
                .from("eduplatform")
                .getPublicUrl(fileName);

            update("videoUrl", data.publicUrl);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!form.sectionTitle.trim()) return setError("اسم القسم مطلوب");
        if (!form.lessonTitle.trim()) return setError("اسم الدرس مطلوب");

        setLoading(true);
        setError("");

        try {
            // جيب أو اعمل section
            let sectionId;
            const { data: existingSection } = await supabase
                .from("sections")
                .select("id")
                .eq("course_id", courseId)
                .eq("title", form.sectionTitle)
                .single();

            if (existingSection) {
                sectionId = existingSection.id;
            } else {
                const { data: newSection, error: secError } = await supabase
                    .from("sections")
                    .insert({ course_id: courseId, title: form.sectionTitle, order_index: 0 })
                    .select()
                    .single();
                if (secError) throw secError;
                sectionId = newSection.id;
            }

            // أضف الدرس
            const { error: lessonError } = await supabase
                .from("lessons")
                .insert({
                    section_id: sectionId,
                    course_id: courseId,
                    title: form.lessonTitle,
                    type: form.type,
                    video_url: form.videoUrl || null,
                    duration: form.duration || null,
                    is_preview: form.isPreview,
                    order_index: 0,
                });

            if (lessonError) throw lessonError;

            // ✅ جيب اسم الكورس + كل الطلاب المسجلين
            const { data: courseData } = await supabase
                .from("courses")
                .select("title")
                .eq("id", courseId)
                .single();

            const { data: enrollments } = await supabase
                .from("enrollments")
                .select("user_id")
                .eq("course_id", courseId);

            // ✅ ابعت إشعار لكل طالب مسجل
            if (enrollments?.length) {
                const notifs = enrollments.map(e => ({
                    user_id: e.user_id,
                    type: "new_lesson",
                    title: `درس جديد في "${courseData?.title}" 🎓`,
                    body: `تم إضافة درس "${form.lessonTitle}" — شوفه دلوقتي!`,
                    link: `/courses/${courseId}`,
                }));

                await supabase.from("notifications").insert(notifs);
            }

            onSuccess();
            onClose();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={"AddLessonModal-backdrop"} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={"AddLessonModal-modal"}>
                <div className={"AddLessonModal-modalHead"}>
                    <h3>إضافة درس جديد</h3>
                    <button className={"AddLessonModal-closeBtn"} onClick={onClose}>✕</button>
                </div>

                <div className={"AddLessonModal-field"}>
                    <label>اسم القسم</label>
                    <input
                        className={"AddLessonModal-input"}
                        placeholder="مثال: مقدمة وإعداد البيئة"
                        value={form.sectionTitle}
                        onChange={e => update("sectionTitle", e.target.value)}
                    />
                </div>

                <div className={"AddLessonModal-field"}>
                    <label>اسم الدرس *</label>
                    <input
                        className={"AddLessonModal-input"}
                        placeholder="مثال: مرحباً بك في الكورس"
                        value={form.lessonTitle}
                        onChange={e => update("lessonTitle", e.target.value)}
                    />
                </div>

                <div className={"AddLessonModal-grid2"}>
                    <div className={"AddLessonModal-field"}>
                        <label>نوع المحتوى</label>
                        <select className={"AddLessonModal-select"} value={form.type} onChange={e => update("type", e.target.value)}>
                            <option value="video">فيديو</option>
                            <option value="document">ملف PDF</option>
                            <option value="quiz">اختبار</option>
                        </select>
                    </div>
                    <div className={"AddLessonModal-field"}>
                        <label>المدة</label>
                        <input
                            className={"AddLessonModal-input"}
                            placeholder="مثال: 10:30"
                            value={form.duration}
                            onChange={e => update("duration", e.target.value)}
                        />
                    </div>
                </div>

                {/* Video Upload */}
                {form.type === "video" && (
                    <div className={"AddLessonModal-field"}>
                        <label>رفع الفيديو أو رابط YouTube</label>
                        <div className={"AddLessonModal-videoUpload"}>
                            <label className={"AddLessonModal-uploadBtn"}>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleUploadVideo}
                                    style={{ display: "none" }}
                                />
                                {uploading ? "⏳ جاري الرفع..." : "📹 رفع فيديو"}
                            </label>
                            <span className={"AddLessonModal-orText"}>أو</span>
                            <input
                                className={"AddLessonModal-input"}
                                style={{ flex: 1 }}
                                placeholder="https://youtube.com/..."
                                value={form.videoUrl}
                                onChange={e => update("videoUrl", e.target.value)}
                            />
                        </div>
                        {form.videoUrl && (
                            <div className={"AddLessonModal-videoReady"}>✅ الفيديو جاهز</div>
                        )}
                    </div>
                )}

                {/* Preview toggle */}
                <div className={"AddLessonModal-toggleRow"}>
                    <label>معاينة مجانية</label>
                    <div
                        className={`${"AddLessonModal-toggle"} ${form.isPreview ? "AddLessonModal-toggleOn" : ""}`}
                        onClick={() => update("isPreview", !form.isPreview)}
                    >
                        <div className={"AddLessonModal-toggleThumb"} />
                    </div>
                </div>

                {error && <div className={"AddLessonModal-error"}>{error}</div>}

                <div className={"AddLessonModal-modalActions"}>
                    <button className={"AddLessonModal-cancelBtn"} onClick={onClose}>إلغاء</button>
                    <button className={"AddLessonModal-saveBtn"} onClick={handleSave} disabled={loading}>
                        {loading ? "جاري الحفظ..." : "💾 حفظ الدرس"}
                    </button>
                </div>
            </div>
        </div>
    );
}