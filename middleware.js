import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const path = request.nextUrl.pathname;

    // لو مش logged in وبيحاول يدخل صفحة محمية
    const protectedRoutes = ["/dashboard", "/instructor", "/admin", "/checkout", "/learn"];
    const isProtected = protectedRoutes.some(r => path.startsWith(r));
    if (!user && isProtected) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // لو logged in وبيحاول يدخل login أو register
    if (user && (path === "/login" || path === "/register")) {
        // جيب الـ role
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        const role = profile?.role ?? "student";
        const dashboard = role === "admin"
            ? "/admin/dashboard"
            : role === "instructor"
                ? "/instructor/dashboard"
                : "/dashboard";

        return NextResponse.redirect(new URL(dashboard, request.url));
    }

    // لو logged in — تحقق من الصلاحيات
    if (user && isProtected) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        const role = profile?.role ?? "student";

        // الطالب ميدخلش على instructor أو admin
        if (role === "student" && (path.startsWith("/instructor") || path.startsWith("/admin"))) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        // المدرس ميدخلش على admin
        if (role === "instructor" && path.startsWith("/admin")) {
            return NextResponse.redirect(new URL("/instructor/dashboard", request.url));
        }

        // الأدمن ميدخلش على /dashboard العادي — وجّهه للـ admin dashboard
        if (role === "admin" && path === "/dashboard") {
            return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
    }

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};