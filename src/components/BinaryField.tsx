import { useEffect, useState, type CSSProperties } from "react";
import { BINARY_CLUES } from "../domain/binaryClues";

type BinaryStyle = CSSProperties & {
  "--x": string;
  "--y": string;
  "--plx-x": string;
  "--plx-y": string;
};

export function BinaryField() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      setOffset({ x: normX, y: normY });
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="binary-field" aria-hidden="true">
      {BINARY_CLUES.map((clue, index) => {
        // Multi-depth parallax coefficient based on tone & position
        const depth = clue.tone === "thread" ? 18 : clue.tone === "low" ? 12 : 7;
        const plxX = `${(offset.x * depth * (index % 2 === 0 ? 1 : -0.7)).toFixed(2)}px`;
        const plxY = `${(offset.y * depth * (index % 2 === 0 ? 1 : 0.8)).toFixed(2)}px`;

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
                "--plx-x": plxX,
                "--plx-y": plxY,
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
