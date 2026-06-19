"use client";

// app/(auth)/profile/dishes/[id]/edit/page.tsx
// Edit dish form. CHEF only. Pre-populates all fields from GET /api/dishes/[id].

import { useState, useEffect, use, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Camera, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BackToHome from "@/components/auth/back-to-home";
import { ALLOWED_TAGS, CATEGORY_OPTIONS } from "@/lib/dish-tags";

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function EditDishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: dishId } = use(params);
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
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [sugar, setSugar] = useState("");

  // Image state:
  // - existingImageUrl: what's stored in DB (used for display when no new file chosen)
  // - image: null = remove, string starting with data: = new upload, undefined = keep existing
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [image, setImage] = useState<string | null | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");

  // UI state
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
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

  // ── Fetch existing dish ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || user.role !== "CHEF") return;

    async function load() {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/dishes/${dishId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          setFetchError(data.error ?? "Failed to load dish.");
          return;
        }
        const d = data.dish;
        setName(d.name ?? "");
        setDescription(d.description ?? "");
        setPrice(String(d.price ?? ""));
        setCategory(d.category ?? "");
        setPreparationTime(String(d.preparationTime ?? ""));
        setStockCount(d.stockCount !== null && d.stockCount !== undefined ? String(d.stockCount) : "");
        const allowedValues = ALLOWED_TAGS.map(t => t.value);
        const cleanedTags = (d.tags ?? []).map((t: string) => t.toLowerCase()).filter((t: string) => allowedValues.includes(t));
        setTags(cleanedTags);
        setCalories(d.calories !== null && d.calories !== undefined ? String(d.calories) : "");
        setProtein(d.protein !== null && d.protein !== undefined ? String(d.protein) : "");
        setCarbs(d.carbs !== null && d.carbs !== undefined ? String(d.carbs) : "");
        setFat(d.fat !== null && d.fat !== undefined ? String(d.fat) : "");
        setSugar(d.sugar !== null && d.sugar !== undefined ? String(d.sugar) : "");
        setExistingImageUrl(d.imageUrl ?? null);
        setPreviewUrl(d.imageUrl ?? null);
        if (d.imageUrl && (d.imageUrl.startsWith("http://") || d.imageUrl.startsWith("https://"))) {
          setImageUrlInput(d.imageUrl);
        }
      } catch {
        setFetchError("Connection error. Could not load dish.");
      } finally {
        setFetchLoading(false);
      }
    }

    load();
  }, [dishId, user]);

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (authLoading || !user || user.role !== "CHEF") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[350px]">
        <Loader2 size={28} className="animate-spin text-orange-400" />
      </div>
    );
  }

  if (fetchLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[350px]">
        <Loader2 size={28} className="animate-spin text-orange-400" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col min-h-full px-4 pt-4 pb-8">
        <div className="flex items-center py-4 mb-4">
          <Link
            href="/profile/dishes"
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-[18px] font-black text-gray-900 ml-4">Edit Dish</h1>
        </div>
        <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100">
          <p className="text-[13px] font-semibold text-red-650">{fetchError}</p>
        </div>
        <Link
          href="/profile/dishes"
          className="mt-4 h-12 rounded-2xl bg-gray-100 text-gray-700 font-bold text-[14px] flex items-center justify-center"
        >
          Back to Dishes
        </Link>
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
      setImage(base64); // new upload
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
      setImage(null); // signal remove image
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

  const removeImage = () => {
    setPreviewUrl(null);
    setImage(null); // signal to API: remove image
    setImageUrlInput("");
    setFileError(null);
    setUrlError(null);
    const input = document.getElementById("dish-image-edit-upload") as HTMLInputElement;
    if (input) input.value = "";
  };

  const restoreImage = () => {
    setPreviewUrl(existingImageUrl);
    setImage(undefined); // keep existing (omit from payload)
    if (existingImageUrl && (existingImageUrl.startsWith("http://") || existingImageUrl.startsWith("https://"))) {
      setImageUrlInput(existingImageUrl);
    } else {
      setImageUrlInput("");
    }
    setFileError(null);
    setUrlError(null);
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
        description: description.trim() || null,
        price: Number(price),
        category,
        preparationTime: Number(preparationTime),
        tags,
        stockCount: stockCount.trim() ? Number(stockCount) : null,
        calories: calories.trim() ? Number(calories) : null,
        protein: protein.trim() ? Number(protein) : null,
        carbs: carbs.trim() ? Number(carbs) : null,
        fat: fat.trim() ? Number(fat) : null,
        sugar: sugar.trim() ? Number(sugar) : null,
      };

      // Image field:
      // - undefined → omit from payload (keep existing)
      // - null → send null (remove image)
      // - base64 string → send to upload new image
      if (image !== undefined) {
        payload.image = image; // null or base64
      }

      const res = await fetch(`/api/dishes/${dishId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to update dish.");
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

  // Determine what the image section should display
  const imageRemoved = image === null;

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
        <h1 className="text-[18px] font-black text-gray-900 dark:text-neutral-100 tracking-tight">Edit Dish</h1>
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
              id="dish-image-edit-upload"
            />

            {!imageRemoved && previewUrl ? (
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-100 dark:border-red-900/30 rounded-xl bg-red-50 dark:bg-red-950/20 text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95 transition-all"
                  >
                    <Trash2 size={12} />
                    Remove Image
                  </button>
                  {image !== undefined && (
                    <button
                      type="button"
                      onClick={restoreImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-green-100 dark:border-green-900/30 rounded-xl bg-green-50 dark:bg-green-950/20 text-[11px] font-bold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 active:scale-95 transition-all"
                    >
                      Restore Original
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full text-center">
                {imageRemoved ? (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <span className="text-[12px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 px-3 py-1 rounded-full uppercase tracking-wider">Removed</span>
                    <button
                      type="button"
                      onClick={restoreImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-green-100 dark:border-green-900/30 rounded-xl bg-green-50 dark:bg-green-950/20 text-[11px] font-bold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 active:scale-95 transition-all"
                    >
                      Restore Original
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="dish-image-edit-upload"
                    className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-center py-2"
                  >
                    <Camera size={26} className="text-gray-400 mb-2" />
                    <span className="text-[13px] font-bold text-gray-700 dark:text-neutral-300">Drag & drop new photo here</span>
                    <span className="text-[11px] text-gray-400 mt-1">or click to browse (JPG, JPEG, PNG, WEBP up to 2MB)</span>
                  </label>
                )}
              </div>
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

        {/* Nutrition Facts */}
        <div className="flex flex-col gap-3">
          <label className={labelCls}>Nutrition Facts (optional)</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-4 bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-750 rounded-2xl">
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-450 pl-1">Calories (kcal)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="e.g. 450"
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-455 pl-1">Protein (g)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="e.g. 25"
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-455 pl-1">Carbs (g)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="e.g. 40"
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-455 pl-1">Fat (g)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="e.g. 15"
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-455 pl-1">Sugar (g)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={sugar}
                onChange={(e) => setSugar(e.target.value)}
                placeholder="e.g. 5"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-3">
          <label className={labelCls}>Tags (optional)</label>
          
          {/* Cuisine Origin */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-extrabold text-gray-400 dark:text-neutral-455 uppercase tracking-wider pl-1">Cuisine Origin</span>
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
            <span className="text-[11px] font-extrabold text-gray-400 dark:text-neutral-455 uppercase tracking-wider pl-1">Vibe & Attributes</span>
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
              <><Loader2 size={17} className="animate-spin" /> Saving…</>
            ) : (
              "Save Changes"
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
