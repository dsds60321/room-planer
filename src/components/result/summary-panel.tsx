import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAreaMm2, formatLength } from "@/lib/utils/format";
import { getRoomTypeLabel } from "@/lib/floorplan/rendering";
import { type Room } from "@/types";

export function SummaryPanel({ rooms }: { rooms: Room[] }) {
  const totalArea = rooms.reduce((sum, room) => sum + room.area, 0);

  return (
    <Card className="rounded-[20px] border-zinc-200 bg-white">
      <CardHeader>
        <CardTitle>실별 요약</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Total Area
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatAreaMm2(totalArea)}
          </p>
        </div>
        <div className="space-y-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="grid grid-cols-[1fr_auto] gap-3 border-b border-dashed border-border pb-3 text-sm last:border-b-0 last:pb-0"
            >
              <div>
                <p className="font-medium text-foreground">{room.roomName}</p>
                <p className="text-muted-foreground">{getRoomTypeLabel(room.roomType)}</p>
              </div>
              <div className="text-right text-muted-foreground">
                <p>{formatAreaMm2(room.area)}</p>
                <p>
                  {formatLength(room.width)} / {formatLength(room.depth)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
