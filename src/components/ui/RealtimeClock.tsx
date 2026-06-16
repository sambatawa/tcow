"use client";

import { useState, useEffect } from "react";

export function RealtimeClock() {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show placeholder during SSR/hydration
  if (!mounted || !time) {
    return (
      <div className="flex flex-col items-end text-right">
        <div className="text-lg font-mono font-semibold text-stone-900 dark:text-stone-100">
          00:00:00
        </div>
        <div className="text-xs text-stone-500 dark:text-stone-400">
          Memuat...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end text-right">
      <div className="text-lg font-mono font-semibold text-stone-900 dark:text-stone-100">
        {formatTime(time)}
      </div>
      <div className="text-xs text-stone-500 dark:text-stone-400">
        {formatDate(time)}
      </div>
    </div>
  );
}
