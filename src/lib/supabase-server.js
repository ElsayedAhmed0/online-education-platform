import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// للـ Route Handlers و Server Actions (تقدر تعمل set)
export async function createServerSupabaseClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Server Component — ignored
                    }
                },
            },
        }
    );
}

// للـ Server Components العادية (read-only)
export async function createClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => {}, // مش بنعمل set في Server Components
            },
        }
    );
}