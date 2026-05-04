"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

function getEmbedUrl(url) {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
}

export default function CoursePlayerClient({
    course, sections, lessonId, enrollment, progress, userId
}) {
    const router = useRouter();
    const supabase = createClient();

    const allLessons = sections.flatMap(s => s.lessons ?? []);
    const currentLesson = allLessons.find(l => String(l.id) === String(lessonId)) ?? allLessons[0];
    const completedIds = new Set((progress || []).filter(p => p.completed).map(p => p.lesson_id));

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [completed, setCompleted] = useState(completedIds);
    const [enrollProgress, setEnrollProgress] = useState(enrollment?.progress || 0);
    const [showLockModal, setShowLockModal] = useState(false);

    const currentIndex = allLessons.findIndex(l => String(l.id) === String(lessonId));
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
    const embedUrl = getEmbedUrl(currentLesson?.video_url);

    const markComplete = async () => {
        if (!userId) { router.push("/login"); return; }
        if (!currentLesson || completed.has(currentLesson.id) || !enrollment) return;

        await supabase.from("lesson_progress").upsert({
            user_id: userId,
            lesson_id: currentLesson.id,
            completed: true,
            watched_at: new Date().toISOString(),
        });

        const newCompleted = new Set([...completed, currentLesson.id]);
        setCompleted(newCompleted);

        const pct = Math.round((newCompleted.size / allLessons.length) * 100);
        setEnrollProgress(pct);

        await supabase.from("enrollments")
            .update({ progress: pct })
            .eq("user_id", userId)
            .eq("course_id", course.id);
    };

    const goToLesson = (lesson) => {
        router.push(`/learn/${course.id}/${lesson.id}`);
    };

    return (
        <div className={"CoursePlayer-page"}>
            {/* Topbar */}
            <div className={"CoursePlayer-topbar"}>
                <button className={"CoursePlayer-backBtn"} onClick={() => router.push("/dashboard")}>
                    ← الداشبورد
                </button>
                <div className={"CoursePlayer-topbarTitle"}>{course.title}</div>
                <div className={"CoursePlayer-topbarProgress"}>
                    <div className={"CoursePlayer-progressTrack"}>
                        <div className={"CoursePlayer-progressFill"} style={{ width: `${enrollProgress}%` }} />
                    </div>
                    <span>{enrollProgress}%</span>
                </div>
            </div>

            <div className={"CoursePlayer-layout"}>
                {/* Video Area */}
                <div className={"CoursePlayer-videoArea"}>
                    <div className={"CoursePlayer-videoPlayer"}>
                        {embedUrl ? (
                            <iframe
                                key={embedUrl}
                                src={embedUrl}
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                className={"CoursePlayer-iframe"}
                            />
                        ) : (
                            <div className={"CoursePlayer-videoPlaceholder"}>
                                <div className={"CoursePlayer-playIcon"}>▶</div>
                                <div>اختر درساً من القائمة</div>
                            </div>
                        )}
                    </div>

                    {/* Lesson Info */}
                    <div className={"CoursePlayer-lessonInfo"}>
                        <h2 className={"CoursePlayer-lessonTitle"}>
                            {currentLesson?.title ?? "اختر درساً"}
                        </h2>
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
                                {completed.has(currentLesson?.id) ? "✅ مكتمل" : "✓ أنهيت هذا الدرس"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className={`${"CoursePlayer-sidebar"} ${!sidebarOpen ? "CoursePlayer-sidebarHidden" : ""}`}>
                    <div className={"CoursePlayer-sidebarHead"}>
                        <span>📋 محتوى الكورس</span>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className={"CoursePlayer-toggleBtn"}>
                            {sidebarOpen ? "◀" : "▶"}
                        </button>
                    </div>

                    <div className={"CoursePlayer-playlistProgress"}>
                        <span>{completed.size} / {allLessons.length} درس</span>
                        <div className={"CoursePlayer-playlistTrack"}>
                            <div className={"CoursePlayer-playlistFill"} style={{ width: `${enrollProgress}%` }} />
                        </div>
                    </div>

                    <div className={"CoursePlayer-sectionsList"}>
                        {sections.map((sec, secIdx) => (
                            <div key={sec.id} className={"CoursePlayer-section"}>
                                <div className={"CoursePlayer-sectionHeader"}>
                                    <span className={"CoursePlayer-sectionNum"}>القسم {secIdx + 1}</span>
                                    <span className={"CoursePlayer-sectionTitle"}>{sec.title}</span>
                                    <span className={"CoursePlayer-sectionCount"}>
                                        {sec.lessons?.filter(l => completed.has(l.id)).length}/{sec.lessons?.length}
                                    </span>
                                </div>

                                {sec.lessons?.map((lesson) => {
                                    const globalIdx = allLessons.findIndex(l => String(l.id) === String(lesson.id));
                                    const lessonLocked = globalIdx >= 3 && !enrollment;

                                    return (
                                        <div
                                            key={lesson.id}
                                            className={`${"CoursePlayer-lessonRow"} 
                                                ${lesson.id === currentLesson?.id ? "CoursePlayer-lessonActive" : ""} 
                                                ${completed.has(lesson.id) ? "CoursePlayer-lessonDone" : ""}`}
                                            onClick={() => {
                                                if (lessonLocked) {
                                                    setShowLockModal(true);
                                                    return;
                                                }
                                                goToLesson(lesson);
                                            }}
                                            style={{
                                                cursor: lessonLocked ? "not-allowed" : "pointer",
                                                opacity: lessonLocked ? 0.5 : 1
                                            }}
                                        >
                                            <span className={"CoursePlayer-lessonCheck"}>
                                                {lessonLocked ? "🔒" : completed.has(lesson.id) ? "✅" : "○"}
                                            </span>
                                            <div className={"CoursePlayer-lessonInfo2"}>
                                                <span className={"CoursePlayer-lessonName"}>{lesson.title}</span>
                                                <span className={"CoursePlayer-lessonMeta"}>
                                                    {lesson.type === "video" ? "🎬" : lesson.type === "document" ? "📄" : "📝"}
                                                    {lesson.duration && ` ${lesson.duration}`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}

                        {sections.length === 0 && (
                            <div className={"CoursePlayer-emptyLessons"}>
                                📭 المحتوى قيد الإضافة...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lock Modal */}
            {showLockModal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 1000,
                }}>
                    <div style={{
                        background: "#1e1b4b", borderRadius: "16px", padding: "32px",
                        textAlign: "center", maxWidth: "360px", width: "90%",
                        border: "1px solid rgba(129,140,248,0.3)",
                    }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
                        <h2 style={{ color: "#fff", marginBottom: "8px" }}>الدرس مقفول</h2>
                        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "24px" }}>
                            اشترك في الكورس للوصول لجميع الدروس
                        </p>
                        <button
                           onClick={() => router.push(`/checkout/${course.id}`)}
                            style={{
                                background: "#818CF8", color: "#fff", border: "none",
                                borderRadius: "8px", padding: "12px 24px", cursor: "pointer",
                                fontSize: "15px", fontWeight: 700, width: "100%",
                                marginBottom: "8px",
                            }}
                        >
                            🎓 اشترك الآن
                        </button>
                        <button
                            onClick={() => setShowLockModal(false)}
                            style={{
                                background: "transparent", color: "rgba(255,255,255,0.5)",
                                border: "none", cursor: "pointer", fontSize: "14px",
                            }}
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}