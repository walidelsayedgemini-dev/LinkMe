import { ExternalLink } from "lucide-react";

export function CourseRecording({ url }: { url: string | null }) {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const youtubeId =
    parsed.hostname === "youtu.be"
      ? parsed.pathname.slice(1)
      : /(^|\.)youtube\.com$/.test(parsed.hostname)
        ? parsed.searchParams.get("v")
        : null;
  const embed =
    youtubeId && /^[A-Za-z0-9_-]{11}$/.test(youtubeId)
      ? `https://www.youtube-nocookie.com/embed/${youtubeId}`
      : null;
  const directVideo = /\.(mp4|webm|ogg)$/i.test(parsed.pathname);
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-card p-4 sm:p-6">
      <h2 className="mb-3 text-lg text-ink">
        تسجيل <span className="hl-word">المحاضرة.</span>
      </h2>
      {embed ? (
        <iframe
          className="aspect-video w-full rounded-xl"
          src={embed}
          title="تسجيل الدرس"
          allow="encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : directVideo ? (
        <video
          className="aspect-video w-full rounded-xl bg-navy"
          controls
          preload="metadata"
          src={url}
        >
          متصفحك مش بيدعم تشغيل الفيديو. افتح التسجيل من الرابط.
        </video>
      ) : (
        <p className="rounded-xl border border-line bg-paper-deep/40 p-4 text-sm leading-relaxed text-ink-soft">
          ده رابط خارجي. مش هيتشغّل داخل الصفحة، لكن تقدر تفتحه من الزر التالي.
        </p>
      )}
      <a
        className="mt-3 inline-flex items-center gap-2 text-sm text-iris"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {embed || directVideo ? "افتح التسجيل" : "افتح الرابط الخارجي"}{" "}
        <ExternalLink className="size-4" />
      </a>
    </section>
  );
}
