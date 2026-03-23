import { cn } from "@/lib/utils";

export function GridBackground({
  className,
  gridSize = 32,
}: {
  className?: string;
  gridSize?: number;
}) {
  return (
    <div
      className={cn("absolute inset-0 rounded-[18px]", className)}
      style={{
        backgroundColor: "#fcfcfb",
        backgroundImage:
          "linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)",
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    />
  );
}
