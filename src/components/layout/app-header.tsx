"use client";

import { Redo2, Save, Undo2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  projectName: string;
  saveStatus: string;
  onUndo?: () => void;
  onRedo?: () => void;
  disableUndo?: boolean;
  disableRedo?: boolean;
  className?: string;
}

export function AppHeader({
  projectName,
  saveStatus,
  onUndo,
  onRedo,
  disableUndo,
  disableRedo,
  className,
}: AppHeaderProps) {
  return (
    <header className={`border-b border-border bg-white/95 ${className ?? ""}`}>
      <div className="mx-auto flex w-full max-w-[1840px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Room Planner
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {projectName}
            </h1>
            <Badge variant="outline" className="rounded-md bg-muted/50">
              <Save className="mr-1 size-3.5" />
              {saveStatus}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onUndo}
            disabled={disableUndo}
          >
            <Undo2 />
            되돌리기
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onRedo}
            disabled={disableRedo}
          >
            <Redo2 />
            다시하기
          </Button>
        </div>
      </div>
    </header>
  );
}
