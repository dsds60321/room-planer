"use client";

import { Suspense } from "react";

import { RoomMeasureForm } from "@/components/measure/room-measure-form";

export function MeasurePage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <Suspense
          fallback={
            <div className="rounded-[20px] border border-border bg-white p-6">
              실측 화면을 불러오는 중입니다.
            </div>
          }
        >
          <RoomMeasureForm />
        </Suspense>
      </main>
    </div>
  );
}
