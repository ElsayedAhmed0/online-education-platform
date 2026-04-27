-- إنشاء جدول site_settings لو مش موجود
-- شغّله في Supabase SQL Editor

CREATE TABLE IF NOT EXISTS site_settings (
    id   TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'
);

-- إضافة Row Permissions (RLS)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- الكل يقدر يقرأ (عشان landing page تشتغل للزوار)
CREATE POLICY "Public read site_settings"
    ON site_settings FOR SELECT
    USING (true);

-- بس الأدمن يكتب
CREATE POLICY "Admin write site_settings"
    ON site_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- إدخال البيانات الافتراضية لو الجدول فاضل
INSERT INTO site_settings (id, value) VALUES
(
    'hero',
    '{
        "title": "تعلّم واحترف في",
        "highlight": "أي مجال تحب",
        "subtitle": "منصة تعليمية عربية متكاملة — كورسات احترافية بشهادات معتمدة",
        "cta_primary": "ابدأ الآن مجاناً",
        "cta_secondary": "تصفح الكورسات",
        "stats": [
            { "value": "+10,000", "label": "طالب نشط" },
            { "value": "+500", "label": "كورس متاح" },
            { "value": "4.9★", "label": "تقييم المنصة" }
        ]
    }'::jsonb
),
(
    'testimonials',
    '[
        { "name": "أحمد محمد", "role": "مطور ويب", "text": "المنصة غيّرت حياتي المهنية بالكامل!", "rating": 5, "avatar": "👨‍💻" },
        { "name": "سارة علي", "role": "مصممة جرافيك", "text": "كورسات احترافية بشرح واضح ومبسط جداً.", "rating": 5, "avatar": "👩‍🎨" }
    ]'::jsonb
),
(
    'cta',
    '{
        "title": "ابدأ رحلتك التعليمية اليوم",
        "subtitle": "انضم لآلاف الطلاب وابدأ رحلتك نحو الاحتراف",
        "cta_primary": "سجل الآن مجاناً",
        "cta_secondary": "تصفح الكورسات",
        "features": ["بدون رسوم اشتراك", "كورسات محدّثة باستمرار", "شهادات معتمدة"]
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
