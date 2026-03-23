"use client";

import type Konva from "konva";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { ResultFloorPlanRenderer } from "@/components/floor-plan/result-floor-plan-renderer";
import { SummaryPanel } from "@/components/result/summary-panel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveFloorplan } from "@/features/project-shell/use-active-floorplan";
import { getPlanBounds, resolvePlacedRooms } from "@/lib/floorplan/rendering";
import { useFloorPlanStore } from "@/store/use-floor-plan-store";
import { useRoomStore } from "@/store/use-room-store";

const EXPORT_PADDING = 160;
const EXPORT_BASE_SCALE = 0.18;
const EXPORT_SIZE_OPTIONS = {
  standard: {
    label: "긴 변 1800px",
    minEdge: 1080,
    maxEdge: 1800,
  },
  large: {
    label: "긴 변 2400px",
    minEdge: 1440,
    maxEdge: 2400,
  },
  xlarge: {
    label: "긴 변 3200px",
    minEdge: 1920,
    maxEdge: 3200,
  },
} as const;

type ExportSizeOption = keyof typeof EXPORT_SIZE_OPTIONS;

function getExportViewport(
  bounds: { width: number; height: number },
  sizeOption: ExportSizeOption,
) {
  const sizePreset = EXPORT_SIZE_OPTIONS[sizeOption];
  const baseWidth = Math.max(bounds.width * EXPORT_BASE_SCALE + EXPORT_PADDING * 2, 960);
  const baseHeight = Math.max(bounds.height * EXPORT_BASE_SCALE + EXPORT_PADDING * 2, 720);
  const minEdge = Math.min(baseWidth, baseHeight);
  const maxEdge = Math.max(baseWidth, baseHeight);
  const upscale = minEdge < sizePreset.minEdge ? sizePreset.minEdge / minEdge : 1;
  const downscale =
    maxEdge * upscale > sizePreset.maxEdge ? sizePreset.maxEdge / (maxEdge * upscale) : 1;
  const factor = upscale * downscale;

  return {
    width: Math.round(baseWidth * factor),
    height: Math.round(baseHeight * factor),
  };
}

function sanitizeFileNamePart(value: string) {
  const normalized = value
    .normalize("NFKC")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-");

  return normalized || "floorplan";
}

export function FloorPlanResultPage({
  homeId,
  floorplanId,
}: {
  homeId: string;
  floorplanId: string;
}) {
  const { home, floorplan, isReady, error } = useActiveFloorplan(homeId, floorplanId, false);
  const rooms = useRoomStore((state) => state.rooms);
  const placements = useFloorPlanStore((state) => state.placedRooms);
  const mode = useFloorPlanStore((state) => state.resultRenderMode);
  const setMode = useFloorPlanStore((state) => state.setResultRenderMode);
  const [exportSize, setExportSize] = useState<ExportSizeOption>("large");
  const [isExportingImage, setIsExportingImage] = useState(false);
  const exportStageRef = useRef<Konva.Stage | null>(null);
  const editorPath = `/homes/${homeId}/floorplans/${floorplanId}`;
  const floorplanPath = `/homes/${homeId}`;
  const exportViewport = useMemo(() => {
    const placedRooms = resolvePlacedRooms(rooms, placements);
    const bounds = getPlanBounds(placedRooms);

    return getExportViewport(bounds, exportSize);
  }, [exportSize, placements, rooms]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#f5f5f4]">
        <main className="mx-auto max-w-[1600px] px-6 py-6">
          <div className="rounded-[24px] border border-border bg-white p-6">
            결과 화면을 불러오는 중입니다.
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f4]">
        <main className="mx-auto max-w-[960px] px-6 py-10">
          <div className="rounded-[24px] border border-border bg-white px-6 py-10 text-center">
            <h1 className="text-xl font-semibold">결과 데이터를 불러오지 못했습니다</h1>
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
      <div className="min-h-screen bg-[#f5f5f4]">
        <main className="mx-auto max-w-[960px] px-6 py-10">
          <div className="rounded-[24px] border border-border bg-white px-6 py-10 text-center">
            <h1 className="text-xl font-semibold">도면 정보를 찾을 수 없습니다</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              도면 선택 화면으로 돌아가 다시 선택해 주세요.
            </p>
            <Button className="mt-5" asChild>
              <Link href="/">집 선택으로 돌아가기</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleDownloadImage = async () => {
    const stage = exportStageRef.current;

    if (!stage || isExportingImage) {
      return;
    }

    setIsExportingImage(true);

    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      stage.batchDraw();
      const blob = (await stage.toBlob({
        mimeType: "image/png",
        pixelRatio: 1,
      })) as Blob | null;

      if (!blob) {
        throw new Error("PNG blob generation failed");
      }

      const link = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = `${sanitizeFileNamePart(home.name)}-${sanitizeFileNamePart(floorplan.name)}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      console.error(downloadError);
      window.alert("PNG 파일을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      <main className="result-screen mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        <section className="print:hidden rounded-[22px] border border-border bg-white px-6 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              홈
            </Link>
            <span>/</span>
            <Link href={floorplanPath} className="hover:text-foreground">
              {home.name}
            </Link>
            <span>/</span>
            <Link href={editorPath} className="hover:text-foreground">
              {floorplan.name}
            </Link>
            <span>/</span>
            <span className="text-foreground">결과 보기</span>
          </div>
        </section>

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
            <p className="mt-1 text-xs text-muted-foreground">
              PNG 크기: {exportViewport.width} x {exportViewport.height}px
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
              <Link href={editorPath}>편집으로 돌아가기</Link>
            </Button>
            <Select
              value={exportSize}
              onValueChange={(value) => setExportSize(value as ExportSizeOption)}
            >
              <SelectTrigger className="w-[148px] bg-white" size="default">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXPORT_SIZE_OPTIONS).map(([value, option]) => (
                  <SelectItem key={value} value={value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={handleDownloadImage} disabled={isExportingImage}>
              {isExportingImage ? "PNG 생성 중..." : "PNG 다운로드"}
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
              showGridBackground
              className="relative min-h-[760px] overflow-hidden rounded-[24px] border border-zinc-200 bg-[#fcfcfb] print:min-h-[180mm] print:rounded-none print:border-0"
            />
          </section>
          <aside className="result-sidebar print:hidden space-y-4">
            <SummaryPanel rooms={rooms} />
          </aside>
        </div>

        <ResultFloorPlanRenderer
          rooms={rooms}
          placements={placements}
          mode={mode}
          showGridBackground
          stageRef={exportStageRef}
          padding={EXPORT_PADDING}
          viewportOverride={exportViewport}
          className="pointer-events-none fixed top-0 -left-[9999px] overflow-hidden bg-[#fcfcfb]"
        />
      </main>
    </div>
  );
}
