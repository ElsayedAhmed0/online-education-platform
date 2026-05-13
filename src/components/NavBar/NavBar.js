"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import NotificationBell from "./NotificationBell";
import ChatIcon from "./ChatIcon"; 
const ROLE_CONFIG = {
    student: { label: "طالب", icon: "🎓", color: "#818CF8", bg: "rgba(99,102,241,.15)" },
    instructor: { label: "مدرس", icon: "👨‍🏫", color: "#10B981", bg: "rgba(16,185,129,.15)" },
    admin: { label: "أدمن", icon: "🛡", color: "#EF4444", bg: "rgba(239,68,68,.15)" },
};

export default function NavBar() {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);   // Desktop user dropdown
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile sidebar drawer
    const [scrolled, setScrolled] = useState(false);

    const dropdownRef = useRef(null);

    useEffect(() => {
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

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session?.user) setProfile(null);
        });

        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);

        // Close desktop dropdown when clicking outside
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener("scroll", onScroll);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setDropdownOpen(false);
        setMobileMenuOpen(false);
        router.push("/");
    };

    const NAV_LINKS = [
        { href: "/", label: "الكورسات" },
        { href: "/about", label: "من نحن" },
        { href: "/instructors", label: "المدرسون" },
    ];

    const roleCfg = ROLE_CONFIG[profile?.role] ?? ROLE_CONFIG.student;

    /* الداشبورد حسب الدور */
    const dashboardLink =
        profile?.role === "admin" ? "/admin/dashboard" :
            profile?.role === "instructor" ? "/instructor/dashboard" :
                "/dashboard";

    return (
        <nav className={`${"NavBar-nav"} ${scrolled ? "NavBar-scrolled" : ""}`}>
            <div className={"NavBar-container"}>

                {/* Logo */}
                <Link href="/" className={"NavBar-logo"}>
                    <div className={"NavBar-logoIcon"}>E</div>
                    <span className={"NavBar-logoName"}>Edu<span>Platform</span></span>
                </Link>

                {/* Links - Hidden on Mobile */}
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
                        <div className={"NavBar-userMenu"} ref={dropdownRef}>
                            {/* Chat & Bell - Keep on mobile but maybe hide one if too crowded */}
                            <ChatIcon />
                            <NotificationBell />

                            {/* Avatar + Role Badge */}
                            <div className={"NavBar-avatarWrap"} onClick={() => setDropdownOpen(!dropdownOpen)}>
                                <div className={"NavBar-avatar"}>
                                    {profile?.avatar_url
                                        ? <img src={profile.avatar_url} alt={profile.name} />
                                        : <span>{profile?.name?.[0] ?? "U"}</span>
                                    }
                                </div>
                                <span
                                    className={"NavBar-roleBadge"}
                                    style={{ background: roleCfg.bg, color: roleCfg.color }}
                                >
                                    {roleCfg.icon} {roleCfg.label}
                                </span>
                            </div>

                            {/* Dropdown (Desktop) */}
                            {dropdownOpen && (
                                <div className={"NavBar-dropdown"}>
                                    <div className={"NavBar-dropdownHeader"}>
                                        <strong>{profile?.name}</strong>
                                        <span>{user.email}</span>
                                        <span
                                            className={"NavBar-dropdownRolePill"}
                                            style={{ background: roleCfg.bg, color: roleCfg.color }}
                                        >
                                            {roleCfg.icon} {roleCfg.label}
                                        </span>
                                    </div>
                                    <div className={"NavBar-dropdownDivider"} />
                                    {profile?.role === "student" && (
                                        <Link href="/dashboard" className={"NavBar-dropdownItem"} onClick={() => setDropdownOpen(false)}>
                                            🎓 داشبورد الطالب
                                        </Link>
                                    )}
                                    {profile?.role === "instructor" && (
                                        <Link href="/instructor/dashboard" className={"NavBar-dropdownItem"} onClick={() => setDropdownOpen(false)}>
                                            📚 داشبورد المدرس
                                        </Link>
                                    )}
                                    {profile?.role === "admin" && (
                                        <Link href="/admin/dashboard" className={"NavBar-dropdownItem"} onClick={() => setDropdownOpen(false)}>
                                            🛡 لوحة الأدمن
                                        </Link>
                                    )}
                                    <Link href="/profile" className={"NavBar-dropdownItem"} onClick={() => setDropdownOpen(false)}>
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
                        <div className="NavBar-authBtns">
                            <Link href="/login" className={"NavBar-btnLogin"}>دخول</Link>
                            <Link href="/register" className={"NavBar-btnRegister"}>إنشاء حساب</Link>
                        </div>
                    )}

                    {/* Hamburger Button */}
                    <button 
                        className={`NavBar-hamburger ${mobileMenuOpen ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>

                {/* Mobile Menu Drawer */}
                <div className={`NavBar-mobileMenu ${mobileMenuOpen ? 'open' : ''}`}>
                    <div className="NavBar-mobileMenuContent">
                        <div className="NavBar-mobileHeader">
                            <Link href="/" className={"NavBar-logo"} onClick={() => setMobileMenuOpen(false)}>
                                <div className={"NavBar-logoIcon"}>E</div>
                                <span className={"NavBar-logoName"}>Edu<span>Platform</span></span>
                            </Link>
                            <button className="NavBar-closeMenu" onClick={() => setMobileMenuOpen(false)}>✕</button>
                        </div>
                        
                        <div className="NavBar-mobileLinks">
                            {NAV_LINKS.map(l => (
                                <Link
                                    key={l.href}
                                    href={l.href}
                                    className={`${"NavBar-mobileLink"} ${pathname === l.href ? "active" : ""}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {l.label}
                                </Link>
                            ))}
                        </div>

                        {user ? (
                            <div className="NavBar-mobileUserSection">
                                <div className="NavBar-mobileUserInfo">
                                    <div className="NavBar-avatar">
                                        {profile?.avatar_url
                                            ? <img src={profile.avatar_url} alt={profile.name} />
                                            : <span>{profile?.name?.[0] ?? "U"}</span>
                                        }
                                    </div>
                                    <div className="NavBar-mobileUserDetails">
                                        <strong>{profile?.name}</strong>
                                        <span>{user.email}</span>
                                    </div>
                                </div>
                                
                                <div className="NavBar-mobileDropdownLinks">
                                    {profile?.role === "student" && (
                                        <Link href="/dashboard" className={"NavBar-mobileDropdownItem"} onClick={() => setMobileMenuOpen(false)}>
                                            🎓 داشبورد الطالب
                                        </Link>
                                    )}
                                    {profile?.role === "instructor" && (
                                        <Link href="/instructor/dashboard" className={"NavBar-mobileDropdownItem"} onClick={() => setMobileMenuOpen(false)}>
                                            📚 داشبورد المدرس
                                        </Link>
                                    )}
                                    {profile?.role === "admin" && (
                                        <Link href="/admin/dashboard" className={"NavBar-mobileDropdownItem"} onClick={() => setMobileMenuOpen(false)}>
                                            🛡 لوحة الأدمن
                                        </Link>
                                    )}
                                    <Link href="/profile" className={"NavBar-mobileDropdownItem"} onClick={() => setMobileMenuOpen(false)}>
                                        👤 الملف الشخصي
                                    </Link>
                                    <button className={"NavBar-mobileLogout"} onClick={handleLogout}>
                                        تسجيل الخروج
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="NavBar-mobileAuth">
                                <Link href="/login" className={"NavBar-btnLogin"} onClick={() => setMobileMenuOpen(false)}>دخول</Link>
                                <Link href="/register" className={"NavBar-btnRegister"} onClick={() => setMobileMenuOpen(false)}>إنشاء حساب</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}