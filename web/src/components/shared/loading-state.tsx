import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardLoadingState() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading content">
      <div className="space-y-2 pb-4 border-b">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx}>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-4 border-b pb-3 last:border-0"
            >
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function TableLoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 rounded-lg border p-3.5"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function CardLoadingSkeleton({
  rows = 4,
  cards = 1,
}: {
  rows?: number;
  cards?: number;
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: cards }).map((_, idx) => (
        <Card key={idx}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent>
            <TableLoadingSkeleton rows={rows} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

