"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export default function ExamView({ courseId, lessonId, userId, onPassed }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({}); // { question_id: answer_value }
    const [result, setResult] = useState(null); // null | { passed: boolean, score: number, total: number }
    const [error, setError] = useState("");

    useEffect(() => {
        if (lessonId) {
            fetchExam();
        }
    }, [lessonId]);

    const fetchExam = async () => {
        setLoading(true);
        setResult(null);
        setAnswers({});

        // Check if user already passed this exam
        if (userId) {
            const { data: previousResult } = await supabase
                .from("exam_results")
                .select("*")
                .eq("lesson_id", lessonId)
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (previousResult && previousResult.passed) {
                setResult({
                    passed: true,
                    score: previousResult.score,
                    total: Object.keys(previousResult.answers || {}).length, // approximate
                    alreadyPassed: true
                });
                setLoading(false);
                return;
            }
        }

        // Fetch questions
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

    const handleAnswer = (qId, val) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const handleSubmit = async () => {
        if (!userId) {
            setError("يجب تسجيل الدخول لإرسال الامتحان");
            return;
        }

        // Check if all questions are answered
        const unanswered = questions.filter(q => !answers[q.id] || answers[q.id].toString().trim() === "");
        if (unanswered.length > 0) {
            setError("يرجى الإجابة على جميع الأسئلة قبل الإرسال");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            // Calculate MCQ score
            const mcqQuestions = questions.filter(q => q.type === "mcq");
            let correctCount = 0;
            
            mcqQuestions.forEach(q => {
                if (answers[q.id] === q.correct_answer) {
                    correctCount++;
                }
            });

            // Pass condition: > 50% on MCQs (if there are any)
            let passed = true;
            let scorePercentage = 100;
            if (mcqQuestions.length > 0) {
                scorePercentage = (correctCount / mcqQuestions.length) * 100;
                passed = scorePercentage >= 50;
            }

            // Save result
            const { error: insertError } = await supabase.from("exam_results").insert({
                user_id: userId,
                lesson_id: lessonId,
                passed,
                score: Math.round(scorePercentage),
                answers
            });

            if (insertError) throw insertError;

            setResult({
                passed,
                score: Math.round(scorePercentage),
                total: mcqQuestions.length,
                correct: correctCount
            });

            if (passed) {
                onPassed();
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center", color: "#fff" }}>⏳ جاري تحميل الامتحان...</div>;
    }

    if (result && result.alreadyPassed) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#fff", background: "rgba(16,185,129,0.1)", borderRadius: "16px", border: "1px solid rgba(16,185,129,0.3)" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
                <h2>لقد اجتزت هذا الامتحان مسبقاً!</h2>
                <p style={{ marginTop: "10px", color: "rgba(255,255,255,0.7)" }}>يمكنك الآن الانتقال إلى القسم التالي بحرية.</p>
                {result.score !== undefined && (
                    <div style={{ marginTop: "20px", fontSize: "20px", fontWeight: "bold", color: "#10B981" }}>
                        النتيجة: {result.score}%
                    </div>
                )}
            </div>
        );
    }

    if (result && !result.alreadyPassed) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#fff", background: result.passed ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderRadius: "16px", border: `1px solid ${result.passed ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>{result.passed ? "✅" : "❌"}</div>
                <h2>{result.passed ? "مبروك! لقد اجتزت الامتحان" : "للأسف، لم تجتز الامتحان"}</h2>
                <p style={{ marginTop: "10px", color: "rgba(255,255,255,0.7)" }}>
                    {result.passed ? "يمكنك الآن متابعة الدروس في القسم التالي." : "يرجى مراجعة القسم والمحاولة مرة أخرى."}
                </p>
                <div style={{ marginTop: "20px", fontSize: "24px", fontWeight: "bold", color: result.passed ? "#10B981" : "#EF4444" }}>
                    النتيجة: {result.score}%
                </div>
                {!result.passed && (
                    <button 
                        onClick={fetchExam}
                        style={{ marginTop: "20px", background: "#818CF8", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontSize: "16px" }}
                    >
                        🔄 إعادة الامتحان
                    </button>
                )}
            </div>
        );
    }

    if (questions.length === 0) {
        return <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>لا توجد أسئلة مضافة في هذا الامتحان بعد.</div>;
    }

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", color: "#fff" }}>
            <div style={{ marginBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "20px" }}>
                <h2>📝 امتحان نهاية القسم</h2>
                <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "8px" }}>أجب على جميع الأسئلة لتتمكن من الانتقال للقسم التالي. تحتاج إلى 50% على الأقل في أسئلة الاختيارات للنجاح.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                {questions.map((q, idx) => (
                    <div key={q.id} style={{ background: "rgba(255,255,255,0.03)", padding: "24px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <h3 style={{ marginBottom: "20px", lineHeight: "1.6" }}>
                            <span style={{ color: "#818CF8", marginRight: "8px" }}>{idx + 1}.</span>
                            {q.question_text}
                        </h3>

                        {q.type === "mcq" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {q.options.map((opt, oIdx) => (
                                    <label 
                                        key={oIdx} 
                                        style={{ 
                                            display: "flex", alignItems: "center", gap: "12px", 
                                            padding: "16px", borderRadius: "8px", cursor: "pointer",
                                            background: answers[q.id] === opt ? "rgba(129,140,248,0.1)" : "rgba(255,255,255,0.05)",
                                            border: `1px solid ${answers[q.id] === opt ? "#818CF8" : "transparent"}`,
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <input 
                                            type="radio" 
                                            name={`q_${q.id}`} 
                                            value={opt}
                                            checked={answers[q.id] === opt}
                                            onChange={() => handleAnswer(q.id, opt)}
                                            style={{ cursor: "pointer" }}
                                        />
                                        <span style={{ fontSize: "16px" }}>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <textarea 
                                    placeholder="اكتب إجابتك هنا..."
                                    value={answers[q.id] || ""}
                                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                                    style={{
                                        width: "100%", minHeight: "120px", background: "rgba(0,0,0,0.2)",
                                        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
                                        padding: "16px", color: "#fff", fontSize: "16px", resize: "vertical"
                                    }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {error && <div style={{ color: "#EF4444", marginTop: "20px", padding: "12px", background: "rgba(239,68,68,0.1)", borderRadius: "8px" }}>{error}</div>}

            <div style={{ marginTop: "40px", textAlign: "left" }}>
                <button 
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                        background: "#818CF8", color: "#fff", border: "none", padding: "16px 40px",
                        borderRadius: "8px", fontSize: "18px", fontWeight: "bold", cursor: "pointer",
                        opacity: submitting ? 0.7 : 1
                    }}
                >
                    {submitting ? "جاري الإرسال..." : "📤 إرسال الإجابات"}
                </button>
            </div>
        </div>
    );
}
