import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { type, id } = await request.json();
        if (!type || !id) {
            return NextResponse.json({ error: "معلومات غير مكتملة" }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "غير مسجل" }, { status: 401 });

        const adminSupabase = createAdminClient();

        // 1. Verify ownership
        if (type === "section") {
            const { data: section } = await supabase.from("sections").select("course_id").eq("id", id).single();
            if (!section) return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });
            
            const { data: course } = await supabase.from("courses").select("instructor_id").eq("id", section.course_id).single();
            if (!course || course.instructor_id !== user.id) return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });

            // Admin deletes
            await adminSupabase.from("lessons").delete().eq("section_id", id);
            await adminSupabase.from("sections").delete().eq("id", id);
            
            return NextResponse.json({ success: true });
        } 
        else if (type === "lesson") {
            const { data: lesson } = await supabase.from("lessons").select("course_id").eq("id", id).single();
            if (!lesson) return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 });
            
            const { data: course } = await supabase.from("courses").select("instructor_id").eq("id", lesson.course_id).single();
            if (!course || course.instructor_id !== user.id) return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });

            // Admin deletes
            await adminSupabase.from("lessons").delete().eq("id", id);
            
            return NextResponse.json({ success: true });
        }
        else {
            return NextResponse.json({ error: "نوع غير معروف" }, { status: 400 });
        }
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
