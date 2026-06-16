"use client";

// app/(auth)/profile/dishes/new/page.tsx
// Create dish form. CHEF only.

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Camera, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BackToHome from "@/components/auth/back-to-home";
import { ALLOWED_TAGS, CATEGORY_OPTIONS } from "@/lib/dish-tags";

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function NewDishPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [preparationTime, setPreparationTime] = useState("");
  const [stockCount, setStockCount] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "CHEF")) {
      router.push("/profile");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || user.role !== "CHEF") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[350px]">
        <Loader2 size={28} className="animate-spin text-orange-400" />
      </div>
    );
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const processFile = (file: File) => {
    setFileError(null);
    setUrlError(null);
    setImageUrlInput(""); // Clear URL input because file was used last

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFileError("Please upload a valid image (JPG, JPEG, PNG, WEBP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFileError("Image size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      setImage(base64);
    };
    reader.onerror = () => setFileError("Error reading file. Please try again.");
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleUrlChange = (val: string) => {
    setImageUrlInput(val);
    setFileError(null);
    setUrlError(null);

    const trimmed = val.trim();
    if (!trimmed) {
      setPreviewUrl(null);
      setImage(null);
      return;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setUrlError("URL must start with http:// or https://");
      setPreviewUrl(null);
      setImage(null);
      return;
    }

    setPreviewUrl(trimmed);
    setImage(trimmed);
  };

  const handleImageError = () => {
    if (previewUrl && (previewUrl.startsWith("http://") || previewUrl.startsWith("https://"))) {
      setUrlError("Failed to load image from URL. Please check the URL.");
    }
  };

  const handleImageLoad = () => {
    setUrlError(null);
  };

  const clearImage = () => {
    setPreviewUrl(null);
    setImage(null);
    setImageUrlInput("");
    setFileError(null);
    setUrlError(null);
    const input = document.getElementById("dish-image-upload") as HTMLInputElement;
    if (input) input.value = "";
  };


  const isFormValid = () =>
    name.trim() &&
    Number(price) > 0 &&
    category &&
    Number(preparationTime) > 0 &&
    Number.isInteger(Number(preparationTime)) &&
    !urlError;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid()) return;

    setError(null);
    setSaving(true);

    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        category,
        preparationTime: Number(preparationTime),
        tags,
      };

      if (stockCount.trim()) payload.stockCount = Number(stockCount);
      if (image) payload.image = image;

      const res = await fetch("/api/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create dish.");
        return;
      }

      router.push("/profile/dishes");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inputCls = "h-12 px-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-[14px] text-gray-900 dark:text-neutral-100 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors w-full";
  const labelCls = "text-[11px] font-bold text-gray-400 dark:text-neutral-450 uppercase tracking-wider";

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-8">
      <BackToHome />

      {/* Header */}
      <div className="flex items-center justify-between py-4 mb-2">
        <Link
          href="/profile/dishes"
          className="w-10 h-10 rounded-xl border border-gray-200 dark:border-neutral-700 flex items-center justify-center text-gray-600 dark:text-neutral-300 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-900/35 transition-all active:scale-95"
          aria-label="Back to dishes"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-[18px] font-black text-gray-900 dark:text-neutral-100 tracking-tight">New Dish</h1>
        <div className="w-10" />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-800 rounded-3xl shadow-[0_2px_24px_rgba(0,0,0,0.07)] border border-gray-100 dark:border-neutral-700 p-5 flex flex-col gap-5">

        {/* Dish image upload and URL paste */}
        <div className="flex flex-col gap-3">
          <label className={labelCls}>Dish Image</label>
          
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center transition-all min-h-[140px] relative ${
              isDragging
                ? "border-orange-500 bg-orange-50/50"
                : "border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 hover:bg-gray-100/70 dark:hover:bg-neutral-850"
            }`}
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="dish-image-upload"
            />

            {previewUrl ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700 shadow-sm bg-white dark:bg-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Dish preview"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                  />
                </div>
                <button
                  type="button"
                  onClick={clearImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-100 dark:border-red-900/30 rounded-xl bg-red-50 dark:bg-red-950/20 text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95 transition-all"
                >
                  <Trash2 size={12} />
                  Remove Image
                </button>
              </div>
            ) : (
              <label
                htmlFor="dish-image-upload"
                className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-center py-2"
              >
                <Camera size={26} className="text-gray-400 mb-2" />
                <span className="text-[13px] font-bold text-gray-700 dark:text-neutral-300">Drag & drop your photo here</span>
                <span className="text-[11px] text-gray-400 mt-1">or click to browse (JPG, JPEG, PNG, WEBP up to 2MB)</span>
              </label>
            )}
          </div>

          {/* OR Separator */}
          <div className="flex items-center gap-3 px-1 my-1">
            <div className="h-px bg-gray-100 dark:bg-neutral-700 flex-1" />
            <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-450 uppercase tracking-widest">or</span>
            <div className="h-px bg-gray-100 dark:bg-neutral-700 flex-1" />
          </div>

          {/* Image URL Input */}
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              value={imageUrlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Paste image URL (starts with http:// or https://)"
              className={inputCls}
            />
          </div>

          {fileError && (
            <p className="text-[11px] text-red-500 font-semibold mt-1 text-center">{fileError}</p>
          )}
          {urlError && (
            <p className="text-[11px] text-red-500 font-semibold mt-1 text-center">{urlError}</p>
          )}
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Dish Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Moroccan Lamb Tagine"
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe your dish..."
            className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-[14px] text-gray-900 dark:text-neutral-100 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors resize-none w-full"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Category *</label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${inputCls} cursor-pointer`}
          >
            <option value="">Select a category…</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Price + Prep time */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Price (MAD) *</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 120"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Prep Time (min) *</label>
            <input
              type="number"
              required
              min="1"
              step="1"
              value={preparationTime}
              onChange={(e) => setPreparationTime(e.target.value)}
              placeholder="e.g. 30"
              className={inputCls}
            />
          </div>
        </div>

        {/* Stock count */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Stock Count (optional)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={stockCount}
            onChange={(e) => setStockCount(e.target.value)}
            placeholder="Leave blank for unlimited"
            className={inputCls}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-3">
          <label className={labelCls}>Tags (optional)</label>
          
          {/* Cuisine Origin */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-extrabold text-gray-400 dark:text-neutral-450 uppercase tracking-wider pl-1">Cuisine Origin</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-4 bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-750 rounded-2xl">
              {ALLOWED_TAGS.filter(t => t.group === "cuisine").map((tag) => {
                const isChecked = tags.includes(tag.value);
                return (
                  <label
                    key={tag.value}
                    className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-neutral-300 font-medium cursor-pointer select-none py-1 hover:text-orange-500 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setTags((prev) => prev.filter((t) => t !== tag.value));
                        } else {
                          setTags((prev) => [...prev, tag.value]);
                        }
                      }}
                      className="w-4 h-4 rounded text-orange-500 border-gray-350 dark:border-neutral-600 focus:ring-orange-500 cursor-pointer accent-orange-500"
                    />
                    <span>{tag.emoji} {tag.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Vibe & Attributes */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-extrabold text-gray-400 dark:text-neutral-450 uppercase tracking-wider pl-1">Vibe & Attributes</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-4 bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-755 rounded-2xl">
              {ALLOWED_TAGS.filter(t => t.group === "vibe").map((tag) => {
                const isChecked = tags.includes(tag.value);
                return (
                  <label
                    key={tag.value}
                    className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-neutral-300 font-medium cursor-pointer select-none py-1 hover:text-orange-500 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setTags((prev) => prev.filter((t) => t !== tag.value));
                        } else {
                          setTags((prev) => [...prev, tag.value]);
                        }
                      }}
                      className="w-4 h-4 rounded text-orange-500 border-gray-350 dark:border-neutral-600 focus:ring-orange-500 cursor-pointer accent-orange-500"
                    />
                    <span>{tag.emoji} {tag.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col gap-2 mt-2">
          <button
            type="submit"
            disabled={saving || !isFormValid()}
            className="h-12 rounded-2xl bg-orange-500 text-white font-extrabold text-[15px] shadow-[0_4px_14px_rgba(255,138,0,0.38)] transition-all duration-150 active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 size={17} className="animate-spin" /> Creating…</>
            ) : (
              "Create Dish"
            )}
          </button>

          <Link
            href="/profile/dishes"
            className="h-12 rounded-2xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-bold text-[14px] flex items-center justify-center active:scale-[0.98] transition-transform hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
