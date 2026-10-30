"use client";
import { useState } from "react";
import { Play } from "lucide-react";

/** Privacy-friendly embed: shows the thumbnail and only loads youtube-nocookie.com after a click. */
export function YouTubeLite({ id, title, channel }: { id: string; title: string; channel?: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-video bg-black">
        {on ? (
          <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <button onClick={() => setOn(true)} className="group absolute inset-0" aria-label={`Play ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-85 group-hover:opacity-100 transition" loading="lazy" />
            <span className="absolute inset-0 grid place-items-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-electric to-violet text-white shadow-lg group-hover:scale-110 transition"><Play size={24} fill="white" /></span></span>
          </button>
        )}
      </div>
      <div className="p-3">
        <div className="text-sm font-semibold leading-snug">{title}</div>
        {channel && <div className="text-xs text-muted mt-0.5">{channel} · YouTube</div>}
      </div>
    </div>
  );
}
