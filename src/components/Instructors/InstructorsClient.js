"use client";
import { useState } from "react";
import Link from "next/link";

export default function InstructorsClient({ instructors }) {
    const [search, setSearch] = useState("");

    const filtered = instructors.filter((ins) =>
        ins.name?.toLowerCase().includes(search.toLowerCase()) ||
        ins.specialization?.toLowerCase().includes(search.toLowerCase()) ||
        ins.bio?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="InstructorsPage-page">
            {/* Hero */}
            <div className="InstructorsPage-hero">
                <div className="InstructorsPage-heroBg" />
                <div className="InstructorsPage-heroContent">
                    <div className="InstructorsPage-heroTag">👨‍🏫 فريق التدريس</div>
                    <h1 className="InstructorsPage-heroTitle">
                        تعرف على <span>مدرسينا</span>
                    </h1>
                    <p className="InstructorsPage-heroDesc">
                        نخبة من أفضل الخبراء والمتخصصين في مجالاتهم، مستعدون لمساعدتك في رحلتك التعليمية
                    </p>
                    {/* Search */}
                    <div className="InstructorsPage-searchWrap">
                        <span className="InstructorsPage-searchIcon">🔍</span>
                        <input
                            type="text"
                            placeholder="ابحث عن مدرس..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="InstructorsPage-searchInput"
                        />
                        {search && (
                            <button
                                className="InstructorsPage-searchClear"
                                onClick={() => setSearch("")}
                            >✕</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="InstructorsPage-container">
                {/* Stats bar */}
                <div className="InstructorsPage-statsBar">
                    <div className="InstructorsPage-stat">
                        <span className="InstructorsPage-statNum">{instructors.length}</span>
                        <span className="InstructorsPage-statLabel">مدرس متخصص</span>
                    </div>
                    <div className="InstructorsPage-statDivider" />
                    <div className="InstructorsPage-stat">
                        <span className="InstructorsPage-statNum">
                            {instructors.reduce((sum, i) => sum + i.coursesCount, 0)}
                        </span>
                        <span className="InstructorsPage-statLabel">كورس منشور</span>
                    </div>
                    <div className="InstructorsPage-statDivider" />
                    <div className="InstructorsPage-stat">
                        <span className="InstructorsPage-statNum">
                            {instructors.reduce((sum, i) => sum + i.studentsCount, 0).toLocaleString()}
                        </span>
                        <span className="InstructorsPage-statLabel">طالب مسجل</span>
                    </div>
                </div>

                {/* Results count */}
                {search && (
                    <p className="InstructorsPage-resultsLabel">
                        {filtered.length > 0
                            ? `تم العثور على ${filtered.length} نتيجة`
                            : "لا توجد نتائج مطابقة"}
                    </p>
                )}

                {/* Grid */}
                {instructors.length === 0 ? (
                    <div className="InstructorsPage-empty">
                        <span>👨‍🏫</span>
                        <p>لا يوجد مدرسون على المنصة بعد</p>
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="InstructorsPage-grid">
                        {filtered.map((instructor) => (
                            <InstructorCard key={instructor.id} instructor={instructor} />
                        ))}
                    </div>
                ) : (
                    <div className="InstructorsPage-empty">
                        <span>🔍</span>
                        <p>لا يوجد مدرسون مطابقون لبحثك</p>
                        <button onClick={() => setSearch("")} className="InstructorsPage-emptyBtn">
                            عرض الكل
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function InstructorCard({ instructor }) {
    const initials = instructor.name
        ?.split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("") ?? "M";

    return (
        <Link href={`/instructors/${instructor.id}`} className="InstructorCard-wrap">
            <div className="InstructorCard-glow" />

            {/* Avatar */}
            <div className="InstructorCard-avatarWrap">
                {instructor.avatar_url ? (
                    <img
                        src={instructor.avatar_url}
                        alt={instructor.name}
                        className="InstructorCard-avatar"
                    />
                ) : (
                    <div className="InstructorCard-avatarFallback">
                        {initials}
                    </div>
                )}
                <div className="InstructorCard-onlineDot" />
            </div>

            {/* Info */}
            <div className="InstructorCard-info">
                <h3 className="InstructorCard-name">{instructor.name}</h3>
                {instructor.specialization && (
                    <span className="InstructorCard-spec">{instructor.specialization}</span>
                )}
                {instructor.bio && (
                    <p className="InstructorCard-bio">{instructor.bio}</p>
                )}
            </div>

            {/* Stats */}
            <div className="InstructorCard-stats">
                <div className="InstructorCard-statItem">
                    <span className="InstructorCard-statIcon">📚</span>
                    <span className="InstructorCard-statVal">{instructor.coursesCount}</span>
                    <span className="InstructorCard-statLbl">كورس</span>
                </div>
                <div className="InstructorCard-statDivider" />
                <div className="InstructorCard-statItem">
                    <span className="InstructorCard-statIcon">👥</span>
                    <span className="InstructorCard-statVal">{instructor.studentsCount.toLocaleString()}</span>
                    <span className="InstructorCard-statLbl">طالب</span>
                </div>
            </div>

            {/* CTA */}
            <div className="InstructorCard-cta">
                عرض الملف الشخصي
                <span className="InstructorCard-ctaArrow">←</span>
            </div>
        </Link>
    );
}
