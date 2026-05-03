"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";


export default function ReviewForm({ courseId, onSuccess }) {
    const supabase = createClient();
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    const handleSubmit = async () => {
        if (!rating) return setError("اختر تقييم من 1 إلى 5");
        if (!comment.trim()) return setError("اكتب تعليقك");

        setLoading(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("سجّل دخولك أولاً");

            const { error } = await supabase.from("reviews").insert({
                user_id: user.id,
                course_id: courseId,
                rating,
                comment,
            });

            if (error) throw error;

            // حدّث الـ rating في الكورس
            const { data: reviews } = await supabase
                .from("reviews")
                .select("rating")
                .eq("course_id", courseId);

            if (reviews?.length) {
                const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                await supabase
                    .from("courses")
                    .update({ rating: Math.round(avg * 10) / 10 })
                    .eq("id", courseId);
            }

            setDone(true);
            // ✅ جيب المدرس بتاع الكورس + اسم الطالب
            const { data: courseData } = await supabase
                .from("courses")
                .select("title, instructor_id")
                .eq("id", courseId)
                .single();

            const { data: studentProfile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", user.id)
                .single();

            const stars = "⭐".repeat(rating);
            const studentName = studentProfile?.full_name ?? "أحد الطلاب";

            // ✅ إشعار للمدرس
            if (courseData?.instructor_id) {
                await supabase.from("notifications").insert({
                    user_id: courseData.instructor_id,
                    type: "enrollment",
                    title: `تقييم جديد على كورسك ${stars}`,
                    body: `${studentName} كتب: "${comment.slice(0, 60)}${comment.length > 60 ? "..." : ""}"`,
                    link: `/courses/${courseId}`,
                });
            }

            setDone(true);
            onSuccess?.();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className={"ReviewForm-success"}>
                <div>🎉</div>
                <p>شكراً! تم إرسال تقييمك بنجاح</p>
            </div>
        );
    }

    return (
        <div className={"ReviewForm-form"}>
            <h3 className={"ReviewForm-title"}>أضف تقييمك</h3>

            {/* Stars */}
            <div className={"ReviewForm-stars"}>
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        className={`${"ReviewForm-star"} ${star <= (hover || rating) ? "ReviewForm-starActive" : ""}`}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(star)}
                    >★</button>
                ))}
                <span className={"ReviewForm-ratingLabel"}>
                    {rating ? ["", "ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز"][rating] : "اختر تقييمك"}
                </span>
            </div>

            {/* Comment */}
            <textarea
                className={"ReviewForm-textarea"}
                placeholder="شاركنا رأيك في الكورس..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={4}
            />

            {error && <div className={"ReviewForm-error"}>{error}</div>}

            <button
                className={"ReviewForm-submitBtn"}
                onClick={handleSubmit}
                disabled={loading}
            >
                {loading ? "جاري الإرسال..." : "إرسال التقييم"}
            </button>
        </div>
    );
}