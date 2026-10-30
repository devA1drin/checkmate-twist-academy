import { PageHeader } from "@/components/ui/page-header";
import { CubeScanner } from "./cube-scanner";
export const metadata = { title: "Cube Camera Scanner" };
export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <PageHeader eyebrow="Cube · Scanner" title="Scan a cube with your camera" desc="Show each face to the camera. The app measures every sticker's colour and groups them around the six centres. You check each face, impossible cubes are rejected, and the solution plays on the 3D cube." />
      <CubeScanner />
    </div>
  );
}
