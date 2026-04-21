"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./CoursePlayer.module.scss";

export default function CoursePlayerClient({
    course, sections, lessonId, enrollment, progress, userId
}) {
    const router = useRouter();
    const supabase = createClient();

    // جمع كل الدروس في list واحدة
    const allLessons = sections.flatMap(s => s.lessons ?? []);
    const currentLesson = allLessons.find(l => l.id === lessonId) ?? allLessons[0];
    const completedIds = new Set(progress.filter(p => p.completed).map(p => p.lesson_id));

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [completed, setCompleted] = useState(completedIds);

    const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
    const prevLesson = allLessons[currentIndex - 1];
    const nextLesson = allLessons[currentIndex + 1];

    const markComplete = async () => {
        if (!currentLesson) return;
        await supabase.from("lesson_progress").upsert({
            user_id: userId,
            lesson_id: currentLesson.id,
            completed: true,
        });
        setCompleted(prev => new Set([...prev, currentLesson.id]));

        // حدّث الـ progress في الـ enrollment
        const totalLessons = allLessons.length;
        const newCompleted = completed.size + 1;
        const pct = Math.round((newCompleted / totalLessons) * 100);
        await supabase.from("enrollments").update({ progress: pct })
            .eq("user_id", userId).eq("course_id", course.id);
    };

    const goToLesson = (lesson) => {
        router.push(`/learn/${course.id}/${lesson.id}`);
    };

    return (
        <div className={styles.page}>
            {/* Top bar */}
            <div className={styles.topbar}>
                <button className={styles.backBtn} onClick={() => router.push("/dashboard")}>
                    ← الداشبورد
                </button>
                <div className={styles.topbarTitle}>{course.title}</div>
                <div className={styles.topbarProgress}>
                    <div className={styles.progressTrack}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${enrollment.progress}%` }}
                        />
                    </div>
                    <span>{enrollment.progress}%</span>
                </div>
            </div>

            <div className={styles.layout}>
                {/* Video area */}
                <div className={styles.videoArea}>
                    {/* Video placeholder */}
                    <div className={styles.videoPlayer}>
                        {currentLesson?.video_url ? (
                            <iframe
                                src={currentLesson.video_url}
                                allowFullScreen
                                className={styles.iframe}
                            />
                        ) : (
                            <div className={styles.videoPlaceholder}>
                                <div className={styles.playIcon}>▶</div>
                                <div>{currentLesson?.title ?? "اختر درساً"}</div>
                            </div>
                        )}
                    </div>

                    {/* Lesson info */}
                    <div className={styles.lessonInfo}>
                        <h2 className={styles.lessonTitle}>{currentLesson?.title}</h2>
                        <div className={styles.lessonActions}>
                            <div className={styles.navBtns}>
                                <button
                                    className={styles.navBtn}
                                    onClick={() => prevLesson && goToLesson(prevLesson)}
                                    disabled={!prevLesson}
                                >← السابق</button>
                                <button
                                    className={styles.navBtn}
                                    onClick={() => nextLesson && goToLesson(nextLesson)}
                                    disabled={!nextLesson}
                                >التالي ←</button>
                            </div>
                            <button
                                className={`${styles.completeBtn} ${completed.has(currentLesson?.id) ? styles.completedBtn : ""}`}
                                onClick={markComplete}
                                disabled={completed.has(currentLesson?.id)}
                            >
                                {completed.has(currentLesson?.id) ? "✅ مكتمل" : "أنهيت هذا الدرس ✓"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarHidden : ""}`}>
                    <div className={styles.sidebarHead}>
                        <span>محتوى الكورس</span>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className={styles.toggleBtn}>
                            {sidebarOpen ? "◀" : "▶"}
                        </button>
                    </div>

                    <div className={styles.sectionsList}>
                        {sections.map(sec => (
                            <div key={sec.id} className={styles.section}>
                                <div className={styles.sectionTitle}>{sec.title}</div>
                                {sec.lessons?.map(lesson => (
                                    <div
                                        key={lesson.id}
                                        className={`${styles.lessonRow} ${lesson.id === currentLesson?.id ? styles.lessonActive : ""} ${completed.has(lesson.id) ? styles.lessonDone : ""}`}
                                        onClick={() => goToLesson(lesson)}
                                    >
                                        <span className={styles.lessonCheck}>
                                            {completed.has(lesson.id) ? "✅" : "○"}
                                        </span>
                                        <span className={styles.lessonName}>{lesson.title}</span>
                                        <span className={styles.lessonDur}>{lesson.duration}</span>
                                    </div>
                                ))}
                            </div>
                        ))}

                        {sections.length === 0 && (
                            <div className={styles.emptyLessons}>
                                المحتوى قيد الإضافة...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}