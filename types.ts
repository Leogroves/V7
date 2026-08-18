export type Attraction = {
  id: string;
  name: string;
  description: string;
  state: string;
  category: string;
  latitude: number;
  longitude: number;
  image?: string;
  images?: string[];
  website?: string;
  address?: string;
  phone?: string;
  source: "NPS" | "RIDB" | "Sample";
};

export type TripStop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  state: string;
};
