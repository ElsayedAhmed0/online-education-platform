import { createServerSupabaseClient } from "@/lib/supabase-server";
import LandingPage from "@/components/Landing/LandingPage";

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
  const testimonials = settings?.find(s => s.id === "testimonials")?.value ?? [];
  const cta = settings?.find(s => s.id === "cta")?.value ?? {};

  return (
    <LandingPage
      courses={courses ?? []}
      hero={hero}
      testimonials={testimonials}
      cta={cta}
    />
  );
}