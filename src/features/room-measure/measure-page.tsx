"use client";

import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { useActiveFloorplan } from "@/features/project-shell/use-active-floorplan";
import { RoomMeasureForm } from "@/components/measure/room-measure-form";

export function MeasurePage({
  homeId,
  floorplanId,
}: {
  homeId: string;
  floorplanId: string;
}) {
  const { home, floorplan, isReady, error } = useActiveFloorplan(homeId, floorplanId);
  const editorPath = `/homes/${homeId}/floorplans/${floorplanId}`;

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#f3f4f6]">
        <main className="mx-auto max-w-[1600px] px-6 py-6">
          <div className="rounded-[20px] border border-border bg-white p-6">
            실측 화면을 불러오는 중입니다.
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f3f4f6]">
        <main className="mx-auto max-w-[960px] px-6 py-10">
          <div className="rounded-[20px] border border-border bg-white px-6 py-10 text-center">
            <h1 className="text-xl font-semibold">실측 데이터를 불러오지 못했습니다</h1>
            <p className="mt-2 text-sm text-muted-foreground">{(error as Error).message}</p>
            <Button className="mt-5" asChild>
              <Link href="/">집 선택으로 돌아가기</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!home || !floorplan) {
    return (
      <div className="min-h-screen bg-[#f3f4f6]">
        <main className="mx-auto max-w-[960px] px-6 py-10">
          <div className="rounded-[20px] border border-border bg-white px-6 py-10 text-center">
            <h1 className="text-xl font-semibold">도면 정보를 찾을 수 없습니다</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              도면 목록으로 돌아가 다시 선택해 주세요.
            </p>
            <Button className="mt-5" asChild>
              <Link href="/">집 선택으로 돌아가기</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <section className="mb-6 rounded-[20px] border border-border bg-white px-5 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              홈
            </Link>
            <span>/</span>
            <Link href={`/homes/${homeId}`} className="hover:text-foreground">
              {home.name}
            </Link>
            <span>/</span>
            <Link href={editorPath} className="hover:text-foreground">
              {floorplan.name}
            </Link>
            <span>/</span>
            <span className="text-foreground">방 측정</span>
          </div>
        </section>
        <Suspense
          fallback={
            <div className="rounded-[20px] border border-border bg-white p-6">
              실측 화면을 불러오는 중입니다.
            </div>
          }
        >
          <RoomMeasureForm editorPath={editorPath} />
        </Suspense>
      </main>
    </div>
  );
}
