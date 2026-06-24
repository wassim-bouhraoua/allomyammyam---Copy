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
import { useTranslation } from "@/context/I18nContext";

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function NewDishPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { dict } = useTranslation();

  // Form fields
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
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
      setFileError(dict.auth.register.validImageError);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFileError(dict.auth.register.photoSizeError);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      setImage(base64);
    };
    reader.onerror = () => setFileError(dict.auth.register.fileReadError);
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
      setUrlError(dict.chefDishes.form.urlFormatError);
      setPreviewUrl(null);
      setImage(null);
      return;
    }

    setPreviewUrl(trimmed);
    setImage(trimmed);
  };

  const handleImageError = () => {
    if (previewUrl && (previewUrl.startsWith("http://") || previewUrl.startsWith("https://"))) {
      setUrlError(dict.chefDishes.form.urlLoadError);
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
        name_en: nameEn.trim() || undefined,
        name_ar: nameAr.trim() || undefined,
        description: description.trim() || undefined,
        description_en: descriptionEn.trim() || undefined,
        description_ar: descriptionAr.trim() || undefined,
        price: Number(price),
        category,
        preparationTime: Number(preparationTime),
        tags,
      };

      if (stockCount.trim()) payload.stockCount = Number(stockCount);
      if (calories.trim()) payload.calories = Number(calories);
      if (protein.trim()) payload.protein = Number(protein);
      if (carbs.trim()) payload.carbs = Number(carbs);
      if (fat.trim()) payload.fat = Number(fat);
      if (sugar.trim()) payload.sugar = Number(sugar);
      if (image) payload.image = image;

      const res = await fetch("/api/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? dict.chefDishes.form.createFailed);
        return;
      }

      router.push("/profile/dishes");
    } catch {
      setError(dict.chefDishes.form.genericError);
    } finally {
      setSaving(false);
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inputCls = "h-12 px-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-[14px] text-gray-900 dark:text-neutral-100 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors w-full text-start";
  const labelCls = "text-[11px] font-bold text-gray-400 dark:text-neutral-450 uppercase tracking-wider text-start pl-1 rtl:pl-0 rtl:pr-1";

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-8 text-start">
      <BackToHome />

      {/* Header */}
      <div className="flex items-center justify-between py-4 mb-2">
        <Link
          href="/profile/dishes"
          className="w-10 h-10 rounded-xl border border-gray-200 dark:border-neutral-700 flex items-center justify-center text-gray-600 dark:text-neutral-300 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-900/35 transition-all active:scale-95"
          aria-label={dict.chefDishes.title}
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <h1 className="text-[18px] font-black text-gray-900 dark:text-neutral-100 tracking-tight">{dict.chefDishes.form.addTitle}</h1>
        <div className="w-10" />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-800 rounded-3xl shadow-[0_2px_24px_rgba(0,0,0,0.07)] border border-gray-100 dark:border-neutral-700 p-5 flex flex-col gap-5 text-start">

        {/* Dish image upload and URL paste */}
        <div className="flex flex-col gap-3">
          <label className={labelCls}>{dict.chefDishes.form.image}</label>
          
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
                  {dict.chefDishes.form.removeImage}
                </button>
              </div>
            ) : (
              <label
                htmlFor="dish-image-upload"
                className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-center py-2"
              >
                <Camera size={26} className="text-gray-400 mb-2" />
                <span className="text-[13px] font-bold text-gray-700 dark:text-neutral-300">{dict.chefDishes.form.dragDropImage}</span>
                <span className="text-[11px] text-gray-400 mt-1">{dict.chefDishes.form.browseNotice}</span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-3 px-1 my-1">
            <div className="h-px bg-gray-100 dark:bg-neutral-700 flex-1" />
            <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-455 uppercase tracking-widest">{dict.chefDishes.form.or}</span>
            <div className="h-px bg-gray-100 dark:bg-neutral-700 flex-1" />
          </div>

          {/* Image URL Input */}
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              value={imageUrlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={dict.chefDishes.form.pasteUrlPlaceholder}
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

        {/* Name FR */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{dict.chefDishes.form.name} *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={dict.chefDishes.form.namePlaceholder}
            className={inputCls}
          />
        </div>

        {/* Name EN */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{dict.chefDishes.form.nameEn}</label>
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder={dict.chefDishes.form.namePlaceholder}
            className={inputCls}
          />
        </div>

        {/* Name AR */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{dict.chefDishes.form.nameAr}</label>
          <input
            type="text"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder={dict.chefDishes.form.namePlaceholder}
            className={inputCls}
          />
        </div>

        {/* Description FR */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{dict.chefDishes.form.description}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={dict.chefDishes.form.descriptionPlaceholder}
            className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-750 text-[14px] text-gray-900 dark:text-neutral-100 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors resize-none w-full text-start"
          />
        </div>

        {/* Description EN */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{dict.chefDishes.form.descriptionEn}</label>
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            rows={3}
            placeholder={dict.chefDishes.form.descriptionPlaceholder}
            className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-750 text-[14px] text-gray-900 dark:text-neutral-100 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors resize-none w-full text-start"
          />
        </div>

        {/* Description AR */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{dict.chefDishes.form.descriptionAr}</label>
          <textarea
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            rows={3}
            placeholder={dict.chefDishes.form.descriptionPlaceholder}
            className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-750 text-[14px] text-gray-900 dark:text-neutral-100 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors resize-none w-full text-start"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{dict.chefDishes.form.category} *</label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${inputCls} cursor-pointer`}
          >
            <option value="">{dict.chefDishes.form.categoryPlaceholder}</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {dict.dishes.categories[opt.value.toLowerCase()] || opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price + Prep time */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{dict.chefDishes.form.price} *</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={dict.chefDishes.form.pricePlaceholder}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{dict.chefDishes.form.prepTime} *</label>
            <input
              type="number"
              required
              min="1"
              step="1"
              value={preparationTime}
              onChange={(e) => setPreparationTime(e.target.value)}
              placeholder={dict.chefDishes.form.prepTimePlaceholder}
              className={inputCls}
            />
          </div>
        </div>

        {/* Stock count */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{dict.chefDishes.form.stock}</label>
          <input
            type="number"
            min="0"
            step="1"
            value={stockCount}
            onChange={(e) => setStockCount(e.target.value)}
            placeholder={dict.chefDishes.form.stockPlaceholder}
            className={inputCls}
          />
        </div>

        {/* Nutrition Facts */}
        <div className="flex flex-col gap-3 text-start">
          <label className={labelCls}>{dict.chefDishes.form.nutritionTitle}</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-4 bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-750 rounded-2xl">
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-450 pl-1 rtl:pl-0 rtl:pr-1">{dict.dishDetail.nutrition.calories} (kcal)</span>
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
              <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-450 pl-1 rtl:pl-0 rtl:pr-1">{dict.dishDetail.nutrition.protein} (g)</span>
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
              <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-450 pl-1 rtl:pl-0 rtl:pr-1">{dict.dishDetail.nutrition.carbs} (g)</span>
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
              <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-450 pl-1 rtl:pl-0 rtl:pr-1">{dict.dishDetail.nutrition.fat} (g)</span>
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
              <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-450 pl-1 rtl:pl-0 rtl:pr-1">{dict.dishDetail.nutrition.sugar} (g)</span>
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
        <div className="flex flex-col gap-3 text-start">
          <label className={labelCls}>{dict.chefDishes.form.tagsLabel}</label>
          
          {/* Cuisine Origin */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-extrabold text-gray-400 dark:text-neutral-450 uppercase tracking-wider pl-1 rtl:pl-0 rtl:pr-1">{dict.chefDishes.form.cuisineOrigin}</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-4 bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-750 rounded-2xl">
              {ALLOWED_TAGS.filter(t => t.group === "cuisine").map((tag) => {
                const isChecked = tags.includes(tag.value);
                const tagLabel = dict.dishes.tags[tag.value] || tag.label;
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
                    <span>{tag.emoji} {tagLabel}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Vibe & Attributes */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-extrabold text-gray-400 dark:text-neutral-450 uppercase tracking-wider pl-1 rtl:pl-0 rtl:pr-1">{dict.chefDishes.form.vibeAttributes}</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-4 bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-755 rounded-2xl">
              {ALLOWED_TAGS.filter(t => t.group === "vibe").map((tag) => {
                const isChecked = tags.includes(tag.value);
                const tagLabel = dict.dishes.tags[tag.value] || tag.label;
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
                    <span>{tag.emoji} {tagLabel}</span>
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
              <><Loader2 size={17} className="animate-spin" /> {dict.chefDishes.form.creating}</>
            ) : (
              dict.chefDishes.form.createBtn
            )}
          </button>

          <Link
            href="/profile/dishes"
            className="h-12 rounded-2xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-bold text-[14px] flex items-center justify-center active:scale-[0.98] transition-transform hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            {dict.common.cancel}
          </Link>
        </div>
      </form>
    </div>
  );
}
