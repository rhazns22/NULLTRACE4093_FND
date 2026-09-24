export type BinaryClue = {
  id: string;
  value: string;
  x: number;
  y: number;
  relatesTo: "project" | "entry-code" | "orbit-outer" | "orbit-middle" | "orbit-inner" | "cycle";
  tone: "ghost" | "low" | "thread";
};

export const BINARY_CLUES: BinaryClue[] = [
  {
    id: "null",
    value: "NT-BIN/8 01001110 01010101 01001100 01001100",
    x: 8,
    y: 18,
    relatesTo: "project",
    tone: "low",
  },
  {
    id: "trace",
    value: "NT-BIN/8 01010100 01010010 01000001 01000011 01000101",
    x: 68,
    y: 14,
    relatesTo: "project",
    tone: "ghost",
  },
  {
    id: "entry-4093",
    value: "NT-BIN/8 00110100 00110000 00111001 00110011",
    x: 72,
    y: 76,
    relatesTo: "entry-code",
    tone: "thread",
  },
  {
    id: "outer-17",
    value: "NT-BIN/8 00110001 00110111",
    x: 14,
    y: 72,
    relatesTo: "orbit-outer",
    tone: "ghost",
  },
  {
    id: "outer-gap-13",
    value: "NT-BIN/8 00110001 00110011",
    x: 28,
    y: 9,
    relatesTo: "orbit-outer",
    tone: "low",
  },
  {
    id: "middle-gap-7",
    value: "NT-BIN/8 00110111",
    x: 82,
    y: 42,
    relatesTo: "orbit-middle",
    tone: "low",
  },
  {
    id: "inner-gap-3",
    value: "NT-BIN/8 00110011",
    x: 18,
    y: 43,
    relatesTo: "orbit-inner",
    tone: "thread",
  },
  {
    id: "cycle-4093",
    value: "NT-BIN/8 00110100 00110000 00111001 00110011",
    x: 43,
    y: 88,
    relatesTo: "cycle",
    tone: "ghost",
  },
];
