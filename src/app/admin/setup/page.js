"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const SECRET_KEY = "eduplatform-admin-2025";

export default function AdminSetupPage() {
    const supabase = createClient();
    const router = useRouter();
    const [key, setKey] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSetAdmin = async () => {
        if (key !== SECRET_KEY) return setError("المفتاح غير صحيح");
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("سجّل دخولك أولاً");

            const { error } = await supabase
                .from("profiles")
                .update({ role: "admin" })
                .eq("id", user.id);

            if (error) throw error;
            router.push("/admin/dashboard");

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh", background: "#0A081E",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Cairo,sans-serif", direction: "rtl",
        }}>
            <div style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 16, padding: "32px 36px",
                width: "100%", maxWidth: 400,
            }}>
                <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                    🛡 إعداد حساب الأدمن
                </h2>
                <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13, marginBottom: 24 }}>
                    أدخل المفتاح السري لترقية حسابك لأدمن
                </p>

                <input
                    type="password"
                    placeholder="المفتاح السري..."
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    style={{
                        width: "100%", padding: "12px 14px", marginBottom: 14,
                        background: "rgba(255,255,255,.05)",
                        border: "1.5px solid rgba(255,255,255,.1)",
                        borderRadius: 10, color: "#fff",
                        fontFamily: "Cairo,sans-serif", fontSize: 13, outline: "none",
                    }}
                />

                {error && (
                    <div style={{
                        background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)",
                        borderRadius: 8, color: "#EF4444", fontSize: 12,
                        padding: "10px 14px", marginBottom: 14,
                    }}>{error}</div>
                )}

                <button
                    onClick={handleSetAdmin}
                    disabled={loading}
                    style={{
                        width: "100%", padding: 12,
                        background: "linear-gradient(135deg,#EF4444,#DC2626)",
                        border: "none", borderRadius: 10,
                        color: "#fff", fontFamily: "Cairo,sans-serif",
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                    }}
                >
                    {loading ? "جاري الترقية..." : "ترقية لأدمن 🛡"}
                </button>
            </div>
        </div>
    );
}