"use client";
import { usePathname } from "next/navigation";
import NavBar from "./NavBar";

const HIDE_NAV = ["/login", "/register", "/learn", "/instructor", "/admin"];

export default function NavBarWrapper() {
    const pathname = usePathname();
    const hide = HIDE_NAV.some(p => pathname.startsWith(p));
    if (hide) return null;
    return <NavBar />;
}