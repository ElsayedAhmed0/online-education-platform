"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
    { label: "برمجة", icon: "💻", color: "#6366F1" },
    { label: "تصميم", icon: "🎨", color: "#EC4899" },
    { label: "ذكاء اصطناعي", icon: "🤖", color: "#8B5CF6" },
    { label: "تسويق", icon: "📈", color: "#F59E0B" },
    { label: "إدارة", icon: "🏢", color: "#10B981" },
    { label: "لغات", icon: "🌍", color: "#3B82F6" },
    { label: "مالية", icon: "💰", color: "#FBBF24" },
    { label: "فوتوغرافيا", icon: "📸", color: "#EF4444" },
];

const LEVELS = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
};

/* ── Course Card ── */
function CourseCard({ course }) {
    return (
        <Link href={`/courses/${course.id}`} className="courseCard">
            <div className="courseThumb">
                <img src={course.thumbnail} alt={course.title} />
                <div className="courseCategory">{course.category}</div>
                {course.old_price && (
                    <div className="courseSale">
                        خصم {Math.round((1 - course.price / course.old_price) * 100)}%
                    </div>
                )}
            </div>
            <div className="courseBody">
                <div className="courseLevel">{LEVELS[course.level] ?? course.level}</div>
                <h3 className="courseTitle">{course.title}</h3>
                <div className="courseInstructor">👤 {course.profiles?.name}</div>
                <div className="courseMeta">
                    <span className="courseRating">★ {course.rating}</span>
                    <span className="courseStudents">{course.students_count?.toLocaleString()} طالب</span>
                </div>
                <div className="courseFooter">
                    <div className="coursePrices">
                        <span className="coursePrice">{course.price} ج.م</span>
                        {course.old_price && <span className="courseOldPrice">{course.old_price} ج.م</span>}
                    </div>
                    <div className="courseEnrollBtn">سجّل الآن</div>
                </div>
            </div>
        </Link>
    );
}

/* ── Main ── */
export default function LandingPage({ courses, hero, testimonials, cta }) {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState("الكل");
    const [search, setSearch] = useState("");
    const [activeTestimonial, setActiveTestimonial] = useState(0);

    const filtered = courses.filter(c => {
        if (activeCategory !== "الكل" && c.category !== activeCategory) return false;
        if (search && !c.title.includes(search)) return false;
        return true;
    });

    return (
        <div className="page">

            {/* ══ HERO ══ */}
            <section className="hero">
                <div className="heroGlow" />
                <div className="container">
                    <div className="heroBadge">🚀 منصة التعلم العربية الأولى</div>
                    <h1 className="heroTitle">
                        {hero.title ?? "تعلّم واحترف في"}
                        <br />
                        <span className="heroHighlight">
                            {hero.highlight ?? "أي مجال تحب"}
                        </span>
                    </h1>
                    <p className="heroSubtitle">
                        {hero.subtitle ?? "منصة تعليمية عربية متكاملة — كورسات احترافية بشهادات معتمدة"}
                    </p>

                    {/* Search */}
                    <div className="heroSearch">
                        <span className="heroSearchIcon">🔍</span>
                        <input
                            placeholder="ابحث عن كورس..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <button onClick={() => { }}>بحث</button>
                    </div>

                    {/* CTAs */}
                    <div className="heroCtas">
                        <Link href="/courses" className="ctaPrimary">
                            {hero.cta_primary ?? "ابدأ الآن مجاناً"}
                        </Link>
                        <Link href="/welcome" className="ctaSecondary">
                            {hero.cta_secondary ?? "شاهد كيف تعمل"} ▶
                        </Link>
                    </div>

                    {/* Stats */}
                    {hero.stats && (
                        <div className="heroStats">
                            {hero.stats.map((s, i) => (
                                <div key={i} className="heroStat">
                                    <strong>{s.value}</strong>
                                    <span>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ══ CATEGORIES ══ */}
            <section className="categoriesSection">
                <div className="container">
                    <div className="sectionHead">
                        <h2 className="sectionTitle">كل المجالات في مكان واحد</h2>
                        <p className="sectionSub">من البرمجة إلى التصميم — إلام مسارك وابدأ رحلتك الآن</p>
                    </div>
                    <div className="categoriesGrid">
                        {CATEGORIES.map(cat => (
                            <div
                                key={cat.label}
                                className={`categoryCard${activeCategory === cat.label ? " categoryActive" : ""}`}
                                onClick={() => setActiveCategory(activeCategory === cat.label ? "الكل" : cat.label)}
                                style={{ "--cat-color": cat.color }}
                            >
                                <div className="categoryIcon">{cat.icon}</div>
                                <div className="categoryLabel">{cat.label}</div>
                                <div className="categoryCount">
                                    {courses.filter(c => c.category === cat.label).length} كورس
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ COURSES ══ */}
            <section className="coursesSection">
                <div className="container">
                    <div className="sectionHead">
                        <h2 className="sectionTitle">
                            {activeCategory === "الكل" ? "ابدأ رحلتك الآن" : `كورسات ${activeCategory}`}
                        </h2>
                        <p className="sectionSub">{filtered.length} كورس متاح</p>
                    </div>

                    {/* Filter tabs */}
                    <div className="filterTabs">
                        {["الكل", ...CATEGORIES.map(c => c.label)].map(cat => (
                            <button
                                key={cat}
                                className={`filterTab${activeCategory === cat ? " filterTabActive" : ""}`}
                                onClick={() => setActiveCategory(cat)}
                            >{cat}</button>
                        ))}
                    </div>

                    {filtered.length === 0 ? (
                        <div className="empty">
                            <div>🔍</div>
                            <p>لا توجد كورسات في هذا المجال بعد</p>
                        </div>
                    ) : (
                        <div className="coursesGrid">
                            {filtered.slice(0, 6).map(c => <CourseCard key={c.id} course={c} />)}
                        </div>
                    )}

                    {courses.length > 6 && (
                        <div className="viewAllWrap">
                            <button
                                className="viewAllBtn"
                                onClick={() => setActiveCategory("الكل")}
                            >عرض كل الكورسات ←</button>
                        </div>
                    )}
                </div>
            </section>

            {/* ══ TESTIMONIALS ══ */}
            {testimonials.length > 0 && (
                <section className="testimonialsSection">
                    <div className="container">
                        <div className="sectionHead">
                            <h2 className="sectionTitle">قالوا عن المنصة إيه؟</h2>
                        </div>
                        <div className="testimonialCard">
                            <div className="testimonialStars">
                                {"★".repeat(testimonials[activeTestimonial]?.rating ?? 5)}
                            </div>
                            <p className="testimonialText">
                                "{testimonials[activeTestimonial]?.text}"
                            </p>
                            <div className="testimonialAuthor">
                                <div className="testimonialAvatar">
                                    {testimonials[activeTestimonial]?.avatar}
                                </div>
                                <div>
                                    <div className="testimonialName">
                                        {testimonials[activeTestimonial]?.name}
                                    </div>
                                    <div className="testimonialRole">
                                        {testimonials[activeTestimonial]?.role}
                                    </div>
                                </div>
                            </div>
                            <div className="testimonialDots">
                                {testimonials.map((_, i) => (
                                    <button
                                        key={i}
                                        className={`dot${i === activeTestimonial ? " dotActive" : ""}`}
                                        onClick={() => setActiveTestimonial(i)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ══ CTA ══ */}
            <section className="ctaSection">
                <div className="container">
                    <div className="ctaCard">
                        <div className="ctaIcon">🚀</div>
                        <h2 className="ctaTitle">{cta.title ?? "ابدأ رحلتك التعليمية اليوم"}</h2>
                        <p className="ctaSubtitle">{cta.subtitle}</p>
                        {cta.features && (
                            <div className="ctaFeatures">
                                {cta.features.map((f, i) => (
                                    <span key={i} className="ctaFeature">✓ {f}</span>
                                ))}
                            </div>
                        )}
                        <div className="ctaBtns">
                            <Link href="/register" className="ctaPrimary">
                                {cta.cta_primary ?? "سجل الآن مجاناً"}
                            </Link>
                            <Link href="/" className="ctaSecondary">
                                {cta.cta_secondary ?? "تصفح الكورسات"} ←
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ FOOTER ══ */}
            <footer className="footer">
                <div className="container">
                    <div className="footerGrid">
                        <div>
                            <div className="footerLogo">
                                <div className="footerLogoIcon">E</div>
                                <span>Edu<span>Platform</span></span>
                            </div>
                            <p className="footerDesc">
                                منصة تعليمية عربية متكاملة تجمع أفضل المدرسين والطلاب في مكان واحد
                            </p>
                        </div>
                        <div>
                            <div className="footerTitle">المنصة</div>
                            {[["الكورسات", "/"], ["المدرسون", "/instructors"], ["من نحن", "/about"]].map(([l, h]) => (
                                <Link key={l} href={h} className="footerLink">{l}</Link>
                            ))}
                        </div>
                        <div>
                            <div className="footerTitle">الكورسات</div>
                            {CATEGORIES.slice(0, 4).map(c => (
                                <div
                                    key={c.label}
                                    className="footerLink"
                                    onClick={() => setActiveCategory(c.label)}
                                    style={{ cursor: "pointer" }}
                                >{c.label}</div>
                            ))}
                        </div>
                        <div>
                            <div className="footerTitle">الدعم</div>
                            {[["مركز المساعدة", "#"], ["سياسة الخصوصية", "#"], ["الشروط والأحكام", "#"]].map(([l, h]) => (
                                <Link key={l} href={h} className="footerLink">{l}</Link>
                            ))}
                        </div>
                    </div>
                    <div className="footerBottom">
                        <span>© 2025 EduPlatform — جميع الحقوق محفوظة</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}