"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

function getEmbedUrl(url) {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    return url;
}

/* ── Modal إضافة / تعديل درس ── */
function LessonModal({ courseId, sectionId, lesson, onClose, onSuccess }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        title: lesson?.title ?? "",
        type: lesson?.type ?? "video",
        videoUrl: lesson?.video_url ?? "",
        duration: lesson?.duration ?? "",
        isPreview: lesson?.is_preview ?? false,
    });

    const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const ext = file.name.split(".").pop();
            const path = `videos/${courseId}/${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from("eduplatform").upload(path, file, { upsert: true });
            if (error) throw error;
            const { data } = supabase.storage.from("eduplatform").getPublicUrl(path);
            update("videoUrl", data.publicUrl);
        } catch (err) { setError(err.message); }
        finally { setUploading(false); }
    };

    const handleSave = async () => {
        if (!form.title.trim()) return setError("اسم الدرس مطلوب");
        setLoading(true); setError("");
        try {
            if (lesson) {
                // تعديل
                const { error } = await supabase.from("lessons").update({
                    title: form.title,
                    type: form.type,
                    video_url: form.videoUrl || null,
                    duration: form.duration || null,
                    is_preview: form.isPreview,
                }).eq("id", lesson.id);
                if (error) throw error;
            } else {
                // إضافة
                const { data: lastLesson } = await supabase
                    .from("lessons")
                    .select("order_index")
                    .eq("section_id", sectionId)
                    .order("order_index", { ascending: false })
                    .limit(1)
                    .single();

                const { error } = await supabase.from("lessons").insert({
                    section_id: sectionId,
                    course_id: courseId,
                    title: form.title,
                    type: form.type,
                    video_url: form.videoUrl || null,
                    duration: form.duration || null,
                    is_preview: form.isPreview,
                    order_index: (lastLesson?.order_index ?? -1) + 1,
                });
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="AddLessonModal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="AddLessonModal-modal">
                <div className="AddLessonModal-modalHead">
                    <h3>{lesson ? "تعديل الدرس" : "إضافة درس جديد"}</h3>
                    <button className="AddLessonModal-closeBtn" onClick={onClose}>✕</button>
                </div>

                <div className="AddLessonModal-field">
                    <label>اسم الدرس *</label>
                    <input className="AddLessonModal-input" placeholder="مثال: مقدمة في الكورس"
                        value={form.title} onChange={e => update("title", e.target.value)} />
                </div>

                <div className="AddLessonModal-grid2">
                    <div className="AddLessonModal-field">
                        <label>نوع المحتوى</label>
                        <select className="AddLessonModal-select" value={form.type} onChange={e => update("type", e.target.value)}>
                            <option value="video">🎬 فيديو</option>
                            <option value="document">📄 ملف PDF</option>
                            <option value="quiz">📝 اختبار</option>
                        </select>
                    </div>
                    <div className="AddLessonModal-field">
                        <label>المدة</label>
                        <input className="AddLessonModal-input" placeholder="10:30"
                            value={form.duration} onChange={e => update("duration", e.target.value)} />
                    </div>
                </div>

                {form.type === "video" && (
                    <div className="AddLessonModal-field">
                        <label>رابط YouTube أو رفع فيديو</label>
                        <div className="AddLessonModal-videoUpload">
                            <label className="AddLessonModal-uploadBtn">
                                <input type="file" accept="video/*" onChange={handleUpload} style={{ display: "none" }} />
                                {uploading ? "⏳ جاري الرفع..." : "📹 رفع فيديو"}
                            </label>
                            <span className="AddLessonModal-orText">أو</span>
                            <input className="AddLessonModal-input" style={{ flex: 1 }}
                                placeholder="https://youtube.com/..."
                                value={form.videoUrl} onChange={e => update("videoUrl", e.target.value)} />
                        </div>
                        {form.videoUrl && <div className="AddLessonModal-videoReady">✅ الفيديو جاهز</div>}
                    </div>
                )}

                <div className="AddLessonModal-toggleRow">
                    <label>معاينة مجانية</label>
                    <div className={`AddLessonModal-toggle ${form.isPreview ? "AddLessonModal-toggleOn" : ""}`}
                        onClick={() => update("isPreview", !form.isPreview)}>
                        <div className="AddLessonModal-toggleThumb" />
                    </div>
                </div>

                {error && <div className="AddLessonModal-error">{error}</div>}

                <div className="AddLessonModal-modalActions">
                    <button className="AddLessonModal-cancelBtn" onClick={onClose}>إلغاء</button>
                    <button className="AddLessonModal-saveBtn" onClick={handleSave} disabled={loading}>
                        {loading ? "جاري الحفظ..." : "💾 حفظ"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Modal إضافة / تعديل section ── */
function SectionModal({ courseId, section, onClose, onSuccess }) {
    const supabase = createClient();
    const [title, setTitle] = useState(section?.title ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        if (!title.trim()) return setError("اسم القسم مطلوب");
        setLoading(true); setError("");
        try {
            if (section) {
                const { error } = await supabase.from("sections").update({ title }).eq("id", section.id);
                if (error) throw error;
            } else {
                const { data: last } = await supabase
                    .from("sections")
                    .select("order_index")
                    .eq("course_id", courseId)
                    .order("order_index", { ascending: false })
                    .limit(1)
                    .single();

                const { error } = await supabase.from("sections").insert({
                    course_id: courseId,
                    title,
                    order_index: (last?.order_index ?? -1) + 1,
                });
                if (error) throw error;
            }
            onSuccess(); onClose();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="AddLessonModal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="AddLessonModal-modal" style={{ maxWidth: 420 }}>
                <div className="AddLessonModal-modalHead">
                    <h3>{section ? "تعديل القسم" : "إضافة قسم جديد"}</h3>
                    <button className="AddLessonModal-closeBtn" onClick={onClose}>✕</button>
                </div>
                <div className="AddLessonModal-field">
                    <label>اسم القسم *</label>
                    <input className="AddLessonModal-input" placeholder="مثال: مقدمة وإعداد البيئة"
                        value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                {error && <div className="AddLessonModal-error">{error}</div>}
                <div className="AddLessonModal-modalActions">
                    <button className="AddLessonModal-cancelBtn" onClick={onClose}>إلغاء</button>
                    <button className="AddLessonModal-saveBtn" onClick={handleSave} disabled={loading}>
                        {loading ? "جاري الحفظ..." : "💾 حفظ"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ══ Main Component ══ */
export default function CourseContentManager({ course, initialSections, userId }) {
    const router = useRouter();
    const supabase = createClient();

    const [sections, setSections] = useState(initialSections);
    const [expandedSections, setExpandedSections] = useState(
        Object.fromEntries(initialSections.map(s => [s.id, true]))
    );

    // Modals state
    const [sectionModal, setSectionModal] = useState(null); // null | "add" | section obj
    const [lessonModal, setLessonModal] = useState(null);   // null | { sectionId } | { sectionId, lesson }
    const [deleteConfirm, setDeleteConfirm] = useState(null); // null | { type, id, title }
    const [toast, setToast] = useState("");

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    };

    const refresh = async () => {
        const { data } = await supabase
            .from("sections")
            .select("*, lessons(*)")
            .eq("course_id", course.id)
            .order("order_index")
            .order("order_index", { foreignTable: "lessons" });
        setSections(data ?? []);
    };

    const toggleSection = (id) =>
        setExpandedSections(p => ({ ...p, [id]: !p[id] }));

    const handleDeleteSection = async (sectionId) => {
        await supabase.from("lessons").delete().eq("section_id", sectionId);
        await supabase.from("sections").delete().eq("id", sectionId);
        setDeleteConfirm(null);
        showToast("✅ تم حذف القسم");
        refresh();
    };

    const handleDeleteLesson = async (lessonId) => {
        await supabase.from("lessons").delete().eq("id", lessonId);
        setDeleteConfirm(null);
        showToast("✅ تم حذف الدرس");
        refresh();
    };

    const totalLessons = sections.reduce((s, sec) => s + (sec.lessons?.length ?? 0), 0);

    const STATUS_MAP = {
        live:   { label: "منشور ✅",         color: "#10B981", bg: "rgba(16,185,129,.12)" },
        draft:  { label: "مسودة",            color: "rgba(255,255,255,.5)", bg: "rgba(255,255,255,.07)" },
        review: { label: "قيد المراجعة ⏳",  color: "#FBBF24", bg: "rgba(245,158,11,.12)" },
    };
    const status = STATUS_MAP[course.status] ?? STATUS_MAP.draft;

    return (
        <div className="CM-page">
            {/* Topbar */}
            <div className="CM-topbar">
                <button className="CM-backBtn" onClick={() => router.push("/instructor/dashboard")}>
                    ← الداشبورد
                </button>
                <div className="CM-topbarCenter">
                    <div className="CM-topbarTitle">{course.title}</div>
                    <span className="CM-statusBadge" style={{ color: status.color, background: status.bg }}>
                        {status.label}
                    </span>
                </div>
                <div className="CM-topbarStats">
                    <span>{sections.length} قسم</span>
                    <span>·</span>
                    <span>{totalLessons} درس</span>
                </div>
            </div>

            <div className="CM-layout">
                {/* Sidebar Info */}
                <aside className="CM-aside">
                    <div className="CM-asideCard">
                        {course.thumbnail && (
                            <img src={course.thumbnail} alt={course.title} className="CM-asideThumb" />
                        )}
                        <div className="CM-asideInfo">
                            <div className="CM-asideRow">
                                <span className="CM-asideLbl">السعر</span>
                                <span className="CM-asideVal">{course.price} ج.م</span>
                            </div>
                            <div className="CM-asideRow">
                                <span className="CM-asideLbl">المستوى</span>
                                <span className="CM-asideVal">{course.level}</span>
                            </div>
                            <div className="CM-asideRow">
                                <span className="CM-asideLbl">التخصص</span>
                                <span className="CM-asideVal">{course.category}</span>
                            </div>
                            <div className="CM-asideRow">
                                <span className="CM-asideLbl">الأقسام</span>
                                <span className="CM-asideVal">{sections.length}</span>
                            </div>
                            <div className="CM-asideRow">
                                <span className="CM-asideLbl">الدروس</span>
                                <span className="CM-asideVal">{totalLessons}</span>
                            </div>
                        </div>
                        <button className="CM-addSectionBtn" onClick={() => setSectionModal("add")}>
                            + إضافة قسم جديد
                        </button>
                    </div>

                    {course.status === "review" && (
                        <div className="CM-reviewNote">
                            ⏳ الكورس قيد المراجعة — يمكنك إضافة المحتوى الآن وسيظهر للطلاب بعد الموافقة
                        </div>
                    )}
                    {course.status === "live" && (
                        <div className="CM-liveNote">
                            ✅ الكورس منشور — أي محتوى جديد يظهر للطلاب فوراً
                        </div>
                    )}
                </aside>

                {/* Main Content */}
                <main className="CM-main">
                    <div className="CM-mainHead">
                        <h2 className="CM-mainTitle">محتوى الكورس</h2>
                        <button className="CM-addSectionBtnTop" onClick={() => setSectionModal("add")}>
                            + قسم جديد
                        </button>
                    </div>

                    {sections.length === 0 ? (
                        <div className="CM-empty">
                            <div className="CM-emptyIcon">📭</div>
                            <div className="CM-emptyText">لا يوجد محتوى بعد</div>
                            <div className="CM-emptySub">ابدأ بإضافة قسم جديد</div>
                            <button className="CM-emptyBtn" onClick={() => setSectionModal("add")}>
                                + إضافة أول قسم
                            </button>
                        </div>
                    ) : (
                        <div className="CM-sections">
                            {sections.map((sec, secIdx) => (
                                <div key={sec.id} className="CM-section">
                                    {/* Section Header */}
                                    <div className="CM-sectionHead">
                                        <button className="CM-sectionToggle" onClick={() => toggleSection(sec.id)}>
                                            {expandedSections[sec.id] ? "▾" : "▸"}
                                        </button>
                                        <div className="CM-sectionNum">القسم {secIdx + 1}</div>
                                        <div className="CM-sectionName">{sec.title}</div>
                                        <div className="CM-sectionMeta">
                                            {sec.lessons?.length ?? 0} درس
                                        </div>
                                        <div className="CM-sectionActions">
                                            <button className="CM-iconBtn CM-editBtn"
                                                onClick={() => setSectionModal(sec)}
                                                title="تعديل القسم">✏️</button>
                                            <button className="CM-iconBtn CM-addBtn"
                                                onClick={() => setLessonModal({ sectionId: sec.id })}
                                                title="إضافة درس">+</button>
                                            <button className="CM-iconBtn CM-deleteBtn"
                                                onClick={() => setDeleteConfirm({ type: "section", id: sec.id, title: sec.title })}
                                                title="حذف القسم">🗑</button>
                                        </div>
                                    </div>

                                    {/* Lessons */}
                                    {expandedSections[sec.id] && (
                                        <div className="CM-lessons">
                                            {sec.lessons?.length === 0 && (
                                                <div className="CM-noLessons">
                                                    لا توجد دروس — <button className="CM-addLessonLink"
                                                        onClick={() => setLessonModal({ sectionId: sec.id })}>
                                                        أضف درس الآن
                                                    </button>
                                                </div>
                                            )}
                                            {sec.lessons?.map((lesson, lIdx) => (
                                                <div key={lesson.id} className="CM-lesson">
                                                    <div className="CM-lessonNum">{lIdx + 1}</div>
                                                    <div className="CM-lessonIcon">
                                                        {lesson.type === "video" ? "🎬" :
                                                            lesson.type === "document" ? "📄" : "📝"}
                                                    </div>
                                                    <div className="CM-lessonInfo">
                                                        <div className="CM-lessonTitle">{lesson.title}</div>
                                                        <div className="CM-lessonMeta">
                                                            {lesson.duration && <span>⏱ {lesson.duration}</span>}
                                                            {lesson.is_preview && <span className="CM-previewBadge">مجاني</span>}
                                                            {lesson.video_url && <span className="CM-urlBadge">✅ فيديو</span>}
                                                        </div>
                                                    </div>
                                                    <div className="CM-lessonActions">
                                                        <button className="CM-iconBtn CM-editBtn"
                                                            onClick={() => setLessonModal({ sectionId: sec.id, lesson })}
                                                            title="تعديل">✏️</button>
                                                        <button className="CM-iconBtn CM-deleteBtn"
                                                            onClick={() => setDeleteConfirm({ type: "lesson", id: lesson.id, title: lesson.title })}
                                                            title="حذف">🗑</button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add Lesson Button */}
                                            <button className="CM-addLessonRow"
                                                onClick={() => setLessonModal({ sectionId: sec.id })}>
                                                + إضافة درس في هذا القسم
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Modals */}
            {sectionModal && (
                <SectionModal
                    courseId={course.id}
                    section={sectionModal === "add" ? null : sectionModal}
                    onClose={() => setSectionModal(null)}
                    onSuccess={() => { refresh(); showToast("✅ تم حفظ القسم"); }}
                />
            )}

            {lessonModal && (
                <LessonModal
                    courseId={course.id}
                    sectionId={lessonModal.sectionId}
                    lesson={lessonModal.lesson ?? null}
                    onClose={() => setLessonModal(null)}
                    onSuccess={() => { refresh(); showToast("✅ تم حفظ الدرس"); }}
                />
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="AddLessonModal-backdrop" onClick={() => setDeleteConfirm(null)}>
                    <div className="CM-deleteModal" onClick={e => e.stopPropagation()}>
                        <div className="CM-deleteIcon">🗑️</div>
                        <div className="CM-deleteTitle">تأكيد الحذف</div>
                        <div className="CM-deleteText">
                            هتحذف {deleteConfirm.type === "section" ? "القسم" : "الدرس"}{" "}
                            <strong>"{deleteConfirm.title}"</strong>
                            {deleteConfirm.type === "section" && " وكل الدروس اللي فيه"}
                        </div>
                        <div className="CM-deleteActions">
                            <button className="CM-deleteCancelBtn" onClick={() => setDeleteConfirm(null)}>إلغاء</button>
                            <button className="CM-deleteConfirmBtn" onClick={() =>
                                deleteConfirm.type === "section"
                                    ? handleDeleteSection(deleteConfirm.id)
                                    : handleDeleteLesson(deleteConfirm.id)
                            }>نعم، احذف</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && <div className="CM-toast">{toast}</div>}
        </div>
    );
}