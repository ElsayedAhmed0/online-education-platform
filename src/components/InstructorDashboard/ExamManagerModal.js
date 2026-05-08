"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export default function ExamManagerModal({ lessonId, isPopupMode, onClose }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [error, setError] = useState("");

    // Form state
    const [form, setForm] = useState({
        type: "mcq",
        question_text: "",
        popup_time: "", // format: mm:ss
        options: ["", "", "", ""],
        correct_answer: 0, // index of options
    });

    useEffect(() => {
        fetchQuestions();
    }, [lessonId]);

    const fetchQuestions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("questions")
            .select("*")
            .eq("lesson_id", lessonId)
            .order("order_index", { ascending: true });
        
        if (!error && data) {
            setQuestions(data);
        }
        setLoading(false);
    };

    const updateForm = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleOptionChange = (idx, val) => {
        const newOpts = [...form.options];
        newOpts[idx] = val;
        updateForm("options", newOpts);
    };

    const parseTimeToSeconds = (timeStr) => {
        if (!timeStr) return null;
        const parts = timeStr.split(":");
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        return parseInt(timeStr);
    };

    const formatSecondsToTime = (secs) => {
        if (secs === null || secs === undefined) return "";
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const handleSaveQuestion = async () => {
        if (!form.question_text.trim()) return setError("نص السؤال مطلوب");
        
        let finalOptions = [];
        let finalCorrect = null;
        let finalPopupTime = null;

        if (form.type === "mcq") {
            finalOptions = form.options.filter(o => o.trim() !== "");
            if (finalOptions.length < 2) return setError("يجب إضافة خيارين على الأقل");
            finalCorrect = form.options[form.correct_answer];
            if (!finalCorrect || finalCorrect.trim() === "") return setError("يجب تحديد إجابة صحيحة صالحة");
        }

        if (isPopupMode) {
            finalPopupTime = parseTimeToSeconds(form.popup_time);
            if (finalPopupTime === null || isNaN(finalPopupTime)) return setError("يجب تحديد وقت الظهور بشكل صحيح (دقيقة:ثانية)");
        }

        setLoading(true);
        setError("");

        try {
            // Get course_id from lesson
            const { data: lessonData } = await supabase.from("lessons").select("course_id").eq("id", lessonId).single();
            if (!lessonData) throw new Error("الدرس غير موجود");

            const newQ = {
                course_id: lessonData.course_id,
                lesson_id: lessonId,
                type: form.type,
                question_text: form.question_text,
                options: finalOptions,
                correct_answer: finalCorrect,
                popup_time: finalPopupTime,
                order_index: questions.length,
            };

            const { error: insertError } = await supabase.from("questions").insert(newQ);
            if (insertError) throw insertError;

            // Reset form
            setForm({
                type: "mcq",
                question_text: "",
                popup_time: "",
                options: ["", "", "", ""],
                correct_answer: 0,
            });
            await fetchQuestions();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("تأكيد حذف السؤال؟")) return;
        setLoading(true);
        await supabase.from("questions").delete().eq("id", id);
        await fetchQuestions();
    };

    return (
        <div className="AddLessonModal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="AddLessonModal-modal" style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
                <div className="AddLessonModal-modalHead">
                    <h3>{isPopupMode ? "إدارة أسئلة الفيديو السريعة (Pop-up MCQ)" : "إدارة أسئلة امتحان القسم"}</h3>
                    <button className="AddLessonModal-closeBtn" onClick={onClose}>✕</button>
                </div>

                {/* Existing Questions List */}
                <div style={{ marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "20px" }}>
                    <h4 style={{ marginBottom: "10px", color: "rgba(255,255,255,0.7)" }}>الأسئلة الحالية ({questions.length})</h4>
                    {questions.length === 0 && <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>لا توجد أسئلة بعد.</p>}
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {questions.map((q, idx) => (
                            <div key={q.id} style={{ background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "8px", position: "relative" }}>
                                <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>
                                    {idx + 1}. {q.question_text}
                                </div>
                                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                                    {q.type === 'mcq' ? 'MCQ (اختياري)' : 'مقال (كتابي)'} 
                                    {q.popup_time !== null && ` - يظهر عند: ${formatSecondsToTime(q.popup_time)}`}
                                </div>
                                {q.type === "mcq" && (
                                    <div style={{ fontSize: "12px", color: "#10B981", marginTop: "4px" }}>
                                        الإجابة الصحيحة: {q.correct_answer}
                                    </div>
                                )}
                                <button 
                                    onClick={() => handleDelete(q.id)}
                                    style={{ position: "absolute", top: "10px", left: "10px", background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "18px" }}
                                >
                                    🗑
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add New Question Form */}
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <h4 style={{ color: "#fff" }}>إضافة سؤال جديد</h4>
                    
                    {!isPopupMode && (
                        <div className="AddLessonModal-field">
                            <label>نوع السؤال</label>
                            <select className="AddLessonModal-select" value={form.type} onChange={e => updateForm("type", e.target.value)}>
                                <option value="mcq">اختيار من متعدد (MCQ)</option>
                                <option value="written">سؤال مقالي (كتابي)</option>
                            </select>
                        </div>
                    )}

                    <div className="AddLessonModal-field">
                        <label>نص السؤال *</label>
                        <textarea 
                            className="AddLessonModal-input" 
                            style={{ minHeight: "80px", resize: "vertical" }}
                            placeholder="اكتب نص السؤال هنا..."
                            value={form.question_text}
                            onChange={e => updateForm("question_text", e.target.value)}
                        />
                    </div>

                    {isPopupMode && (
                        <div className="AddLessonModal-field">
                            <label>وقت الظهور في الفيديو * (دقيقة:ثانية)</label>
                            <input 
                                className="AddLessonModal-input"
                                placeholder="مثال: 01:30"
                                value={form.popup_time}
                                onChange={e => updateForm("popup_time", e.target.value)}
                            />
                            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>سيتوقف الفيديو عند هذا الوقت ليجيب الطالب على السؤال.</span>
                        </div>
                    )}

                    {form.type === "mcq" && (
                        <div className="AddLessonModal-field">
                            <label>الخيارات (اختر الإجابة الصحيحة)</label>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {form.options.map((opt, idx) => (
                                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <input 
                                            type="radio" 
                                            name="correct_answer" 
                                            checked={form.correct_answer === idx} 
                                            onChange={() => updateForm("correct_answer", idx)}
                                            style={{ cursor: "pointer" }}
                                        />
                                        <input 
                                            className="AddLessonModal-input" 
                                            style={{ flex: 1 }}
                                            placeholder={`خيار ${idx + 1}`}
                                            value={opt}
                                            onChange={e => handleOptionChange(idx, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && <div className="AddLessonModal-error">{error}</div>}

                    <div className="AddLessonModal-modalActions" style={{ marginTop: "10px" }}>
                        <button className="AddLessonModal-cancelBtn" onClick={onClose}>إغلاق</button>
                        <button className="AddLessonModal-saveBtn" onClick={handleSaveQuestion} disabled={loading}>
                            {loading ? "جاري الحفظ..." : "➕ إضافة سؤال جديد"}
                        </button>
                        <button 
                            className="AddLessonModal-saveBtn" 
                            style={{ background: "#818CF8", borderColor: "#818CF8" }}
                            onClick={async () => {
                                await handleSaveQuestion();
                                onClose();
                            }} 
                            disabled={loading}
                        >
                            {loading ? "جاري الحفظ..." : "💾 حفظ وإغلاق"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
