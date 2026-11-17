import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/bits";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type ProfilePhotoCardProps = {
  name?: string | null;
  avatarUrl?: string | null;
  onUploaded: (avatarUrl: string) => void;
  onDeleted: () => void;
};

function errorMessage(response: Response, fallback: string) {
  return response
    .json()
    .then(body => (typeof body?.error === "string" ? body.error : fallback))
    .catch(() => fallback);
}

export function ProfilePhotoCard({
  name,
  avatarUrl,
  onUploaded,
  onDeleted,
}: ProfilePhotoCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    setImageFailed(false);
  }, [previewUrl, avatarUrl]);

  const upload = async (file: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("اختار صورة JPEG أو PNG أو WebP فقط.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("الصورة لازم تكون 2 ميجابايت أو أقل.");
      return;
    }
    setSelectedFile(file);
    const nextPreview = URL.createObjectURL(file);
    setPreviewUrl(nextPreview);
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("photo", file, file.name);
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body,
        credentials: "same-origin",
      });
      if (!response.ok)
        throw new Error(await errorMessage(response, "تعذّر رفع الصورة"));
      const result = (await response.json()) as { avatarUrl?: string };
      if (!result.avatarUrl?.startsWith("/api/profile/avatar/")) {
        throw new Error("استجابة رفع الصورة غير صالحة");
      }
      onUploaded(result.avatarUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (inputRef.current) inputRef.current.value = "";
      toast.success("اتحفظت صورتك");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "تعذّر رفع الصورة"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const chooseFile = (file: File | undefined) => {
    if (file) void upload(file);
  };

  const removePhoto = async () => {
    if (!window.confirm("تحب تشيل صورتك الحالية؟")) return;
    setError(null);
    setIsDeleting(true);
    try {
      const response = await fetch("/api/profile/avatar", {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!response.ok)
        throw new Error(await errorMessage(response, "تعذّر حذف الصورة"));
      onDeleted();
      toast.success("اتشالت الصورة");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "تعذّر حذف الصورة"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const displayedSource = previewUrl ?? avatarUrl;
  return (
    <section
      className="rounded-3xl border border-line bg-card p-6"
      aria-labelledby="photo-title"
    >
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-start">
        <div className="relative">
          {displayedSource && !imageFailed ? (
            <img
              src={displayedSource}
              alt={name ?? ""}
              width={112}
              height={112}
              className="size-28 shrink-0 rounded-full object-cover ring-4 ring-paper-deep"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <UserAvatar
              name={name}
              size={112}
              className="ring-4 ring-paper-deep"
            />
          )}
          <span
            className="absolute -bottom-1 -end-1 grid size-8 place-items-center rounded-full bg-iris text-white ring-4 ring-card"
            aria-hidden
          >
            <Camera className="size-4" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="photo-title" className="text-lg font-bold text-ink">
            صورتك الشخصية
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            صورة واضحة تساعد المدرّس يعرفك. JPEG أو PNG أو WebP، بحد أقصى 2
            ميجابايت.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button
              type="button"
              className="rounded-full bg-iris text-white hover:bg-iris-deep"
              disabled={isUploading || isDeleting}
              onClick={() => inputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="me-2 size-4 animate-spin" />
              ) : (
                <ImagePlus className="me-2 size-4" />
              )}
              {isUploading ? "جارٍ الرفع…" : "اختار صورة"}
            </Button>
            {(avatarUrl || previewUrl) && !isUploading && (
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-ink/20"
                disabled={isDeleting}
                onClick={() => void removePhoto()}
              >
                {isDeleting ? (
                  <Loader2 className="me-2 size-4 animate-spin" />
                ) : (
                  <Trash2 className="me-2 size-4" />
                )}
                حذف الصورة
              </Button>
            )}
            {selectedFile && !isUploading && error && (
              <Button
                type="button"
                variant="ghost"
                className="rounded-full text-iris"
                onClick={() => void upload(selectedFile)}
              >
                حاول تاني
              </Button>
            )}
          </div>
          {error && (
            <p className="mt-3 text-sm font-medium text-coral" role="alert">
              {error}
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp"
            onChange={event => chooseFile(event.target.files?.[0])}
            aria-label="اختيار صورة شخصية من الجهاز"
          />
        </div>
      </div>
    </section>
  );
}
