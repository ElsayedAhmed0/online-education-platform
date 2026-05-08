import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function WelcomePage() {
    const supabase = await createServerSupabaseClient();
    
    const { data: settings } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", "hero")
        .single();
        
    const hero = settings?.value ?? {};
    const videoUrl = hero.welcome_video_url;

    if (!videoUrl) {
        redirect("/"); // If no video is set, redirect to home
    }

    // Helper to format YouTube link to embed if necessary
    const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
    let embedUrl = videoUrl;
    if (isYouTube) {
        if (videoUrl.includes("watch?v=")) {
            embedUrl = videoUrl.replace("watch?v=", "embed/");
        } else if (videoUrl.includes("youtu.be/")) {
            embedUrl = videoUrl.replace("youtu.be/", "youtube.com/embed/");
        }
    }

    return (
        <div className="Welcome-page">
            <div className="Welcome-container">
                <div className="Welcome-header">
                    <Link href="/" className="Welcome-backBtn">
                        ← العودة للرئيسية
                    </Link>
                    <h1 className="Welcome-title">مرحباً بك في المنصة</h1>
                </div>
                
                <div className="Welcome-videoWrapper">
                    {isYouTube ? (
                        <iframe
                            src={embedUrl}
                            title="Welcome Video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="Welcome-iframe"
                        />
                    ) : (
                        <video
                            src={videoUrl}
                            controls
                            autoPlay
                            className="Welcome-iframe"
                            style={{ objectFit: "cover" }}
                        />
                    )}
                </div>
                
                <div className="Welcome-actions">
                    <Link href="/#courses" className="Welcome-ctaBtn">
                        تصفح الكورسات الآن
                    </Link>
                </div>
            </div>
        </div>
    );
}
