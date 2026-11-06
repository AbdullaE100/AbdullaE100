"use client";
import { useSearch } from "./search-context";
import { Button } from "@/components/ui/button";

export function ClearFiltersButton() {
  const { filters, replace } = useSearch();
  return (
    <Button variant="secondary" size="md" className="h-10" onClick={() => replace({ type: filters.type })}>
      Clear filters
    </Button>
  );
}
