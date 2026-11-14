import museum3dJson from "@/content/museum-3d.json";

export type Exhibit = {
  id: string;
  name: string;
  description: string;
  image: string;
  x: number;
  z: number;
};

export type Hall = {
  width: number;
  depth: number;
  height: number;
};

export type Museum3D = {
  spotId: string;
  hall: Hall;
  exhibits: Exhibit[];
};

const museums = museum3dJson as Museum3D[];

export function getMuseums3D(): Museum3D[] {
  return museums;
}

export function getMuseum3D(spotId: string): Museum3D | undefined {
  return museums.find((m) => m.spotId === spotId);
}
