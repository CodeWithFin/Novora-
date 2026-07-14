export function DoodleArrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 80"
      fill="none"
      aria-hidden
    >
      <path
        d="M18 52C40 18 78 12 104 34"
        stroke="#070707"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="5 8"
      />
      <path
        d="M92 24L106 35L93 46"
        stroke="#070707"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DoodleSpark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M12 18 6 14M22 10l-2-8M30 18l8-1"
        stroke="#13a8ff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppFloaters() {
  return (
    <div className="fun-floaters hidden xl:block" aria-hidden>
      <div className="absolute right-6 top-4 sticky-note sticky-pink rotate-3 w-32 opacity-70 text-base">
        <span className="sticky-tape" />
        FEFO
        <br />
        forever ✨
      </div>
      <DoodleSpark className="absolute right-40 top-20 h-9 w-9 opacity-60" />
      <span className="absolute right-10 bottom-12 h-2.5 w-2.5 rounded-full bg-[#ff5f64]" />
      <span className="absolute right-20 bottom-20 h-2.5 w-2.5 rounded-full bg-[#13a8ff]" />
    </div>
  );
}
