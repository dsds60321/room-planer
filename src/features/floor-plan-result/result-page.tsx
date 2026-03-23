"use client";

import Link from "next/link";

import { ResultFloorPlanRenderer } from "@/components/floor-plan/result-floor-plan-renderer";
import { SummaryPanel } from "@/components/result/summary-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFloorPlanStore } from "@/store/use-floor-plan-store";
import { useRoomStore } from "@/store/use-room-store";

export function FloorPlanResultPage() {
  const rooms = useRoomStore((state) => state.rooms);
  const placements = useFloorPlanStore((state) => state.placedRooms);
  const mode = useFloorPlanStore((state) => state.resultRenderMode);
  const setMode = useFloorPlanStore((state) => state.setResultRenderMode);

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      <main className="result-screen mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        <section className="result-toolbar print:hidden flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-border bg-white px-6 py-5">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Final Output
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              평면도 스타일 결과물
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              편집용 강조 요소를 제거하고 외곽 벽, 내부 벽, 문 스윙, 실명 라벨 중심으로 정리한 출력 화면입니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-md bg-muted/20">
              인쇄 친화 모드
            </Badge>
            <Button
              type="button"
              variant={mode === "annotated" ? "default" : "outline"}
              onClick={() => setMode("annotated")}
            >
              치수 요약 표시
            </Button>
            <Button
              type="button"
              variant={mode === "clean" ? "default" : "outline"}
              onClick={() => setMode("clean")}
            >
              클린 출력
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/">편집으로 돌아가기</Link>
            </Button>
            <Button type="button" onClick={() => window.print()}>
              내보내기
            </Button>
          </div>
        </section>

        <div className="result-layout grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="print-floorplan-root rounded-[24px] border border-zinc-200 bg-white p-4">
            <ResultFloorPlanRenderer
              rooms={rooms}
              placements={placements}
              mode={mode}
              className="relative min-h-[760px] overflow-hidden rounded-[24px] border border-zinc-200 bg-[#fcfcfb] print:min-h-[180mm] print:rounded-none print:border-0"
            />
          </section>
          <aside className="result-sidebar print:hidden space-y-4">
            <SummaryPanel rooms={rooms} />
          </aside>
        </div>
      </main>
    </div>
  );
}
