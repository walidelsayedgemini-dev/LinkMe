/**
 * Transactional email service powered by Resend (https://resend.com).
 * Automatically sends real Arabic RTL HTML emails when RESEND_API_KEY is set,
 * and gracefully logs in development/unconfigured environments without ever failing a request.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

const SITE_URL = process.env.PUBLIC_SITE_URL || "https://www.link-me.tech";
const EMAIL_FROM =
  process.env.EMAIL_FROM || "Link Me Academy <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function wrapRtlHtml(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f4f7fb;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#0f172a;direction:rtl;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#2563ff,#1d4ed8);padding:24px 28px;color:#ffffff;">
      <div style="font-size:20px;font-weight:800;letter-spacing:-0.02em;">Link Me Academy</div>
      <div style="font-size:13px;opacity:0.9;margin-top:4px;">${title}</div>
    </div>
    <div style="padding:28px;font-size:15px;line-height:1.8;color:#1e293b;">
      ${bodyHtml}
    </div>
    <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;">
      Link Me — إنجليزي من غير ما تترجم · <a href="${SITE_URL}" style="color:#2563ff;text-decoration:none;">link-me.tech</a>
    </div>
  </div>
</body>
</html>`;
}

export async function sendTransactionalEmail(
  payload: EmailPayload
): Promise<{ sent: boolean; provider: "resend" | "console" }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info(
      `[Email:console] To=${payload.to} | Subject="${payload.subject}"`
    );
    return { sent: false, provider: "console" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[Email:resend] Failed (${res.status}): ${errText}`);
      return { sent: false, provider: "resend" };
    }
    return { sent: true, provider: "resend" };
  } catch (err) {
    console.warn("[Email:resend] Network error:", err);
    return { sent: false, provider: "resend" };
  }
}

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  bonusXp?: number;
}) {
  const firstName = params.name.trim().split(/\s+/)[0] || "يا بطل";
  const bonusLine = params.bonusXp
    ? `<p style="background:#ecfdf5;border:1px solid #a7f3d0;padding:12px 16px;border-radius:12px;color:#065f46;font-weight:700;">🎁 مبروك! حصلت على +${params.bonusXp} نقطة XP هدية ترحيب من دعوة صديقك!</p>`
    : "";

  return sendTransactionalEmail({
    to: params.to,
    subject: "أهلاً بيك في Link Me — رحلتك في الإنجليزي بدأت! 🚀",
    html: wrapRtlHtml(
      "أهلاً بيك معنا في Link Me",
      `<p>أهلاً <strong>${firstName}</strong> 👋</p>
       <p>سعداء جداً بانضمامك لأكاديمية <strong>Link Me</strong>! خطواتك الجاية عشان تبدأ صح:</p>
       ${bonusLine}
       <ul style="padding-right:20px;margin:12px 0;">
         <li>اعمل اختبار تحديد المستوى المجاني عشان تعرف مستواك الحقيقي.</li>
         <li>العب 5 بطاقات فلاش كاردز يومياً بالصوت وزوّد نقاطك في ساحة المسابقات 🏆.</li>
         <li>اختار أفتارك وحافظ على شعلة حماستك اليومية 🔥 عشان تفتح سكنات حصرية.</li>
       </ul>
       <div style="margin-top:22px;text-align:center;">
         <a href="${SITE_URL}/dashboard" style="display:inline-block;background:#2563ff;color:#ffffff;padding:12px 26px;border-radius:999px;font-weight:700;text-decoration:none;">افتح لوحة التعلّم الآن ←</a>
       </div>`
    ),
  });
}

export async function sendReceiptApprovedEmail(params: {
  to: string;
  name: string;
  targetTitle: string;
  method: "vodafone_cash" | "instapay";
}) {
  const firstName = params.name.trim().split(/\s+/)[0] || "يا بطل";
  const methodLabel =
    params.method === "vodafone_cash" ? "فودافون كاش" : "إنستاباي";

  return sendTransactionalEmail({
    to: params.to,
    subject: `تم تفعيل اشتراكك في "${params.targetTitle}" بنجاح 🎉`,
    html: wrapRtlHtml(
      "تأكيد تفعيل الاشتراك",
      `<p>أهلاً <strong>${firstName}</strong> 🎉</p>
       <p>تمت مراجعة وتأكيد إيصال التحويل الخاص بك عبر <strong>${methodLabel}</strong> بنجاح.</p>
       <p style="background:#eff6ff;border:1px solid #bfdbfe;padding:14px 16px;border-radius:12px;color:#1e40af;font-weight:700;">
         ✅ تم فتح الوصول الكامل إلى: ${params.targetTitle}
       </p>
       <p>تقدر تبدأ المذاكرة فوراً من لوحة التعلّم بتاعتك!</p>
       <div style="margin-top:22px;text-align:center;">
         <a href="${SITE_URL}/dashboard" style="display:inline-block;background:#16a34a;color:#ffffff;padding:12px 26px;border-radius:999px;font-weight:700;text-decoration:none;">ابدأ التعلّم الآن 🚀</a>
       </div>`
    ),
  });
}
