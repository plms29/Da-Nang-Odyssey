// Shared contracts between modules (KH mục 9, 10). Workers must not change these without the main session.

export type ContentStatus = "draft" | "verified";

export type Theme =
  | "di-san-cham"
  | "lich-su-giu-thanh"
  | "lang-nghe"
  | "nghe-thuat-dan-gian"
  | "am-thuc"
  | "do-thi-song-le-hoi";

export interface Source {
  title: string;
  url: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface CheckinArea extends LatLng {
  radius_m: number;
}

/** C1 — one cultural spot. `id` is the shared spot_id key for every module. */
export interface Spot {
  id: string;
  name: string;
  theme: Theme;
  checkin: CheckinArea;
  /** Verified knowledge base text: the only facts Gemini may use for this spot. */
  story: string;
  /** Seconds this spot takes in a tour (B1 time budget). */
  tour_seconds: number;
  /** Order along the river route, used by B1 to keep tour stops on one path. */
  route_order: number;
  image: string;
  frame: string;
  caption_fallback: string;
  /** Prebuilt tour narration, used when Gemini fails (KH mục 5). */
  narration_fallback: string;
  sources: Source[];
  status: ContentStatus;
}

export type Hints = [string, string, string];

export interface MapPinStation {
  id: string;
  type: "map_pin";
  clue: string;
  target: CheckinArea;
  hints: Hints;
}

export interface JigsawStation {
  id: string;
  type: "jigsaw";
  instruction: string;
  image: string;
  grid: [number, number];
  hints: Hints;
}

/** Items are stored in the correct order; the UI shuffles them. */
export interface OrderStation {
  id: string;
  type: "order";
  instruction: string;
  items: { id: string; label: string }[];
  hints: Hints;
}

/** Pairs are stored matched; the UI shuffles the right side. (P1) */
export interface MatchStation {
  id: string;
  type: "match";
  instruction: string;
  pairs: { id: string; left: string; right: string }[];
  hints: Hints;
}

export interface RubricCriterion {
  id: string;
  desc: string;
  must_include?: string[];
}

export interface ExpressStation {
  id: string;
  type: "open_text_or_voice" | "open_drawing";
  prompt: string;
  /** Model sentence for the voice station (bài chòi), optional. */
  sample?: string;
  max_seconds?: number;
  max_chars: number;
  rubric: RubricCriterion[];
}

export type ActivityStation = MapPinStation | JigsawStation | OrderStation | MatchStation;
export type Station = ActivityStation | ExpressStation;

/** C2 — one fixed level: intro, three stations (Tìm, Làm, Thể hiện), reveal. */
export interface Level {
  id: string;
  order: number;
  title: string;
  spot_ids: string[];
  intro: { text: string; audio?: string; image?: string };
  stations: [MapPinStation, ActivityStation, ExpressStation];
  reveal: { text: string; sources: Source[] };
  status: ContentStatus;
}

/** F4 output: activity scoring is mode-agnostic (Khám phá and 5 phút share it). */
export interface StationResult {
  correct: boolean;
  score: number;
  hints_used: number;
}

/** B2 output (KH mục 10). Server computes score and stars from criteria. */
export interface JudgeResult {
  criteria: { id: string; score: 0 | 1 | 2 | 3; evidence: string }[];
  score: number;
  stars: 1 | 2 | 3;
  praise: string;
  addition: string;
  graded_by: "gemini" | "fallback";
  /** Gemini's transcript of a voice answer, when one was sent. */
  transcript?: string;
}

export interface JudgeRequest {
  level_id: string;
  station_id: string;
  /** May be empty when `audio` is sent. */
  text: string;
  /** Voice answer (KH mục 7). Never stored or logged; forwarded to Gemini then dropped. */
  audio?: { mime: string; data_base64: string };
}

export type StampKind = "level" | "tour" | "visited";

export interface TourStop {
  spot_id: string;
  narration: string;
  transition: string;
  seconds: number;
}

export interface TourPlan {
  stops: TourStop[];
  generated_by: "gemini" | "fallback";
}
