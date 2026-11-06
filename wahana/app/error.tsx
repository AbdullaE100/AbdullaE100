"use client";
import { Button, ButtonLink } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <h1 className="text-3xl font-extrabold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-fg-muted">We couldn&apos;t load this page. It&apos;s probably a connection hiccup.</p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}
