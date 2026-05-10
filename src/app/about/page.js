import { createClient } from "@/lib/supabase-server";
import AboutPageClient from "@/components/About/AboutPageClient";

export const metadata = {
    title: "من نحن | إيدو بلاتفورم",
    description: "تعرف على منصة إيدو بلاتفورم التعليمية، رؤيتنا، رسالتنا، والفريق القائم على تطوير المحتوى العربي.",
};

export default async function AboutPage() {
    const supabase = await createClient();

    const { data: siteSettings } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", "about_us")
        .single();

    return (
        <AboutPageClient aboutData={siteSettings?.value} />
    );
}
