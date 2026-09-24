export type NtBin8 = `NT-BIN/8 ${string}`;

const NT_BIN_PREFIX = "NT-BIN/8";

export function decodeNtBin8(value: string): string {
  return value
    .replace(NT_BIN_PREFIX, "")
    .trim()
    .split(/\s+/)
    .filter((group) => /^[01]{8}$/.test(group))
    .map((group) => String.fromCharCode(Number.parseInt(group, 2)))
    .join("");
}

export function splitNtBin8(value: NtBin8, groupSize = 4): string[] {
  const groups = value.replace(NT_BIN_PREFIX, "").trim().split(/\s+/);
  const lines = [NT_BIN_PREFIX];

  for (let index = 0; index < groups.length; index += groupSize) {
    lines.push(groups.slice(index, index + groupSize).join(" "));
  }

  return lines;
}
