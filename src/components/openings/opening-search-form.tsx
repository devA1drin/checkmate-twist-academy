import { Search } from "lucide-react";

/** Plain GET form so it works before JavaScript loads; the explorer reads ?q=. */
export function OpeningSearchForm({ id = "opening-search", className = "" }: { id?: string; className?: string }) {
  return (
    <form action="/openings/explorer" method="get" role="search" className={className}>
      <label htmlFor={id} className="label">Search all 3,865 named openings</label>
      <div className="flex gap-2 max-w-xl">
        <input id={id} name="q" type="search" className="input flex-1 min-w-0" placeholder="Name, ECO (B90) or moves (1.e4 c5 2.Nf3)" autoComplete="off" />
        <button className="btn btn-primary" type="submit"><Search size={17} aria-hidden />Search</button>
      </div>
    </form>
  );
}
