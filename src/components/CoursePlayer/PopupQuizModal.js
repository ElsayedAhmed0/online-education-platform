"use client";
import { useState } from "react";

export default function PopupQuizModal({ question, onCorrect, onWrong }) {
    const [selectedIdx, setSelectedIdx] = useState(null);

    const handleSubmit = () => {
        if (selectedIdx === null) return;
        
        // The correct_answer is stored as the string value of the correct option
        // Wait, in ExamManagerModal we stored correct_answer as: finalCorrect = form.options[form.correct_answer];
        // So question.correct_answer is the string.
        const isCorrect = question.options[selectedIdx] === question.correct_answer;
        
        if (isCorrect) {
            onCorrect();
        } else {
            onWrong();
        }
    };

    return (
        <div style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: "20px"
        }}>
            <div style={{
                background: "#1e1b4b", borderRadius: "16px", padding: "32px",
                maxWidth: "500px", width: "100%", border: "1px solid rgba(129,140,248,0.3)",
                color: "#fff"
            }}>
                <div style={{ fontSize: "24px", marginBottom: "16px", textAlign: "center" }}>⏱️ سؤال سريع</div>
                <h3 style={{ marginBottom: "24px", lineHeight: "1.5" }}>{question.question_text}</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                    {question.options.map((opt, idx) => (
                        <div 
                            key={idx}
                            onClick={() => setSelectedIdx(idx)}
                            style={{
                                padding: "16px", borderRadius: "8px", cursor: "pointer",
                                border: `1px solid ${selectedIdx === idx ? "#818CF8" : "rgba(255,255,255,0.2)"}`,
                                background: selectedIdx === idx ? "rgba(129,140,248,0.1)" : "rgba(255,255,255,0.05)",
                                transition: "all 0.2s"
                            }}
                        >
                            <span style={{ 
                                display: "inline-block", width: "24px", height: "24px", 
                                borderRadius: "50%", border: `2px solid ${selectedIdx === idx ? "#818CF8" : "#fff"}`,
                                verticalAlign: "middle", marginRight: "10px", marginLeft: "10px",
                                background: selectedIdx === idx ? "#818CF8" : "transparent"
                            }} />
                            {opt}
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={selectedIdx === null}
                    style={{
                        background: selectedIdx === null ? "rgba(255,255,255,0.1)" : "#818CF8",
                        color: selectedIdx === null ? "rgba(255,255,255,0.5)" : "#fff",
                        border: "none", borderRadius: "8px", padding: "16px",
                        width: "100%", fontSize: "16px", fontWeight: "bold",
                        cursor: selectedIdx === null ? "not-allowed" : "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    تأكيد الإجابة
                </button>
            </div>
        </div>
    );
}
