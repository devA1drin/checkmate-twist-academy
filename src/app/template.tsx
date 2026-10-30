/** Short fade-in on each navigation (CSS only, disabled by prefers-reduced-motion in globals.css). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
