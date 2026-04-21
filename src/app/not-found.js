"use client";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();
    return (
        <div style={{
            minHeight: "100vh", background: "#0A081E",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            direction: "rtl", fontFamily: "Cairo,sans-serif", color: "#fff",
            textAlign: "center", padding: "24px",
        }}>
            <div style={{ fontSize: 80, marginBottom: 20 }}>🔍</div>
            <h1 style={{ fontSize: 48, fontWeight: 900, color: "#818CF8", marginBottom: 12 }}>404</h1>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,.5)", marginBottom: 32 }}>
                الصفحة اللي بتدور عليها مش موجودة
            </p>
            <button
                onClick={() => router.push("/")}
                style={{
                    padding: "13px 32px",
                    background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
                    border: "none", borderRadius: 12,
                    color: "#fff", fontFamily: "Cairo,sans-serif",
                    fontSize: 15, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 6px 18px rgba(99,102,241,.4)",
                }}
            >
                العودة للرئيسية
            </button>
        </div>
    );
}