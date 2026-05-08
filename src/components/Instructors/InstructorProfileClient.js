"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ReviewForm from "@/components/CourseDetail/ReviewForm";

const LEVEL_MAP = {
    beginner: { label: "مبتدئ", color: "var(--success)", bg: "rgba(16,185,129,.12)" },
    intermediate: { label: "متوسط", color: "var(--accent)", bg: "rgba(245,158,11,.12)" },
    advanced: { label: "متقدم", color: "var(--danger)", bg: "rgba(239,68,68,.12)" },
};

export default function InstructorProfileClient({ instructor, courses, totalStudents, reviews = [], currentUserId }) {
    const router = useRouter();
    const supabase = createClient();
    const initials = instructor.name
        ?.split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("") ?? "M";

    const joinYear = new Date(instructor.created_at).getFullYear();

    return (
        <div className="InstructorProfile-page">
            {/* Hero Banner */}
            <div className="InstructorProfile-banner">
                <div className="InstructorProfile-bannerBg" />
                <div className="InstructorProfile-bannerContent">
                    <Link href="/instructors" className="InstructorProfile-back">
                        → العودة للمدرسين
                    </Link>
                    <div className="InstructorProfile-heroCard">
                        {/* Avatar */}
                        <div className="InstructorProfile-avatarWrap">
                            {instructor.avatar_url ? (
                                <img
                                    src={instructor.avatar_url}
                                    alt={instructor.name}
                                    className="InstructorProfile-avatar"
                                />
                            ) : (
                                <div className="InstructorProfile-avatarFallback">
                                    {initials}
                                </div>
                            )}
                            <div className="InstructorProfile-avatarBadge">👨‍🏫</div>
                        </div>

                        {/* Details */}
                        <div className="InstructorProfile-heroDetails">
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                                <h1 className="InstructorProfile-name">{instructor.name}</h1>
                                {currentUserId && currentUserId !== instructor.id && (
                                    <button
                                        onClick={async () => {
                                            // ابحث عن محادثة موجودة أو انشئ جديدة
                                            const { data: existing } = await supabase
                                                .from("conversations")
                                                .select("id")
                                                .or(
                                                    `and(user1_id.eq.${currentUserId},user2_id.eq.${instructor.id}),and(user1_id.eq.${instructor.id},user2_id.eq.${currentUserId})`
                                                )
                                                .single();

                                            if (existing) {
                                                router.push(`/chat?c=${existing.id}`);
                                            } else {
                                                const { data: newConvo } = await supabase
                                                    .from("conversations")
                                                    .insert({
                                                        user1_id: currentUserId,
                                                        user2_id: instructor.id,
                                                        last_message: null,
                                                        last_message_at: new Date().toISOString(),
                                                    })
                                                    .select()
                                                    .single();
                                                if (newConvo) router.push(`/chat?c=${newConvo.id}`);
                                            }
                                        }}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "6px",
                                            background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                                            color: "#fff", border: "none",
                                            borderRadius: "var(--radius-md)",
                                            padding: "8px 18px", fontSize: "13px",
                                            fontWeight: 700, cursor: "pointer",
                                            fontFamily: "var(--font)",
                                            transition: "opacity .2s",
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                                    >
                                        💬 راسله
                                    </button>
                                )}
                            </div>
                            {instructor.specialization && (
                                <p className="InstructorProfile-spec">
                                    🎯 {instructor.specialization}
                                </p>
                            )}
                            {instructor.bio && (
                                <p className="InstructorProfile-bio">{instructor.bio}</p>
                            )}
                            <div className="InstructorProfile-metaRow">
                                <span className="InstructorProfile-metaItem">
                                    📅 منضم منذ {joinYear}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Strip */}
            <div className="InstructorProfile-statsStrip">
                <div className="InstructorProfile-stripInner">
                    <div className="InstructorProfile-stripStat">
                        <span className="InstructorProfile-stripNum">{courses.length}</span>
                        <span className="InstructorProfile-stripLabel">كورس</span>
                    </div>
                    <div className="InstructorProfile-stripDivider" />
                    <div className="InstructorProfile-stripStat">
                        <span className="InstructorProfile-stripNum">{totalStudents.toLocaleString()}</span>
                        <span className="InstructorProfile-stripLabel">طالب مسجل</span>
                    </div>
                    <div className="InstructorProfile-stripDivider" />
                    <div className="InstructorProfile-stripStat">
                        <span className="InstructorProfile-stripNum">
                            {courses.length > 0
                                ? (
                                    courses.reduce((sum, c) => sum + c.avgRating, 0) / courses.length
                                ).toFixed(1)
                                : "—"}
                        </span>
                        <span className="InstructorProfile-stripLabel">متوسط التقييم ⭐</span>
                    </div>
                </div>
            </div>

            {/* Courses Section */}
            <div className="InstructorProfile-container">
                <h2 className="InstructorProfile-sectionTitle">
                    📚 كورسات {instructor.name}
                    <span className="InstructorProfile-sectionCount">{courses.length}</span>
                </h2>

                {courses.length > 0 ? (
                    <div className="InstructorProfile-coursesGrid">
                        {courses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                ) : (
                    <div className="InstructorProfile-noCourses">
                        <span>📭</span>
                        <p>لا توجد كورسات بعد</p>
                    </div>
                )}
            </div>

            {/* Reviews Section */}
            <div className="InstructorProfile-container" style={{ marginTop: "40px" }}>
                <h2 className="InstructorProfile-sectionTitle">تقييمات الطلاب للمدرس</h2>
                
                {reviews.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
                        {reviews.map(r => (
                            <div key={r.id} style={{ background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                                        {r.profiles?.name?.[0] ?? "ط"}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: "bold" }}>{r.profiles?.name}</div>
                                        <div style={{ color: "#FBBF24", fontSize: "14px" }}>{"★".repeat(r.rating)}</div>
                                    </div>
                                </div>
                                <div style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.6" }}>{r.comment}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "40px" }}>لا توجد تقييمات حتى الآن. كن أول من يقيّم المدرس!</p>
                )}

                <ReviewForm 
                    targetType="instructor" 
                    targetId={instructor.id} 
                    onSuccess={() => {
                        window.location.reload(); // Instructor profile might need full reload or we can add useRouter if not present. Wait, useRouter isn't imported. Let me just use window.location.reload() but why wouldn't it work? Wait! I can import useRouter.
                    }} 
                />
            </div>
        </div>
    );
}

function CourseCard({ course }) {
    const lvl = LEVEL_MAP[course.level] ?? LEVEL_MAP.beginner;
    // ✅ تعديل: old_price بدل discount_price
    const hasDiscount = course.old_price && course.old_price > course.price;

    function renderStars(rating) {
        const full = Math.floor(rating);
        const half = rating - full >= 0.5;
        return (
            <span className="CourseCard-stars">
                {"★".repeat(full)}
                {half ? "½" : ""}
                {"☆".repeat(5 - full - (half ? 1 : 0))}
            </span>
        );
    }

    return (
        <Link href={`/courses/${course.id}`} className="InstructorCourseCard-wrap">
            {/* Thumbnail */}
            <div className="InstructorCourseCard-thumb">
                {/* ✅ تعديل: thumbnail بدل thumbnail_url */}
                {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} />
                ) : (
                    <div className="InstructorCourseCard-thumbFallback">📚</div>
                )}
                <div className="InstructorCourseCard-thumbOverlay" />
                {/* Level badge */}
                <span
                    className="InstructorCourseCard-level"
                    style={{ background: lvl.bg, color: lvl.color }}
                >
                    {lvl.label}
                </span>
            </div>

            {/* Body */}
            <div className="InstructorCourseCard-body">
                {course.category && (
                    <span className="InstructorCourseCard-category">{course.category}</span>
                )}
                <h3 className="InstructorCourseCard-title">{course.title}</h3>
                {course.description && (
                    <p className="InstructorCourseCard-desc">{course.description}</p>
                )}

                {/* Rating + Students */}
                <div className="InstructorCourseCard-meta">
                    <div className="InstructorCourseCard-rating">
                        {renderStars(course.avgRating)}
                        <span className="InstructorCourseCard-ratingNum">
                            {course.avgRating > 0 ? course.avgRating.toFixed(1) : "جديد"}
                        </span>
                        {course.reviewsCount > 0 && (
                            <span className="InstructorCourseCard-reviews">
                                ({course.reviewsCount})
                            </span>
                        )}
                    </div>
                    <span className="InstructorCourseCard-students">
                        👥 {course.studentsCount.toLocaleString()}
                    </span>
                </div>

                {/* Price */}
                <div className="InstructorCourseCard-footer">
                    <div className="InstructorCourseCard-price">
                        {course.price === 0 ? (
                            <span className="InstructorCourseCard-free">مجاني</span>
                        ) : hasDiscount ? (
                            <>
                                {/* ✅ تعديل: old_price بدل discount_price */}
                                <span className="InstructorCourseCard-priceOld">
                                    {course.old_price} ج.م
                                </span>
                                <span className="InstructorCourseCard-priceNew">
                                    {course.price} ج.م
                                </span>
                            </>
                        ) : (
                            <span className="InstructorCourseCard-priceNew">
                                {course.price} ج.م
                            </span>
                        )}
                    </div>
                    <span className="InstructorCourseCard-cta">عرض الكورس ←</span>
                </div>
            </div>
        </Link>
    );
}