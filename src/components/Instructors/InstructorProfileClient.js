"use client";
import Link from "next/link";

const LEVEL_MAP = {
    beginner: { label: "مبتدئ", color: "var(--success)", bg: "rgba(16,185,129,.12)" },
    intermediate: { label: "متوسط", color: "var(--accent)", bg: "rgba(245,158,11,.12)" },
    advanced: { label: "متقدم", color: "var(--danger)", bg: "rgba(239,68,68,.12)" },
};

export default function InstructorProfileClient({ instructor, courses, totalStudents }) {
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
                            <h1 className="InstructorProfile-name">{instructor.name}</h1>
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
        </div>
    );
}

function CourseCard({ course }) {
    const lvl = LEVEL_MAP[course.level] ?? LEVEL_MAP.beginner;
    const hasDiscount = course.discount_price && course.discount_price < course.price;

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
                {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} />
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
                                <span className="InstructorCourseCard-priceOld">
                                    {course.price} ج.م
                                </span>
                                <span className="InstructorCourseCard-priceNew">
                                    {course.discount_price} ج.م
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
