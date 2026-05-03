"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function CheckoutClient({ course, initialCouponId, initialDiscount, initialCode }) {
    const router = useRouter();
    const supabase = createClient();

    const [code, setCode] = useState(initialCode);
    const [couponId, setCouponId] = useState(initialCouponId);
    const [discount, setDiscount] = useState(initialDiscount);
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState("");
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [enrollError, setEnrollError] = useState("");

    const originalPrice = course.price;
    const finalPrice = discount
        ? Math.round(originalPrice * (1 - discount / 100))
        : originalPrice;

    const isFree = finalPrice === 0;

    /* ── تطبيق كوبون ── */
    const handleApplyCoupon = async () => {
        if (!code.trim()) return;
        setPromoLoading(true);
        setPromoError("");
        setCouponId(null);
        setDiscount(null);

        try {
            const res = await fetch("/api/apply-coupon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, courseId: course.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCouponId(data.couponId);
            setDiscount(data.discount);
        } catch (err) {
            setPromoError(err.message);
        } finally {
            setPromoLoading(false);
        }
    };

    /* ── تأكيد الاشتراك ── */
    const handleConfirm = async () => {
        setEnrollLoading(true);
        setEnrollError("");

        try {
            const res = await fetch("/api/enroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId: course.id,
                    couponId: couponId ?? null,
                    finalPrice,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // جيب أول lesson في الكورس
            const supabase = createClient();
            const { data: firstLesson } = await supabase
                .from("lessons")
                .select("id, section_id")
                .eq("course_id", course.id)
                .order("order_index", { ascending: true })
                .limit(1)
                .single();

            if (firstLesson) {
                router.push(`/learn/${course.id}/${firstLesson.id}`);
            } else {
                router.push(`/dashboard`);
            }

        } catch (err) {
            setEnrollError(err.message);
            setEnrollLoading(false);
        }
    };

    return (
        <div className="Checkout-page">
            <div className="Checkout-container">

                {/* Header */}
                <div className="Checkout-header">
                    <button className="Checkout-back" onClick={() => router.back()}>← رجوع</button>
                    <h1 className="Checkout-title">إتمام الاشتراك</h1>
                </div>

                <div className="Checkout-grid">

                    {/* Right — ملخص الكورس */}
                    <div className="Checkout-summary">
                        <h2 className="Checkout-sectionTitle">ملخص الطلب</h2>
                        <div className="Checkout-courseCard">
                            <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="Checkout-thumbnail"
                            />
                            <div className="Checkout-courseInfo">
                                <div className="Checkout-courseName">{course.title}</div>
                                <div className="Checkout-courseInstructor">
                                    المدرس: {course.profiles?.name}
                                </div>
                            </div>
                        </div>

                        {/* Price breakdown */}
                        <div className="Checkout-priceBox">
                            <div className="Checkout-priceRow">
                                <span>سعر الكورس</span>
                                <span>{originalPrice} ج.م</span>
                            </div>
                            {discount && (
                                <div className="Checkout-priceRow Checkout-discountRow">
                                    <span>خصم الكوبون ({discount}%)</span>
                                    <span>− {originalPrice - finalPrice} ج.م</span>
                                </div>
                            )}
                            <div className="Checkout-divider" />
                            <div className="Checkout-priceRow Checkout-totalRow">
                                <span>الإجمالي</span>
                                <span className="Checkout-totalPrice">
                                    {isFree ? "مجاناً 🎉" : `${finalPrice} ج.م`}
                                </span>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="Checkout-features">
                            {[
                                "✅ وصول مدى الحياة",
                                "📱 متاح على كل الأجهزة",
                                "🏆 شهادة إتمام",
                                "💬 دعم مباشر من المدرس",
                            ].map(f => (
                                <div key={f} className="Checkout-feature">{f}</div>
                            ))}
                        </div>
                    </div>

                    {/* Left — كوبون + تأكيد */}
                    <div className="Checkout-form">

                        {/* Coupon */}
                        <div className="Checkout-couponSection">
                            <h2 className="Checkout-sectionTitle">كود الخصم</h2>
                            <div className="Checkout-couponRow">
                                <input
                                    className="Checkout-couponInput"
                                    placeholder="أدخل كود الخصم..."
                                    value={code}
                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                    disabled={Boolean(couponId)}
                                />
                                {couponId ? (
                                    <button
                                        className="Checkout-couponRemove"
                                        onClick={() => { setCouponId(null); setDiscount(null); setCode(""); }}
                                    >✕ إزالة</button>
                                ) : (
                                    <button
                                        className="Checkout-couponApply"
                                        onClick={handleApplyCoupon}
                                        disabled={promoLoading || !code.trim()}
                                    >
                                        {promoLoading ? "..." : "تطبيق"}
                                    </button>
                                )}
                            </div>
                            {promoError && (
                                <div className="Checkout-promoError">❌ {promoError}</div>
                            )}
                            {couponId && (
                                <div className="Checkout-promoSuccess">
                                    🎉 تم تطبيق خصم {discount}% بنجاح!
                                </div>
                            )}
                        </div>

                        {/* Confirm Button */}
                        <button
                            className={`Checkout-confirmBtn ${isFree ? "Checkout-confirmFree" : ""}`}
                            onClick={handleConfirm}
                            disabled={enrollLoading}
                        >
                            {enrollLoading
                                ? "⏳ جاري التسجيل..."
                                : isFree
                                    ? "🎉 اشترك مجاناً الآن"
                                    : `تأكيد الاشتراك — ${finalPrice} ج.م`}
                        </button>

                        {enrollError && (
                            <div className="Checkout-enrollError">❌ {enrollError}</div>
                        )}

                        <p className="Checkout-guarantee">
                            🔒 اشتراكك محمي — يمكنك الإلغاء في أي وقت
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}