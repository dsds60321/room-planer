import {
  type Floorplan,
  type FloorplanDocument,
  type Home,
  type HomeListItem,
} from "@/types";

export interface HomeFloorplansResponse {
  home: Home;
  floorplans: Floorplan[];
}

export interface FloorplanDocumentResponse {
  home: Home;
  floorplan: Floorplan;
  document: FloorplanDocument;
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(payload?.message ?? "요청 처리 중 오류가 발생했습니다.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getHomes() {
  return request<HomeListItem[]>("/api/homes");
}

export function createHome(name: string) {
  return request<Home>("/api/homes", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function renameHome(homeId: string, name: string) {
  return request<Home>(`/api/homes/${homeId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteHome(homeId: string) {
  return request<void>(`/api/homes/${homeId}`, {
    method: "DELETE",
  });
}

export function getHomeFloorplans(homeId: string) {
  return request<HomeFloorplansResponse>(`/api/homes/${homeId}/floorplans`);
}

export function createFloorplan(homeId: string, name: string) {
  return request<Floorplan>(`/api/homes/${homeId}/floorplans`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function renameFloorplan(homeId: string, floorplanId: string, name: string) {
  return request<Floorplan>(`/api/homes/${homeId}/floorplans/${floorplanId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteFloorplan(homeId: string, floorplanId: string) {
  return request<void>(`/api/homes/${homeId}/floorplans/${floorplanId}`, {
    method: "DELETE",
  });
}

export function getFloorplanDocument(homeId: string, floorplanId: string) {
  return request<FloorplanDocumentResponse>(
    `/api/homes/${homeId}/floorplans/${floorplanId}/document`,
  );
}

export function saveFloorplanDocument(
  homeId: string,
  floorplanId: string,
  document: FloorplanDocument,
) {
  return request<FloorplanDocumentResponse>(
    `/api/homes/${homeId}/floorplans/${floorplanId}/document`,
    {
      method: "PUT",
      body: JSON.stringify(document),
    },
  );
}
