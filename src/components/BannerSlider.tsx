import React, { useState, useEffect, useRef } from 'react';
import { BannerConfig, BannerItem } from '../types';

interface BannerSliderProps {
  bannerConfig: BannerConfig;
  isAdmin: boolean;
  onOpenBannerManager: () => void;
  onNavigate: (tab: string) => void;
}

export const BannerSlider: React.FC<BannerSliderProps> = ({
  bannerConfig,
  isAdmin,
  onOpenBannerManager,
  onNavigate
}) => {
  const activeBanners = bannerConfig.banners.filter((b) => b.isActive);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const bannerCount = activeBanners.length;
  const intervalMs = Math.max(2, bannerConfig.intervalSeconds || 4) * 1000;

  // Auto slide timer without jarring progress bar
  useEffect(() => {
    if (bannerCount <= 1 || !bannerConfig.autoPlay || isPaused) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerCount);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [bannerCount, bannerConfig.autoPlay, isPaused, intervalMs]);

  // Adjust index if out of bounds
  useEffect(() => {
    if (currentIndex >= bannerCount && bannerCount > 0) {
      setCurrentIndex(0);
    }
  }, [bannerCount, currentIndex]);

  if (bannerCount === 0) {
    if (!isAdmin) return null;
    return (
      <div className="w-full my-1 p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">কোনো সক্রিয় ব্যানার নেই</span>
        <button
          onClick={onOpenBannerManager}
          className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition"
        >
          ব্যানার যুক্ত করুন
        </button>
      </div>
    );
  }

  const currentBanner: BannerItem = activeBanners[currentIndex] || activeBanners[0];

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + bannerCount) % bannerCount);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % bannerCount);
  };

  const handleBannerClick = () => {
    if (!currentBanner) return;
    if (currentBanner.linkType && currentBanner.linkType !== 'none' && currentBanner.linkType !== 'custom') {
      onNavigate(currentBanner.linkType);
    } else if (currentBanner.linkType === 'custom' && currentBanner.customLink) {
      if (currentBanner.customLink.startsWith('http')) {
        window.open(currentBanner.customLink, '_blank');
      } else {
        onNavigate(currentBanner.customLink);
      }
    }
  };

  // Touch swipe support (Mobile friendly)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      className="relative w-full my-2 select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Banner Card */}
      <div
        onClick={handleBannerClick}
        className={`relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer ${
          currentBanner.bgGradient || 'from-[#B50058] to-[#8C0044]'
        } bg-gradient-to-r aspect-[3.2/1] sm:aspect-[3.6/1] md:aspect-[4.2/1] max-h-[190px] flex items-center`}
      >
        {/* If Image banner (Pure graphical banner like bKash promo) */}
        {currentBanner.isImageBanner && currentBanner.imageUrl ? (
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.title || 'Advertisement'}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <>
            {/* Background image / decorative overlay */}
            {currentBanner.imageUrl && (
              <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-2/5 overflow-hidden z-0">
                <img
                  src={currentBanner.imageUrl}
                  alt={currentBanner.title}
                  className="w-full h-full object-cover object-center opacity-85 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#B50058] via-[#B50058]/40 to-transparent" />
              </div>
            )}

            {/* Left Content Area: Clean, professional, bold text */}
            <div className="relative z-10 w-full px-4 sm:px-6 py-3 flex flex-col justify-center max-w-[70%] sm:max-w-[65%] text-white">
              {currentBanner.badge && (
                <div className="mb-1">
                  <span className="inline-block text-[9px] sm:text-[11px] font-bold text-yellow-300 tracking-wide">
                    ★ {currentBanner.badge}
                  </span>
                </div>
              )}

              <h3 className="text-sm sm:text-lg md:text-xl font-black text-white leading-tight drop-shadow-sm line-clamp-1 sm:line-clamp-2">
                {currentBanner.title}
              </h3>

              {currentBanner.subtitle && (
                <p className="text-[11px] sm:text-xs text-white/90 font-medium mt-1 line-clamp-1 leading-snug">
                  {currentBanner.subtitle}
                </p>
              )}

              {/* Action Button: bKash Pill Styled Button ("ট্যাপ করুন") */}
              <div className="mt-2 sm:mt-2.5">
                <span className="inline-flex items-center justify-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black bg-[#FFE500] hover:bg-[#FFD600] text-[#910046] shadow-sm tracking-wide transition transform active:scale-95">
                  {currentBanner.buttonText || 'ট্যাপ করুন'}
                </span>
              </div>
            </div>

            {/* Optional Small Terms Condition text */}
            <div className="absolute bottom-1 right-2 z-10 text-[8px] sm:text-[9px] text-white/60 pointer-events-none">
              *শর্ত প্রযোজ্য
            </div>
          </>
        )}

        {/* Indicator Dots - bKash style centered pill with dots inside */}
        {bannerCount > 1 && (
          <div
            className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex
                    ? 'w-4 sm:w-5 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
