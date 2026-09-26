export type Trace02Record = {
  id: string;
  sequence: number;
  state: "displayed" | "omitted";
  label: string;
  fragment?: string;
  timestamp: string;
};

export const TRACE_02_RECORDS: Trace02Record[] = [
  {
    id: "NT-02-R01",
    sequence: 1,
    state: "displayed",
    label: "surface record retained",
    timestamp: "00:13:07",
  },
  {
    id: "NT-02-R02",
    sequence: 2,
    state: "omitted",
    label: "document record withheld",
    fragment: "RESTORE",
    timestamp: "00:13:11",
  },
  {
    id: "NT-02-R03",
    sequence: 3,
    state: "omitted",
    label: "document record withheld",
    fragment: "THE",
    timestamp: "00:13:17",
  },
  {
    id: "NT-02-R04",
    sequence: 4,
    state: "displayed",
    label: "view record retained",
    timestamp: "00:13:23",
  },
  {
    id: "NT-02-R05",
    sequence: 5,
    state: "omitted",
    label: "document record withheld",
    fragment: "OMITTED",
    timestamp: "00:13:29",
  },
  {
    id: "NT-02-R06",
    sequence: 6,
    state: "displayed",
    label: "archive record retained",
    timestamp: "00:13:31",
  },
  {
    id: "NT-02-R07",
    sequence: 7,
    state: "omitted",
    label: "document record withheld",
    fragment: "RECORD",
    timestamp: "00:13:37",
  },
];

export const OMITTED_TRACE_02_RECORDS = TRACE_02_RECORDS.filter(
  (record) => record.state === "omitted",
);

export const TRACE_02_COMMENT_LINES = [
  "NT-TRACE-02",
  "THE VIEW CONTAINS THREE.",
  "THE DOCUMENT CONTAINS SEVEN.",
  "READ THE OMITTED RECORDS IN DOCUMENT SEQUENCE.",
] as const;

export function getTrace02ExpectedCommand(): string {
  return OMITTED_TRACE_02_RECORDS
    .slice()
    .sort((left, right) => left.sequence - right.sequence)
    .map((record) => record.fragment)
    .join(" ");
}
