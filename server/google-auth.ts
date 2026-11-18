import { randomBytes } from "node:crypto";
import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { createSession, normalizeEmail } from "./auth";
import { getDb } from "./db";
import { sendWelcomeEmail } from "./email";

export function isGoogleAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

function resolveCallbackUrl(req: Request): string {
  const explicit = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const proto =
    (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() ||
    req.protocol ||
    "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}/api/auth/google/callback`;
}

export function registerGoogleAuthRoutes(app: Express) {
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!isGoogleAuthConfigured()) {
      return res.redirect("/login?error=google_not_configured");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
    const redirectUri = resolveCallbackUrl(req);
    const nextPath =
      typeof req.query.next === "string" &&
      req.query.next.startsWith("/") &&
      !req.query.next.startsWith("//")
        ? req.query.next
        : "/dashboard";
    const state = Buffer.from(
      JSON.stringify({ next: nextPath, n: randomBytes(8).toString("hex") })
    ).toString("base64url");

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("access_type", "online");
    authUrl.searchParams.set("prompt", "select_account");
    authUrl.searchParams.set("state", state);

    res.redirect(authUrl.toString());
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    if (!isGoogleAuthConfigured()) {
      return res.redirect("/login?error=google_not_configured");
    }

    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!code) {
      return res.redirect("/login?error=google_cancelled");
    }

    let nextPath = "/dashboard";
    if (typeof req.query.state === "string") {
      try {
        const parsed = JSON.parse(
          Buffer.from(req.query.state, "base64url").toString("utf8")
        );
        if (
          typeof parsed?.next === "string" &&
          parsed.next.startsWith("/") &&
          !parsed.next.startsWith("//")
        ) {
          nextPath = parsed.next;
        }
      } catch {
        // ignore invalid state
      }
    }

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
          client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
          redirect_uri: resolveCallbackUrl(req),
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        return res.redirect("/login?error=google_token_failed");
      }

      const tokenJson = (await tokenRes.json()) as { access_token?: string };
      if (!tokenJson.access_token) {
        return res.redirect("/login?error=google_token_missing");
      }

      const profileRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${tokenJson.access_token}` },
        }
      );
      if (!profileRes.ok) {
        return res.redirect("/login?error=google_profile_failed");
      }

      const profile = (await profileRes.json()) as {
        sub?: string;
        email?: string;
        name?: string;
        picture?: string;
      };
      if (!profile.email || !profile.sub) {
        return res.redirect("/login?error=google_email_missing");
      }

      const db = await getDb();
      if (!db) {
        return res.redirect("/login?error=db_unavailable");
      }

      const email = normalizeEmail(profile.email);
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      let userId: number;
      if (existing) {
        userId = existing.id;
        await db
          .update(users)
          .set({
            lastSignedIn: new Date(),
            avatarUrl: existing.avatarUrl || profile.picture || null,
          })
          .where(eq(users.id, existing.id));
      } else {
        const [inserted] = await db.insert(users).values({
          openId: `google_${profile.sub}`,
          name: profile.name?.trim() || email.split("@")[0],
          email,
          avatarUrl: profile.picture || null,
          loginMethod: "google",
          role: "user",
          headline: "متعلّم لغة إنجليزية",
          lastSignedIn: new Date(),
        });
        userId = Number(inserted.insertId);
        void sendWelcomeEmail({
          to: email,
          name: profile.name?.trim() || "يا بطل",
        });
      }

      await createSession(userId, res);
      return res.redirect(nextPath);
    } catch (err) {
      console.error("[GoogleAuth] Callback error:", err);
      return res.redirect("/login?error=google_error");
    }
  });
}
