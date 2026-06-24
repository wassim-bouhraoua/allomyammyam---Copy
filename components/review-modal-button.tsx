'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, X, Loader2, MessageSquare } from 'lucide-react';

interface ReviewModalButtonProps {
  orderItemId: string;
  dishName: string;
  initialRating?: number;
  initialComment?: string;
  onReviewSubmit?: (rating: number, comment: string) => void;
}

export default function ReviewModalButton({
  orderItemId,
  dishName,
  initialRating,
  initialComment,
  onReviewSubmit,
}: ReviewModalButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(initialRating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState(initialComment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/items/${orderItemId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }
      setIsOpen(false);
      router.refresh();
      if (onReviewSubmit) {
        onReviewSubmit(rating, comment);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setRating(initialRating || 5);
    setComment(initialComment || '');
    setError(null);
    setIsOpen(true);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpenModal}
        className={`h-9 px-4 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
          initialRating
            ? 'bg-secondary/80 border border-border text-foreground hover:bg-secondary'
            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_2px_8px_rgba(255,138,0,0.2)]'
        }`}
      >
        <Star size={13} fill={initialRating ? 'currentColor' : 'none'} className={initialRating ? 'text-amber-500' : ''} />
        {initialRating ? `Edit Review ⭐ ${initialRating}` : 'Leave Review'}
      </button>

      {/* Review Modal Dialog Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Backdrop click closes modal */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          {/* Modal box */}
          <div className="relative bg-card text-foreground w-full max-w-md rounded-[28px] border border-border shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-6 z-10 animate-in zoom-in-95 duration-200 flex flex-col gap-5 text-left">
            
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all"
              aria-label="Close dialog"
            >
              <X size={15} />
            </button>

            {/* Title */}
            <div>
              <h2 className="text-[17px] font-black tracking-tight flex items-center gap-2">
                <MessageSquare size={18} className="text-orange-500" />
                Write a Review
              </h2>
              <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                How was the <span className="font-semibold text-foreground">{dishName}</span>? Share your rating and taste experience.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Star Rating Select Input */}
              <div className="flex flex-col items-center gap-2 py-2 bg-secondary/35 rounded-2xl border border-border/80">
                <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">
                  Select Rating
                </span>
                
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const filled = hoverRating !== null ? starValue <= hoverRating : starValue <= rating;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 active:scale-90 transition-all outline-none"
                      >
                        <Star
                          size={28}
                          className={`transition-colors ${
                            filled 
                              ? 'text-amber-500 fill-amber-500 drop-shadow-[0_2px_4px_rgba(245,158,11,0.2)]' 
                              : 'text-muted-foreground/40 hover:text-amber-400'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text comment input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wide pl-0.5">
                  Review Comment
                </label>
                <textarea
                  placeholder="Tell us what you liked or how the dish could be improved..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full h-24 p-3 bg-secondary/40 border border-border focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-2xl text-[13px] font-semibold transition-all resize-none outline-none leading-relaxed"
                />
              </div>

              {/* Submit Error */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-xl p-3 text-[11px] font-semibold text-red-700 dark:text-red-400">
                  ⚠️ {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 h-11 rounded-2xl bg-secondary border border-border hover:bg-secondary/80 text-foreground font-bold text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[13px] flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(255,138,0,0.25)] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  Submit Review
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
