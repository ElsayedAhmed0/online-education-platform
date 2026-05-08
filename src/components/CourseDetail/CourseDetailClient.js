"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ReviewForm from "./ReviewForm";

const LEVELS = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
};

export default function CourseDetailClient({ course, sections, reviews, enrollment, isAdmin }) {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [openSection, setOpenSection] = useState(0);
    const [promoCode, setPromoCode] = useState("");
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState("");
    const [promoSuccess, setPromoSuccess] = useState(null);

    const totalLessons = sections.reduce((sum, s) => sum + (s.lessons?.length ?? 0), 0);

    const finalPrice = promoSuccess
        ? Math.round(course.price * (1 - promoSuccess.discount / 100))
        : course.price;

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setPromoLoading(true);
        setPromoError("");
        setPromoSuccess(null);

        try {
            const res = await fetch("/api/apply-coupon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: promoCode, courseId: course.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setPromoSuccess(data);
        } catch (err) {
            setPromoError(err.message);
        } finally {
            setPromoLoading(false);
        }
    };

    const handleEnroll = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        // روّح لصفحة الـ checkout
        const params = new URLSearchParams();
        if (promoSuccess) {
            params.set("couponId", promoSuccess.couponId);
            params.set("discount", promoSuccess.discount);
            params.set("code", promoCode);
        }
        router.push(`/checkout/${course.id}?${params.toString()}`);
    };

    return (
        <div className={"CourseDetail-page"}>
            <div className={"CourseDetail-hero"}>
                <div className={"CourseDetail-heroContent"}>
                    {/* Info */}
                    <div>
                        <div className={"CourseDetail-breadcrumb"}>
                            <span onClick={() => router.push("/")} style={{ cursor: "pointer" }}>الكورسات</span>
                            <span>←</span>
                            <span>{course.category}</span>
                        </div>
                        <h1 className={"CourseDetail-title"}>{course.title}</h1>
                        <p className={"CourseDetail-desc"}>{course.description}</p>
                        <div className={"CourseDetail-meta"}>
                            <span className={"CourseDetail-rating"}>★ {course.rating}</span>
                            <span className={"CourseDetail-students"}>{course.students_count?.toLocaleString()} طالب</span>
                            <span className={"CourseDetail-level"}>{LEVELS[course.level] ?? course.level}</span>
                        </div>
                        <div className={"CourseDetail-instructor"}>
                            <div className={"CourseDetail-instructorAvatar"}>
                                {course.profiles?.name?.[0] ?? "م"}
                            </div>
                            <span>المدرس: <strong>{course.profiles?.name}</strong></span>
                        </div>
                    </div>

                    {/* Purchase Card */}
                    {/* Purchase Card */}
                    <div className={"CourseDetail-purchaseCard"}>
                        <img src={course.thumbnail} alt={course.title} className={"CourseDetail-thumbnail"} />
                        <div className={"CourseDetail-cardBody"}>

                            {enrollment ? (
                                /* ── مشترك بالفعل ── */
                                <>
                                    <div className={"CourseDetail-enrolledBadge"}>
                                        ✅ أنت مشترك في هذا الكورس
                                    </div>
                                    <div className={"CourseDetail-enrolledProgress"}>
                                        <div className={"CourseDetail-enrolledProgressRow"}>
                                            <span>تقدمك</span>
                                            <span>{enrollment.progress ?? 0}%</span>
                                        </div>
                                        <div className={"CourseDetail-progressTrack"}>
                                            <div
                                                className={"CourseDetail-progressFill"}
                                                style={{ width: `${enrollment.progress ?? 0}%` }}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        className={"CourseDetail-continueBtn"}
                                        onClick={() => {
                                            const allLessons = sections?.flatMap(s => s.lessons ?? []) ?? [];
                                            const firstLesson = allLessons[0];
                                            if (firstLesson) {
                                                router.push(`/learn/${course.id}/${firstLesson.id}`);
                                            }
                                        }}
                                    >
                                        {enrollment.progress > 0 ? "▶ متابعة الكورس" : "▶ ابدأ الكورس"}
                                    </button>
                                    <div className={"CourseDetail-features"}>
                                        {["✅ وصول مدى الحياة", "📱 متاح على كل الأجهزة", "🏆 شهادة إتمام", "💬 دعم مباشر من المدرس"].map(f => (
                                            <div key={f} className={"CourseDetail-feature"}>{f}</div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                /* ── غير مشترك ── */
                                <>
                                    <div className={"CourseDetail-priceRow"}>
                                        <span className={"CourseDetail-price"}>{finalPrice} ج.م</span>
                                        {(course.old_price || promoSuccess) && (
                                            <span className={"CourseDetail-oldPrice"}>{course.price} ج.م</span>
                                        )}
                                        {promoSuccess && (
                                            <span className={"CourseDetail-discount"}>خصم {promoSuccess.discount}%</span>
                                        )}
                                    </div>

                                    <div className={"CourseDetail-promoWrap"}>
                                        <div className={"CourseDetail-promoRow"}>
                                            <input
                                                className={"CourseDetail-promoInput"}
                                                placeholder="كود الخصم..."
                                                value={promoCode}
                                                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                                disabled={Boolean(promoSuccess)}
                                            />
                                            <button
                                                className={"CourseDetail-promoBtn"}
                                                onClick={handleApplyPromo}
                                                disabled={promoLoading || Boolean(promoSuccess)}
                                            >
                                                {promoLoading ? "..." : promoSuccess ? "✓" : "تطبيق"}
                                            </button>
                                        </div>
                                        {promoError && <div className={"CourseDetail-promoError"}>{promoError}</div>}
                                        {promoSuccess && (
                                            <div className={"CourseDetail-promoSuccess"}>
                                                🎉 خصم {promoSuccess.discount}% تم تطبيقه!
                                            </div>
                                        )}
                                    </div>

                                    <button className={"CourseDetail-enrollBtn"} onClick={handleEnroll}>
                                        {promoSuccess
                                            ? `متابعة — ${finalPrice} ج.م 🎉`
                                            : `سجّل الآن — ${finalPrice} ج.م`}
                                    </button>

                                    <button
                                        className={"CourseDetail-previewBtn"}
                                        onClick={() => {
                                            const allLessons = sections?.flatMap(s => s.lessons ?? []) ?? [];
                                            const firstLesson = allLessons[0];
                                            if (firstLesson) {
                                                router.push(`/learn/${course.id}/${firstLesson.id}`);
                                            }
                                        }}
                                    >
                                        👀 مشاهدة بعض الدروس مجاناً
                                    </button>

                                    <div className={"CourseDetail-features"}>
                                        {["✅ وصول مدى الحياة", "📱 متاح على كل الأجهزة", "🏆 شهادة إتمام", "💬 دعم مباشر من المدرس"].map(f => (
                                            <div key={f} className={"CourseDetail-feature"}>{f}</div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={"CourseDetail-content"}>
                <div className={"CourseDetail-section"}>
                    <h2 className={"CourseDetail-sectionTitle"}>محتوى الكورس</h2>
                    <div className={"CourseDetail-curriculumMeta"}>
                        {sections.length} أقسام · {totalLessons} درس
                    </div>
                    {sections.length === 0 ? (
                        <div className={"CourseDetail-emptySection"}>المحتوى قيد الإضافة قريباً...</div>
                    ) : (
                        sections.map((sec, i) => (
                            <div key={sec.id} className={"CourseDetail-sectionItem"}>
                                <div
                                    className={"CourseDetail-sectionHeader"}
                                    onClick={() => setOpenSection(openSection === i ? -1 : i)}
                                >
                                    <span>{openSection === i ? "▲" : "▼"}</span>
                                    <span className={"CourseDetail-sectionName"}>{sec.title}</span>
                                    <span className={"CourseDetail-sectionCount"}>{sec.lessons?.length} دروس</span>
                                </div>
                                {openSection === i && (
                                    <div className={"CourseDetail-lessons"}>
                                        {sec.lessons?.map(lesson => (
                                            <div key={lesson.id} className={"CourseDetail-lessonRow"}>
                                                <span>{lesson.type === "video" ? "▶" : "📄"}</span>
                                                <span className={"CourseDetail-lessonName"}>{lesson.title}</span>
                                                <span className={"CourseDetail-lessonDur"}>{lesson.duration}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {reviews.length > 0 ? (
                    <div className={"CourseDetail-section"}>
                        <h2 className={"CourseDetail-sectionTitle"}>تقييمات الطلاب</h2>
                        {reviews.map(r => (
                            <div key={r.id} className={"CourseDetail-reviewItem"}>
                                <div className={"CourseDetail-reviewAvatar"}>{r.profiles?.name?.[0] ?? "ط"}</div>
                                <div>
                                    <div className={"CourseDetail-reviewName"}>{r.profiles?.name}</div>
                                    <div className={"CourseDetail-reviewStars"}>{"★".repeat(r.rating)}</div>
                                    <div className={"CourseDetail-reviewText"}>{r.comment}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={"CourseDetail-section"}>
                        <h2 className={"CourseDetail-sectionTitle"}>تقييمات الطلاب</h2>
                        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>لا توجد تقييمات حتى الآن. كن أول من يقيّم الكورس!</p>
                    </div>
                )}
                
                {(enrollment || isAdmin) && (
                    <div className={"CourseDetail-section"} style={{ marginTop: "40px" }}>
                        <ReviewForm 
                            targetType="course" 
                            targetId={course.id} 
                            onSuccess={() => router.refresh()} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}