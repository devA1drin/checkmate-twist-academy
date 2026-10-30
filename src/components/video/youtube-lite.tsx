"use client";
import { useState } from "react";
import { Play } from "lucide-react";

/** Privacy-friendly embed: shows the thumbnail and only loads youtube-nocookie.com after a click. */
export function YouTubeLite({ id, title, channel }: { id: string; title: string; channel?: string }) {
  const [on, setOn] = useState(false);
  return (
    <div>
      <div className="relative aspect-video bg-[#0b1220] border border-line">
        {on ? (
          <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <button onClick={() => setOn(true)} className="group absolute inset-0" aria-label={`Play ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" loading="lazy" />
            <span className="absolute left-0 bottom-0 inline-flex items-center gap-1.5 bg-[#0b1220] text-[#ebe7de] text-xs font-medium px-2.5 py-1.5 group-hover:bg-[#1d4fd8]"><Play size={12} fill="currentColor" aria-hidden /> Play</span>
          </button>
        )}
      </div>
      <div className="pt-2.5">
        <div className="text-[15px] font-medium leading-snug">{title}</div>
        {channel && <div className="text-xs text-muted mt-0.5">{channel} · YouTube</div>}
      </div>
    </div>
  );
}
