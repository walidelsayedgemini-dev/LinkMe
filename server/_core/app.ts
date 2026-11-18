import "dotenv/config";
import express from "express";
import path from "node:path";
import { sql } from "drizzle-orm";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getDb } from "../db";
import { registerProfileRoutes } from "../profile-upload";

export function createApiApp() {
  const app = express();
  app.disable("x-powered-by");

  // Baseline hardening. Framing is intentionally left open because the app is
  // previewed inside the platform's cross-site iframe.
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");
    next();
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  // Fallback for legacy manus-storage paths to local public assets
  const manusStorageFallback: Record<string, string> = {
    "image-1.webp": "/img/cafe.webp",
    "image-2.webp": "/img/ielts.webp",
    "image-3.webp": "/img/business.webp",
    "image-4.webp": "/img/pronunciation.webp",
    "image-5.webp": "/img/writing.webp",
  };
  app.use("/manus-storage", (req, res) => {
    const filename = path.basename(req.path);
    const target = manusStorageFallback[filename] || "/img/hero.webp";
    res.redirect(302, target);
  });

  app.get("/api/health", async (_req, res) => {
    let database = "down";
    try {
      const db = await getDb();
      if (db) {
        await db.execute(sql`select 1`);
        database = "up";
      }
    } catch {
      database = "down";
    }
    res.status(200).json({ status: "ok", database, uptime: Math.round(process.uptime()) });
  });

  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });

  registerOAuthRoutes(app);
  registerProfileRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
