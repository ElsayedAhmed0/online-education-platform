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

    // الصفحات المحمية — محتاج login
    const protectedRoutes = ["/dashboard", "/instructor", "/admin"];
    const isProtected = protectedRoutes.some(route => path.startsWith(route));

    // لو مش logged in وبيحاول يدخل صفحة محمية
    if (!user && isProtected) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // لو logged in وبيحاول يدخل login أو register بس
    if (user && (path === "/login" || path === "/register")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};