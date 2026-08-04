import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Timer, Zap, ArrowRight, Percent } from 'lucide-react';

interface FlashSaleBannerProps {
  onApplyCoupon: (code: string) => string | null;
  couponCode: string;
}

export default function FlashSaleBanner({ onApplyCoupon, couponCode }: FlashSaleBannerProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          clearInterval(timer);
          return prev;
        }

        let { hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            }
          }
        }

        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClick = () => {
    onApplyCoupon(couponCode);
  };

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="relative z-10 ml-auto w-full max-w-xl cursor-pointer"
      onClick={handleClick}
      id="flash-sale-banner"
    >
      <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-500 bg-[length:200%_auto] animate-gradient-x p-0.5 shadow-lg rounded-xl overflow-hidden">
        <div className="bg-white dark:bg-neutral-900 rounded-[10px] px-3 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-950/50 p-1.5 rounded-full text-blue-600 dark:text-blue-400">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <div>
              <h4 className="font-mono text-[9px] uppercase font-black tracking-widest text-blue-600 dark:text-blue-400">
                Flash Sale
              </h4>
              <p className="font-sans text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                Extra 10% Off Everything!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 self-start">
            <div className="flex items-center gap-1.5 font-mono">
              <div className="flex gap-0.5 text-xs font-black">
                <div className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 min-w-[20px] text-center">
                  {formatNumber(timeLeft.hours)}
                </div>
                <span className="text-neutral-400">:</span>
                <div className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 min-w-[20px] text-center">
                  {formatNumber(timeLeft.minutes)}
                </div>
                <span className="text-neutral-400">:</span>
                <div className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 min-w-[20px] text-center text-blue-600 dark:text-blue-400">
                  {formatNumber(timeLeft.seconds)}
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-full border border-blue-200/50 dark:border-blue-900/50">
              <span>Claim</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative pulse glow */}
      <div className="absolute -inset-1 bg-amber-500/20 blur-xl -z-10 animate-pulse rounded-2xl" />
    </motion.div>
  );
}
