"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";


export default function ProfileClient({ profile, email }) {
    const router = useRouter();
    const supabase = createClient();

    const [form, setForm] = useState({
        name: profile?.name ?? "",
        bio: profile?.bio ?? "",
        phone: profile?.phone ?? "",
    });

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [avatar, setAvatar] = useState(profile?.avatar_url ?? "");
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleUploadAvatar = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const ext = file.name.split(".").pop();
            const fileName = `avatars/${profile.id}.${ext}`;

            const { error } = await supabase.storage
                .from("eduplatform")
                .upload(fileName, file, { upsert: true });

            if (error) throw error;

            const { data } = supabase.storage
                .from("eduplatform")
                .getPublicUrl(fileName);

            setAvatar(data.publicUrl);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!form.name.trim()) return setError("الاسم مطلوب");
        setLoading(true);
        setError("");

        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    name: form.name,
                    bio: form.bio,
                    phone: form.phone,
                    avatar_url: avatar,
                })
                .eq("id", profile.id);

            if (error) throw error;
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const ROLE_LABELS = {
        student: "طالب",
        instructor: "مدرس",
        admin: "أدمن",
    };

    return (
        <div className={"Profile-page"}>
            <div className={"Profile-container"}>
                <div className={"Profile-header"}>
                    <h1 className={"Profile-title"}>الملف الشخصي</h1>
                    <p className={"Profile-sub"}>عدّل بياناتك الشخصية</p>
                </div>

                <div className={"Profile-card"}>
                    {/* Avatar */}
                    <div className={"Profile-avatarSection"}>
                        <div className={"Profile-avatarWrap"}>
                            {avatar ? (
                                <img src={avatar} alt={form.name} className={"Profile-avatarImg"} />
                            ) : (
                                <div className={"Profile-avatarPlaceholder"}>
                                    {form.name?.[0] ?? "U"}
                                </div>
                            )}
                            <label className={"Profile-avatarUpload"}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleUploadAvatar}
                                    style={{ display: "none" }}
                                />
                                {uploading ? "⏳" : "📷"}
                            </label>
                        </div>
                        <div>
                            <div className={"Profile-avatarName"}>{form.name}</div>
                            <div className={"Profile-avatarRole"}>
                                {ROLE_LABELS[profile?.role] ?? "طالب"}
                            </div>
                            <div className={"Profile-avatarEmail"}>{email}</div>
                        </div>
                    </div>

                    <div className={"Profile-divider"} />

                    {/* Form */}
                    <div className={"Profile-field"}>
                        <label>الاسم الكامل *</label>
                        <input
                            className={"Profile-input"}
                            value={form.name}
                            onChange={e => update("name", e.target.value)}
                            placeholder="اسمك الكامل"
                        />
                    </div>

                    <div className={"Profile-field"}>
                        <label>نبذة عنك</label>
                        <textarea
                            className={"Profile-textarea"}
                            value={form.bio}
                            onChange={e => update("bio", e.target.value)}
                            placeholder="اكتب نبذة مختصرة عن نفسك..."
                            rows={3}
                        />
                    </div>

                    <div className={"Profile-field"}>
                        <label>رقم الهاتف</label>
                        <input
                            className={"Profile-input"}
                            value={form.phone}
                            onChange={e => update("phone", e.target.value)}
                            placeholder="01xxxxxxxxx"
                        />
                    </div>

                    <div className={"Profile-field"}>
                        <label>البريد الإلكتروني</label>
                        <input
                            className={`${"Profile-input"} ${"Profile-disabled"}`}
                            value={email}
                            disabled
                        />
                        <div className={"Profile-hint"}>لا يمكن تغيير البريد الإلكتروني</div>
                    </div>

                    {error && <div className={"Profile-error"}>{error}</div>}
                    {success && <div className={"Profile-successMsg"}>✅ تم حفظ التغييرات بنجاح!</div>}

                    <div className={"Profile-actions"}>
                        <button
                            className={"Profile-backBtn"}
                            onClick={() => router.back()}
                        >← رجوع</button>
                        <button
                            className={"Profile-saveBtn"}
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? "جاري الحفظ..." : "💾 حفظ التغييرات"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}