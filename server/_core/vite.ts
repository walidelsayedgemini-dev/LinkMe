import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    // Keep the file-serving limits of vite.config.ts; only the options above differ here.
    server: { ...viteConfig.server, ...serverOptions },
    appType: "custom",
  });

  // Public assets bypass HTML transforms, including the page-route manifest.
  app.use(
    express.static(
      path.resolve(import.meta.dirname, "../..", "client", "public"),
      { index: false }
    )
  );
  app.use("/img", (_req, res) => res.status(404).end());
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      // Stable module URL lets Vite reuse transforms and prevents duplicate React contexts.
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(
    express.static(distPath, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (/\.(?:webp|png|jpe?g|svg|woff2)$/i.test(filePath)) {
          res.setHeader(
            "Cache-Control",
            "public, max-age=3600, must-revalidate"
          );
        } else {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  // the app's not-found page keeps a real 404 status for crawlers
  app.get("/404", (_req, res) => {
    res.status(404).sendFile(path.resolve(distPath, "index.html"));
  });

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res
      .set("Cache-Control", "no-store")
      .sendFile(path.resolve(distPath, "index.html"));
  });
}
