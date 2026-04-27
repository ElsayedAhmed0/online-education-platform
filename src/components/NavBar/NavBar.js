"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";


export default function NavBar() {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        // جيب المستخدم الحالي
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            if (user) {
                supabase
                    .from("profiles")
                    .select("name, avatar_url, role")
                    .eq("id", user.id)
                    .single()
                    .then(({ data }) => setProfile(data));
            }
        });

        // استمع لأي تغيير في الـ Auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        // Scroll effect
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        router.push("/");
    };

    const NAV_LINKS = [
        { href: "/", label: "الكورسات" },
        { href: "/about", label: "من نحن" },
        { href: "/instructors", label: "المدرسون" },
    ];

    return (
        <nav className={`${"NavBar-nav"} ${scrolled ? "NavBar-scrolled" : ""}`}>
            <div className={"NavBar-container"}>

                {/* Logo */}
                <Link href="/" className={"NavBar-logo"}>
                    <div className={"NavBar-logoIcon"}>E</div>
                    <span className={"NavBar-logoName"}>Edu<span>Platform</span></span>
                </Link>

                {/* Links */}
                <div className={"NavBar-links"}>
                    {NAV_LINKS.map(l => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={`${"NavBar-link"} ${pathname === l.href ? "NavBar-linkActive" : ""}`}
                        >
                            {l.label}
                        </Link>
                    ))}
                </div>

                {/* Actions */}
                <div className={"NavBar-actions"}>
                    {user ? (
                        <div className={"NavBar-userMenu"}>
                            <div
                                className={"NavBar-avatar"}
                                onClick={() => setMenuOpen(!menuOpen)}
                            >
                                {profile?.avatar_url
                                    ? <img src={profile.avatar_url} alt={profile.name} />
                                    : <span>{profile?.name?.[0] ?? "U"}</span>
                                }
                            </div>

                            {menuOpen && (
                                <div className={"NavBar-dropdown"}>
                                    <div className={"NavBar-dropdownHeader"}>
                                        <strong>{profile?.name}</strong>
                                        <span>{user.email}</span>
                                    </div>
                                    <div className={"NavBar-dropdownDivider"} />
                                    <Link href="/dashboard" className={"NavBar-dropdownItem"} onClick={() => setMenuOpen(false)}>🎓 داشبورد الطالب</Link>
                                    {profile?.role === "instructor" && (
                                        <Link href="/instructor/dashboard" className={"NavBar-dropdownItem"} onClick={() => setMenuOpen(false)}>📚 داشبورد المدرس</Link>
                                    )}
                                    {profile?.role === "admin" && (
                                        <Link href="/admin/dashboard" className={"NavBar-dropdownItem"} onClick={() => setMenuOpen(false)}>🛡 لوحة الأدمن</Link>
                                    )}
                                    <Link href="/profile" className={"NavBar-dropdownItem"} onClick={() => setMenuOpen(false)}>
                                        👤 الملف الشخصي
                                    </Link>
                                    <div className={"NavBar-dropdownDivider"} />
                                    <button className={"NavBar-dropdownLogout"} onClick={handleLogout}>
                                        تسجيل الخروج
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className={"NavBar-btnLogin"}>دخول</Link>
                            <Link href="/register" className={"NavBar-btnRegister"}>إنشاء حساب</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}