import { createServerSupabaseClient } from "@/lib/supabase-server";
import LandingPage from "@/components/Landing/LandingPage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  // جيب الكورسات
  const { data: courses } = await supabase
    .from("courses")
    .select("*, profiles(name)")
    .eq("status", "live")
    .order("students_count", { ascending: false });

  // جيب الـ site settings
  const { data: settings } = await supabase
    .from("site_settings")
    .select("*");

  const hero = settings?.find(s => s.id === "hero")?.value ?? {};
  const cta = settings?.find(s => s.id === "cta")?.value ?? {};

  // جلب تقييمات المنصة المعتمدة
  const { data: platformReviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, profiles!reviews_user_id_fkey(name, avatar_url)")
    .eq("target_type", "platform")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return (
    <LandingPage
      courses={courses ?? []}
      hero={hero}
      testimonials={platformReviews ?? []}
      cta={cta}
    />
  );
}