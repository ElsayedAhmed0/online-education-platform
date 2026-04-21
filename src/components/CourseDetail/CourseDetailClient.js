"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./CourseDetail.module.scss";

const LEVELS = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
};

export default function CourseDetailClient({ course, sections, reviews }) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [openSection, setOpenSection] = useState(0);

    const totalLessons = sections.reduce((sum, s) => sum + (s.lessons?.length ?? 0), 0);

    const handleEnroll = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push("/login");
            return;
        }

        const { error } = await supabase
            .from("enrollments")
            .insert({ user_id: user.id, course_id: course.id });

        if (!error) {
            router.push(`/learn/${course.id}/1`);
        }
        setLoading(false);
    };

    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <div className={styles.heroContent}>

                    {/* Right — Purchase card */}
                    <div className={styles.purchaseCard}>
                        <img src={course.thumbnail} alt={course.title} className={styles.thumbnail} />
                        <div className={styles.cardBody}>
                            <div className={styles.priceRow}>
                                <span className={styles.price}>{course.price} ج.م</span>
                                {course.old_price && (
                                    <span className={styles.oldPrice}>{course.old_price} ج.م</span>
                                )}
                                {course.old_price && (
                                    <span className={styles.discount}>
                                        خصم {Math.round((1 - course.price / course.old_price) * 100)}%
                                    </span>
                                )}
                            </div>
                            <button
                                className={styles.enrollBtn}
                                onClick={handleEnroll}
                                disabled={loading}
                            >
                                {loading ? "جاري التسجيل..." : "سجّل الآن"}
                            </button>
                            <div className={styles.features}>
                                {[
                                    "✅ وصول مدى الحياة",
                                    "📱 متاح على كل الأجهزة",
                                    "🏆 شهادة إتمام",
                                    "💬 دعم مباشر من المدرس",
                                ].map(f => (
                                    <div key={f} className={styles.feature}>{f}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Left — Info */}
                    <div>
                        <div className={styles.breadcrumb}>
                            <span onClick={() => router.push("/")} style={{ cursor: "pointer" }}>الكورسات</span>
                            <span>←</span>
                            <span>{course.category}</span>
                        </div>
                        <h1 className={styles.title}>{course.title}</h1>
                        <p className={styles.desc}>{course.description}</p>
                        <div className={styles.meta}>
                            <span className={styles.rating}>★ {course.rating}</span>
                            <span className={styles.students}>{course.students_count?.toLocaleString()} طالب</span>
                            <span className={styles.level}>{LEVELS[course.level] ?? course.level}</span>
                        </div>
                        <div className={styles.instructor}>
                            <div className={styles.instructorAvatar}>
                                {course.profiles?.name?.[0] ?? "م"}
                            </div>
                            <span>المدرس: <strong>{course.profiles?.name}</strong></span>
                        </div>
                    </div>



                </div>
            </div>

            {/* Content */}
            <div className={styles.content}>
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>محتوى الكورس</h2>
                    <div className={styles.curriculumMeta}>
                        {sections.length} أقسام · {totalLessons} درس
                    </div>
                    {sections.length === 0 ? (
                        <div className={styles.emptySection}>المحتوى قيد الإضافة قريباً...</div>
                    ) : (
                        sections.map((sec, i) => (
                            <div key={sec.id} className={styles.sectionItem}>
                                <div
                                    className={styles.sectionHeader}
                                    onClick={() => setOpenSection(openSection === i ? -1 : i)}
                                >
                                    <span>{openSection === i ? "▲" : "▼"}</span>
                                    <span className={styles.sectionName}>{sec.title}</span>
                                    <span className={styles.sectionCount}>{sec.lessons?.length} دروس</span>
                                </div>
                                {openSection === i && (
                                    <div className={styles.lessons}>
                                        {sec.lessons?.map(lesson => (
                                            <div key={lesson.id} className={styles.lessonRow}>
                                                <span>{lesson.type === "video" ? "▶" : "📄"}</span>
                                                <span className={styles.lessonName}>{lesson.title}</span>
                                                <span className={styles.lessonDur}>{lesson.duration}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {reviews.length > 0 && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>تقييمات الطلاب</h2>
                        {reviews.map(r => (
                            <div key={r.id} className={styles.reviewItem}>
                                <div className={styles.reviewAvatar}>
                                    {r.profiles?.name?.[0] ?? "ط"}
                                </div>
                                <div>
                                    <div className={styles.reviewName}>{r.profiles?.name}</div>
                                    <div className={styles.reviewStars}>{"★".repeat(r.rating)}</div>
                                    <div className={styles.reviewText}>{r.comment}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}