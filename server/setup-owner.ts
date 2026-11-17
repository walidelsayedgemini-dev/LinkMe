import "dotenv/config";
import { createConnection } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { writeFile, chmod } from "node:fs/promises";
import { users, passwordResetTokens, sessions } from "../drizzle/schema";
import { hashPassword, issueOwnerCode, verifyPassword } from "./auth";

// Administrative maintenance, only after explicit owner authorization in the task.
// This is not an HTTP endpoint and no code is committed or printed to public logs.
const email = process.argv[2]?.trim().toLowerCase();
const destination = process.argv[3];
const publicOrigin = process.argv[4];
if (publicOrigin) {
  const parsed = new URL(publicOrigin);
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("Public origin must be a plain HTTPS website origin");
  }
}
if (!email || !destination || !process.env.DATABASE_URL)
  throw new Error(
    "Provide authorized email, private output path and DATABASE_URL"
  );
const conn = await createConnection(process.env.DATABASE_URL);
try {
  const db = drizzle(conn);
  const ownerId = await db.transaction(async tx => {
    const [existing] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    let id = existing?.id;
    if (id) {
      await tx.update(users).set({ role: "admin" }).where(eq(users.id, id));
    } else {
      const [created] = await tx.insert(users).values({
        openId: `owner_${randomBytes(12).toString("hex")}`,
        email,
        name: "وليد السيد",
        role: "admin",
        headline: "مالك Link Me",
        passwordHash: hashPassword(randomBytes(32).toString("hex")),
      });
      id = Number(created.insertId);
    }
    // Retire ONLY the artificial fixed-password administrator from earlier seeding.
    const [legacy] = await tx
      .select()
      .from(users)
      .where(eq(users.email, "admin@linkme.app"))
      .limit(1);
    if (
      legacy &&
      legacy.id !== id &&
      verifyPassword("linkme123", legacy.passwordHash)
    ) {
      await tx
        .update(users)
        .set({ passwordHash: hashPassword(randomBytes(32).toString("hex")) })
        .where(eq(users.id, legacy.id));
      await tx.delete(sessions).where(eq(sessions.userId, legacy.id));
      await tx
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, legacy.id));
    }
    return id as number;
  });

  // Owner sign-in is a single secret code: no email link and no password.
  const code = await issueOwnerCode(ownerId);
  const body = `# دخول المالك — ملف خاص

حساب المالك: **${email}** (دور: مدير الموقع). ${publicOrigin ? "النسخة الجديدة منشورة؛ الملف ده خاص بيك وحدك." : "التحديثات موجودة في المعاينة فقط، ولم تُنشر."}

## مفيش إيميل ولا كلمة مرور
1. ${publicOrigin ? `افتح [صفحة المالك](${publicOrigin}/owner) مباشرة في المتصفح.` : "افتح معاينة الموقع في Manus، واختار صفحة **/owner** من قائمة الصفحات."}
2. اكتب الرمز ده في خانة **رمز المالك** واضغط دخول:

\`\`\`text
${code}
\`\`\`

3. هتدخل على \`/admin\` على طول: الطلاب والتقدّم والحضور والجلسات والتقييم والواجبات والحجوزات.

## تغيير الرمز
من تبويب **أمان المالك** جوه لوحة التحكم اضغط **ولّد رمزًا جديدًا** — الرمز القديم بيتلغي فورًا، والجديد يظهر مرة واحدة بس، فاحفظه.

لا تشارك هذا الملف أو الرمز مع حد. ${publicOrigin ? "الطلاب يفتحوا الموقع مباشرة ويعملوا حسابات Link Me؛ مش محتاجين حساب Manus بعد تفعيل Public." : "الرابط المنشور يحتفظ بنسخته القديمة حتى توافق على نشر التحديثات."}
`;
  await writeFile(destination, body, { mode: 0o600 });
  await chmod(destination, 0o600);
  console.log(`Owner ready: ${email}; new access code saved to private file`);
} finally {
  await conn.end();
}
