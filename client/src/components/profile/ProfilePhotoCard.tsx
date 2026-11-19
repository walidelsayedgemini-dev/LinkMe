import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AVATAR_CATEGORIES,
  AVATAR_PRESETS,
  type AvatarCategory,
  type AvatarPreset,
} from "@shared/gamification-catalog";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | AvatarCategory>("all");

  const updateProfile = trpc.profile.update.useMutation();

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
        credentials: "include",
      });
      if (!response.ok)
        throw new Error(await errorMessage(response, "تعذّر رفع الصورة"));
      const result = (await response.json()) as { avatarUrl?: string };
      if (!result.avatarUrl || typeof result.avatarUrl !== "string") {
        throw new Error("استجابة رفع الصورة غير صالحة");
      }
      onUploaded(result.avatarUrl);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      toast.success("اتحفظت صورتك بنجاح ✅");
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

  const select3DAvatar = async (imageUrl: string) => {
    setError(null);
    setPreviewUrl(imageUrl);
    try {
      await updateProfile.mutateAsync({ avatarUrl: imageUrl });
      onUploaded(imageUrl);
      setPickerOpen(false);
      toast.success("تم اختيار الأفتار بنجاح 🎨");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "تعذّر حفظ الأفتار");
    }
  };

  const removePhoto = async () => {
    if (!window.confirm("تحب تشيل صورتك الحالية؟")) return;
    setError(null);
    setIsDeleting(true);
    try {
      const response = await fetch("/api/profile/avatar", {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok)
        throw new Error(await errorMessage(response, "تعذّر حذف الصورة"));
      setPreviewUrl(null);
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

  const filteredAvatars =
    activeCategory === "all"
      ? AVATAR_PRESETS
      : AVATAR_PRESETS.filter((a: AvatarPreset) => a.category === activeCategory);

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
              className="size-28 shrink-0 rounded-full object-cover ring-4 ring-paper-deep shadow-sm"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <UserAvatar
              name={name}
              size={112}
              className="ring-4 ring-paper-deep shadow-sm"
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
            ارفع صورتك من جهازك أو اختار من الـ 100 أفتار 3D الواقعية المتاحة حصريًا على Link Me!
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
              {isUploading ? "جارٍ الرفع…" : "ارفع صورتك"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="rounded-full border-iris/40 bg-iris-soft/40 text-iris hover:bg-iris hover:text-white"
              onClick={() => setPickerOpen(true)}
            >
              <Sparkles className="me-1.5 size-4 text-amber-500" />
              اختار أفتار 3D (100 أفتار)
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

      {/* 100 3D Avatars Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent
          className="max-w-3xl max-h-[85vh] flex flex-col p-6 overflow-hidden"
          dir="rtl"
        >
          <DialogHeader className="shrink-0 text-start">
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              اختار أفتارك المفضل من 100 أفتار 3D واقعي
            </DialogTitle>
            <DialogDescription className="text-sm text-ink-soft">
              أفتارات 3D بجودة استديوهات ديزني وبيكسار، اختار الشخصية اللي تعبّر عنك!
            </DialogDescription>
          </DialogHeader>

          {/* Categories Tab Bar */}
          <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto py-2 border-b border-line">
            {AVATAR_CATEGORIES.map((cat: (typeof AVATAR_CATEGORIES)[number]) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                  activeCategory === cat.id
                    ? "bg-iris text-white shadow-sm"
                    : "bg-card text-ink-soft hover:bg-paper-deep hover:text-ink border border-line"
                )}
              >
                <span className="me-1">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Avatar Grid */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {filteredAvatars.map((av: AvatarPreset) => {
                const isSelected = displayedSource === av.imageUrl;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => void select3DAvatar(av.imageUrl)}
                    className={cn(
                      "group relative flex flex-col items-center rounded-2xl border p-2 transition-all hover:scale-105",
                      isSelected
                        ? "border-iris bg-iris-soft/50 ring-2 ring-iris shadow-md"
                        : "border-line bg-card hover:border-iris/50"
                    )}
                    title={av.label}
                  >
                    <div className="relative size-14 sm:size-16 rounded-xl overflow-hidden bg-paper-deep">
                      <img
                        src={av.imageUrl}
                        alt={av.label}
                        loading="lazy"
                        className="size-full object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                    <span className="mt-1.5 text-[11px] font-medium text-ink truncate w-full text-center">
                      {av.label}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1 right-1 rounded-full bg-iris text-white text-[9px] px-1 font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
