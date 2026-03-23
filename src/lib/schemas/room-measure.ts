import { z } from "zod";

import { type RoomType, type WallSide } from "@/types";

const roomTypes: RoomType[] = [
  "living-room",
  "bedroom",
  "kitchen",
  "bathroom",
  "balcony",
  "study",
  "utility",
];

const wallSides: WallSide[] = ["top", "right", "bottom", "left"];

const positiveNumber = (label: string) =>
  z.coerce.number().positive({ message: `${label}은(는) 0보다 커야 합니다` });

export const roomMeasureSchema = z
  .object({
    roomName: z
      .string()
      .trim()
      .min(1, { message: "방 이름을 입력해 주세요" }),
    roomType: z.enum(roomTypes, { message: "방 종류를 선택해 주세요" }),
    width: positiveNumber("가로"),
    depth: positiveNumber("세로"),
    height: positiveNumber("높이"),
    doorWall: z.enum(wallSides, { message: "문 위치를 선택해 주세요" }),
    doorOffsetMode: z.enum(["start", "center", "end"], {
      message: "문 위치 기준을 선택해 주세요",
    }),
    doorOffset: z.coerce
      .number()
      .min(0, { message: "문 시작 위치는 0 이상이어야 합니다" }),
    doorWidth: positiveNumber("문 폭"),
    doorSwingDirection: z.enum(["clockwise", "counter-clockwise"], {
      message: "문 열림 방향을 선택해 주세요",
    }),
    opensToInside: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const wallLength =
      value.doorWall === "top" || value.doorWall === "bottom"
        ? value.width
        : value.depth;
    const resolvedDoorOffset =
      value.doorOffsetMode === "start"
        ? value.doorOffset
        : value.doorOffsetMode === "center"
          ? value.doorOffset - value.doorWidth / 2
          : wallLength - value.doorOffset - value.doorWidth;

    if (value.doorWidth > wallLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["doorWidth"],
        message: "문 폭은 선택한 벽 길이보다 클 수 없습니다",
      });
    }

    if (value.doorOffset > wallLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["doorOffset"],
        message: "문 시작 위치가 벽 길이를 벗어났습니다",
      });
    }

    if (resolvedDoorOffset < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["doorOffset"],
        message: "선택한 기준으로 문이 벽 밖으로 벗어났습니다",
      });
    }

    if (resolvedDoorOffset + value.doorWidth > wallLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["doorOffset"],
        message: "문 위치와 문 폭의 합이 벽 길이를 넘을 수 없습니다",
      });
    }
  });

export type RoomMeasureFormValues = z.input<typeof roomMeasureSchema>;
export type RoomMeasureSubmitValues = z.output<typeof roomMeasureSchema>;
