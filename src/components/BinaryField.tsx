import type { CSSProperties } from "react";
import { BINARY_CLUES } from "../domain/binaryClues";

type BinaryStyle = CSSProperties & {
  "--x": string;
  "--y": string;
  "--fragment-delay": string;
};

export function BinaryField() {
  return (
    <div className="binary-field" aria-hidden="true">
      {BINARY_CLUES.map((clue, index) => {
        return (
          <span
            className="binary-field__fragment"
            data-clue={clue.relatesTo}
            data-tone={clue.tone}
            key={clue.id}
            style={
              {
                "--x": `${clue.x}%`,
                "--y": `${clue.y}%`,
                "--fragment-delay": `${-index * 2.3}s`,
              } as BinaryStyle
            }
          >
            {clue.value}
          </span>
        );
      })}
    </div>
  );
}
