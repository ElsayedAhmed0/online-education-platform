"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";


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
        <div className={"CoursePlayer-page"}>
            {/* Top bar */}
            <div className={"CoursePlayer-topbar"}>
                <button className={"CoursePlayer-backBtn"} onClick={() => router.push("/dashboard")}>
                    ← الداشبورد
                </button>
                <div className={"CoursePlayer-topbarTitle"}>{course.title}</div>
                <div className={"CoursePlayer-topbarProgress"}>
                    <div className={"CoursePlayer-progressTrack"}>
                        <div
                            className={"CoursePlayer-progressFill"}
                            style={{ width: `${enrollment.progress}%` }}
                        />
                    </div>
                    <span>{enrollment.progress}%</span>
                </div>
            </div>

            <div className={"CoursePlayer-layout"}>
                {/* Video area */}
                <div className={"CoursePlayer-videoArea"}>
                    {/* Video placeholder */}
                    <div className={"CoursePlayer-videoPlayer"}>
                        {currentLesson?.video_url ? (
                            <iframe
                                src={currentLesson.video_url}
                                allowFullScreen
                                className={"CoursePlayer-iframe"}
                            />
                        ) : (
                            <div className={"CoursePlayer-videoPlaceholder"}>
                                <div className={"CoursePlayer-playIcon"}>▶</div>
                                <div>{currentLesson?.title ?? "اختر درساً"}</div>
                            </div>
                        )}
                    </div>

                    {/* Lesson info */}
                    <div className={"CoursePlayer-lessonInfo"}>
                        <h2 className={"CoursePlayer-lessonTitle"}>{currentLesson?.title}</h2>
                        <div className={"CoursePlayer-lessonActions"}>
                            <div className={"CoursePlayer-navBtns"}>
                                <button
                                    className={"CoursePlayer-navBtn"}
                                    onClick={() => prevLesson && goToLesson(prevLesson)}
                                    disabled={!prevLesson}
                                >← السابق</button>
                                <button
                                    className={"CoursePlayer-navBtn"}
                                    onClick={() => nextLesson && goToLesson(nextLesson)}
                                    disabled={!nextLesson}
                                >التالي ←</button>
                            </div>
                            <button
                                className={`${"CoursePlayer-completeBtn"} ${completed.has(currentLesson?.id) ? "CoursePlayer-completedBtn" : ""}`}
                                onClick={markComplete}
                                disabled={completed.has(currentLesson?.id)}
                            >
                                {completed.has(currentLesson?.id) ? "✅ مكتمل" : "أنهيت هذا الدرس ✓"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className={`${"CoursePlayer-sidebar"} ${!sidebarOpen ? "CoursePlayer-sidebarHidden" : ""}`}>
                    <div className={"CoursePlayer-sidebarHead"}>
                        <span>محتوى الكورس</span>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className={"CoursePlayer-toggleBtn"}>
                            {sidebarOpen ? "◀" : "▶"}
                        </button>
                    </div>

                    <div className={"CoursePlayer-sectionsList"}>
                        {sections.map(sec => (
                            <div key={sec.id} className={"CoursePlayer-section"}>
                                <div className={"CoursePlayer-sectionTitle"}>{sec.title}</div>
                                {sec.lessons?.map(lesson => (
                                    <div
                                        key={lesson.id}
                                        className={`${"CoursePlayer-lessonRow"} ${lesson.id === currentLesson?.id ? "CoursePlayer-lessonActive" : ""} ${completed.has(lesson.id) ? "CoursePlayer-lessonDone" : ""}`}
                                        onClick={() => goToLesson(lesson)}
                                    >
                                        <span className={"CoursePlayer-lessonCheck"}>
                                            {completed.has(lesson.id) ? "✅" : "○"}
                                        </span>
                                        <span className={"CoursePlayer-lessonName"}>{lesson.title}</span>
                                        <span className={"CoursePlayer-lessonDur"}>{lesson.duration}</span>
                                    </div>
                                ))}
                            </div>
                        ))}

                        {sections.length === 0 && (
                            <div className={"CoursePlayer-emptyLessons"}>
                                المحتوى قيد الإضافة...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}