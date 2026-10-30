import { PageHeader } from "@/components/ui/page-header";
import { CubeScanner } from "./cube-scanner";
export const metadata = { title: "Cube Camera Scanner" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <PageHeader eyebrow="Cube Academy" title="Cube Camera Scanner" desc="Scan all six faces with your camera. Sticker colors are measured from the video and grouped using your cube's own center colors, then you review and correct them, the state is checked for physical validity, and the solver animates a solution on the 3D cube." />
      <CubeScanner />
    </div>
  );
}
