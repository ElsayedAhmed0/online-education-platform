"use client";
import { useState } from "react";
import Link from "next/link";


const CATEGORIES = ["الكل", "برمجة", "تصميم", "ذكاء اصطناعي", "تسويق", "إدارة"];

const LEVELS = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
    all: "الكل",
};

function CourseCard({ course }) {
    return (
        <Link href={`/courses/${course.id}`} className={"CoursesGrid-card"}>
            <div className={"CoursesGrid-thumbnail"}>
                <img src={course.thumbnail} alt={course.title} />
                <div className={"CoursesGrid-category"}>{course.category}</div>
            </div>
            <div className={"CoursesGrid-body"}>
                <div className={"CoursesGrid-level"}>{LEVELS[course.level] ?? course.level}</div>
                <h3 className={"CoursesGrid-title"}>{course.title}</h3>
                <div className={"CoursesGrid-instructor"}>
                    👤 {course.profiles?.name ?? "مدرس"}
                </div>
                <div className={"CoursesGrid-meta"}>
                    <span className={"CoursesGrid-rating"}>★ {course.rating}</span>
                    <span className={"CoursesGrid-students"}>
                        {course.students_count?.toLocaleString()} طالب
                    </span>
                </div>
                <div className={"CoursesGrid-footer"}>
                    <div className={"CoursesGrid-price"}>
                        <span className={"CoursesGrid-currentPrice"}>{course.price} ج.م</span>
                        {course.old_price && (
                            <span className={"CoursesGrid-oldPrice"}>{course.old_price} ج.م</span>
                        )}
                    </div>
                    <div className={"CoursesGrid-enrollBtn"}>سجّل الآن</div>
                </div>
            </div>
        </Link>
    );
}

export default function CoursesGrid({ courses }) {
    const [activeCategory, setActiveCategory] = useState("الكل");
    const [search, setSearch] = useState("");

    const filtered = courses.filter(c => {
        if (activeCategory !== "الكل" && c.category !== activeCategory) return false;
        if (search && !c.title.includes(search)) return false;
        return true;
    });

    return (
        <div className={"CoursesGrid-page"}>
            {/* Hero */}
            <div className={"CoursesGrid-hero"}>
                <h1>اكتشف <span>أفضل الكورسات</span> العربية</h1>
                <p>تعلّم من أفضل الخبراء واحصل على شهادات معتمدة تفتح لك أبواب الفرص</p>

                {/* Search */}
                <div className={"CoursesGrid-searchBar"}>
                    <span className={"CoursesGrid-searchIcon"}>🔍</span>
                    <input
                        placeholder="ابحث عن كورس..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories */}
            <div className={"CoursesGrid-categories"}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={`${"CoursesGrid-catBtn"} ${activeCategory === cat ? "CoursesGrid-catActive" : ""}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Results count */}
            <div className={"CoursesGrid-resultsBar"}>
                <span>{filtered.length} كورس</span>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className={"CoursesGrid-empty"}>
                    <div>🔍</div>
                    <p>لا توجد كورسات تطابق بحثك</p>
                </div>
            ) : (
                <div className={"CoursesGrid-grid"}>
                    {filtered.map(course => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            )}
        </div>
    );
}