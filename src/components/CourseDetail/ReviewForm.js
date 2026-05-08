"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function ReviewForm({ targetType = "course", targetId, onSuccess }) {
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

            // For platform reviews, status is 'pending', otherwise 'approved'
            const status = targetType === "platform" ? "pending" : "approved";

            const insertData = {
                user_id: user.id,
                rating,
                comment,
                target_type: targetType,
                status,
            };

            if (targetType === "course") insertData.course_id = targetId;
            if (targetType === "instructor") insertData.instructor_id = targetId;

            const { error: insertError } = await supabase.from("reviews").insert(insertData);
            if (insertError) throw insertError;

            // Update course rating if it's a course
            if (targetType === "course" && targetId) {
                const { data: reviews } = await supabase
                    .from("reviews")
                    .select("rating")
                    .eq("course_id", targetId)
                    .eq("status", "approved");

                if (reviews?.length) {
                    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                    await supabase
                        .from("courses")
                        .update({ rating: Math.round(avg * 10) / 10 })
                        .eq("id", targetId);
                }

                // Notify Instructor
                const { data: courseData } = await supabase
                    .from("courses")
                    .select("title, instructor_id")
                    .eq("id", targetId)
                    .single();

                if (courseData?.instructor_id) {
                    const stars = "⭐".repeat(rating);
                    await supabase.from("notifications").insert({
                        user_id: courseData.instructor_id,
                        type: "announcement",
                        title: `تقييم جديد على كورسك ${stars}`,
                        body: `تقييم جديد: "${comment.slice(0, 60)}"`,
                        link: `/courses/${targetId}`,
                    });
                }
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
                <p>
                    {targetType === "platform" 
                        ? "شكراً! تم إرسال تقييمك بنجاح وهو الآن قيد المراجعة." 
                        : "شكراً! تم إرسال تقييمك بنجاح"}
                </p>
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
                placeholder="شاركنا رأيك..."
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