"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./CoursesGrid.module.scss";

const CATEGORIES = ["الكل", "برمجة", "تصميم", "ذكاء اصطناعي", "تسويق", "إدارة"];

const LEVELS = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
    all: "الكل",
};

function CourseCard({ course }) {
    return (
        <Link href={`/courses/${course.id}`} className={styles.card}>
            <div className={styles.thumbnail}>
                <img src={course.thumbnail} alt={course.title} />
                <div className={styles.category}>{course.category}</div>
            </div>
            <div className={styles.body}>
                <div className={styles.level}>{LEVELS[course.level] ?? course.level}</div>
                <h3 className={styles.title}>{course.title}</h3>
                <div className={styles.instructor}>
                    👤 {course.profiles?.name ?? "مدرس"}
                </div>
                <div className={styles.meta}>
                    <span className={styles.rating}>★ {course.rating}</span>
                    <span className={styles.students}>
                        {course.students_count?.toLocaleString()} طالب
                    </span>
                </div>
                <div className={styles.footer}>
                    <div className={styles.price}>
                        <span className={styles.currentPrice}>{course.price} ج.م</span>
                        {course.old_price && (
                            <span className={styles.oldPrice}>{course.old_price} ج.م</span>
                        )}
                    </div>
                    <div className={styles.enrollBtn}>سجّل الآن</div>
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
        <div className={styles.page}>
            {/* Hero */}
            <div className={styles.hero}>
                <h1>اكتشف <span>أفضل الكورسات</span> العربية</h1>
                <p>تعلّم من أفضل الخبراء واحصل على شهادات معتمدة تفتح لك أبواب الفرص</p>

                {/* Search */}
                <div className={styles.searchBar}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        placeholder="ابحث عن كورس..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories */}
            <div className={styles.categories}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={`${styles.catBtn} ${activeCategory === cat ? styles.catActive : ""}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Results count */}
            <div className={styles.resultsBar}>
                <span>{filtered.length} كورس</span>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className={styles.empty}>
                    <div>🔍</div>
                    <p>لا توجد كورسات تطابق بحثك</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {filtered.map(course => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            )}
        </div>
    );
}