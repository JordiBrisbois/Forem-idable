"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MessagesPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 lg:px-6">
      <Card className="overflow-hidden border-border/60 py-0">
        <CardHeader className="gap-4 border-b border-border/60 px-6 py-6">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </CardHeader>
        <CardContent className="grid gap-6 px-6 py-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border/60 p-4">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border/60 px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 p-4">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-20 w-3/4 rounded-2xl" />
              <Skeleton className="ml-auto h-20 w-2/3 rounded-2xl" />
              <Skeleton className="h-20 w-4/5 rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
