export const CATEGORIES = [
  { id: "chess", label: "Chess", desc: "Openings, games, study questions" },
  { id: "cube", label: "Cube", desc: "Methods, algorithms, hardware" },
  { id: "help", label: "Help", desc: "Stuck on something? Ask here" },
  { id: "showcase", label: "Showcase", desc: "Your best games and PBs" },
  { id: "clubs", label: "Clubs", desc: "Find people to practise with" },
  { id: "general", label: "General", desc: "Everything else" },
] as const;
export type Category = (typeof CATEGORIES)[number]["id"];
export const catLabel = (c: string) => CATEGORIES.find((x) => x.id === c)?.label ?? c;
export const REPORT_REASONS = [
  { id: "spam", label: "Spam or advertising" }, { id: "abuse", label: "Abusive or hateful" }, { id: "off_topic", label: "Off-topic" },
  { id: "cheating", label: "Cheating" }, { id: "impossible_time", label: "Impossible time" }, { id: "other", label: "Something else" },
] as const;
export function ago(iso: string, now = Date.now()) {
  const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  if (m < 1) return "just now"; if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24); if (d < 30) return `${d} d ago`;
  return new Date(iso).toLocaleDateString();
}
