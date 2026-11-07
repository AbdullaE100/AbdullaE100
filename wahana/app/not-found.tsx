import { ButtonLink } from "@/components/ui/button";
import { VehicleArt } from "@/components/vehicle-art";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <VehicleArt type="three-wheeler" className="w-48 text-fg-subtle/50 [--art-bg:var(--bg)]" />
      <h1 className="mt-6 text-3xl font-bold">This road doesn&apos;t go anywhere</h1>
      <p className="mt-2 max-w-md text-fg-muted">The page you&apos;re after has moved, sold, or never existed. Try a search instead.</p>
      <div className="mt-6 flex gap-3">
        <ButtonLink href="/vehicles">Browse vehicles</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}
