"use client";
import Link from "next/link";

export default function AboutPageClient({ aboutData }) {
    // Fallback data
    const data = aboutData || {
        hero_title: "عن منصة إيدو بلاتفورم",
        hero_subtitle: "بوابتك نحو التميز والاحتراف في العالم الرقمي",
        description: "نحن في إيدو بلاتفورم نؤمن بأن التعليم هو المفتاح الوحيد لتطوير المجتمعات. انطلقت منصتنا لتوفير تجربة تعليمية فريدة تجمع بين المحتوى الأكاديمي الرصين والمهارات العملية التي يتطلبها سوق العمل.",
        mission: "تمكين الشباب العربي من اكتساب المهارات التقنية والمهنية اللازمة للمنافسة عالمياً من خلال محتوى تعليمي عالي الجودة وبأسعار في المتناول.",
        vision: "أن نصبح المنصة الأولى والرائدة في التعليم الرقمي في الوطن العربي، والمصدر الموثوق لكل باحث عن التميز المهني.",
        features: [
            { icon: "🎓", title: "محتوى احترافي", description: "كورسات مصممة من قبل خبراء في مجالاتهم" },
            { icon: "🛡️", title: "شهادات معتمدة", description: "احصل على شهادة إتمام عند نهاية كل كورس" },
            { icon: "💬", title: "دعم مستمر", description: "تواصل مباشر مع المدرسين لحل استفساراتك" },
        ]
    };

    return (
        <div className="page">
            {/* ══ HERO ══ */}
            <section className="about-hero hero">
                <div className="heroGlow" />
                <div className="container" style={{ textAlign: "center" }}>
                    <div className="heroBadge">📜 تعرف علينا</div>
                    <h1 className="heroTitle">
                        {data.hero_title}
                    </h1>
                    <p className="heroSubtitle">
                        {data.hero_subtitle}
                    </p>
                </div>
            </section>

            {/* ══ DESCRIPTION ══ */}
            <section className="about-content" style={{ padding: "80px 0" }}>
                <div className="container">
                    <div className="about-story-card">
                        <div className="glow-dot" />
                        
                        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
                            <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "30px", color: "var(--text-primary)" }}>قصتنا</h2>
                            <p style={{ fontSize: "1.2rem", lineHeight: "1.8", color: "rgba(255,255,255,0.7)", margin: 0 }}>
                                {data.description}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ MISSION & VISION ══ */}
            <section style={{ padding: "40px 0" }}>
                <div className="container">
                    <div className="about-mission-vision">
                        <div className="about-info-card mission">
                            <div style={{ fontSize: "2.5rem", marginBottom: "20px" }}>🎯</div>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "15px", color: "#818CF8" }}>رسالتنا</h3>
                            <p style={{ fontSize: "1.1rem", lineHeight: "1.6", color: "rgba(255,255,255,0.8)", margin: 0 }}>
                                {data.mission}
                            </p>
                        </div>

                        <div className="about-info-card vision">
                            <div style={{ fontSize: "2.5rem", marginBottom: "20px" }}>👁️‍🗨️</div>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "15px", color: "#EC4899" }}>رؤيتنا</h3>
                            <p style={{ fontSize: "1.1rem", lineHeight: "1.6", color: "rgba(255,255,255,0.8)", margin: 0 }}>
                                {data.vision}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ FEATURES ══ */}
            <section style={{ padding: "80px 0" }}>
                <div className="container">
                    <div className="sectionHead" style={{ textAlign: "center", marginBottom: "60px" }}>
                        <h2 className="sectionTitle">لماذا تختار إيدو بلاتفورم؟</h2>
                        <p className="sectionSub">نحن نركز على الجودة وتجربة المستخدم قبل كل شيء</p>
                    </div>

                    <div className="about-features-grid">
                        {data.features.map((feature, i) => (
                            <div key={i} className="about-feature-card">
                                <div className="feature-icon-box">{feature.icon}</div>
                                <h4 style={{ fontSize: "1.3rem", fontWeight: "bold", marginBottom: "12px", color: "var(--text-primary)" }}>{feature.title}</h4>
                                <p style={{ fontSize: "1rem", lineHeight: "1.6", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ CTA ══ */}
            <section className="ctaSection" style={{ paddingBottom: "100px" }}>
                <div className="container">
                    <div className="ctaCard" style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)" }}>
                        <h2 className="ctaTitle">هل أنت مستعد لبدء رحلتك؟</h2>
                        <p className="ctaSubtitle">انضم إلى آلاف الطلاب الذين غيروا مسارهم المهني معنا</p>
                        <div className="ctaBtns" style={{ marginTop: "30px" }}>
                            <Link href="/register" className="ctaPrimary" style={{ background: "#fff", color: "#4F46E5" }}>
                                اشترك الآن مجاناً
                            </Link>
                            <Link href="/#courses" className="ctaSecondary" style={{ borderColor: "#fff", color: "#fff" }}>
                                تصفح الكورسات
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
