import { PageHeader } from "@/components/ui/page-header";
import { CubeScanner } from "./cube-scanner";
export const metadata = { title: "Cube Camera Scanner" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Cube · Scanner" title="Hold your cube up to the camera" desc="Scan the six faces with the camera beside a live picture of your cube, check the colours, then follow a step-by-step solution on a 3D copy of your cube. No camera? Upload a photo of each face or enter the colours by hand." />
      <CubeScanner />
    </div>
  );
}
