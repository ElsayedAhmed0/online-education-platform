import { createServerSupabaseClient } from "@/lib/supabase-server";
import CoursesGrid from "@/components/Courses/CoursesGrid";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*, profiles(name)")
    .eq("status", "live")
    .order("students_count", { ascending: false });

  return (
    <main style={{ paddingTop: "64px" }}>
      <CoursesGrid courses={courses ?? []} />
    </main>
  );
}