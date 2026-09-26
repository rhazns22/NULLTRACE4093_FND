import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { ArgStage } from "../domain/argTypes";

type ObservationGlyphProps = {
  currentStage: ArgStage;
  clickCount: number;
  clickThreshold: number;
  onGlyphClick: () => void;
  onKeyboardReveal: () => void;
};

type OrbitSpec = {
  id: "outer" | "middle" | "inner";
  nodeCount: number;
  omittedSlot: number;
};

type NodeStyle = CSSProperties & {
  "--x": string;
  "--y": string;
  "--node-delay": string;
};

type GlyphStyle = CSSProperties & {
  "--pointer-x": string;
  "--pointer-y": string;
  "--offset-x": string;
  "--offset-y": string;
  "--click-progress": string;
};

type Ripple = {
  id: number;
  x: number;
  y: number;
};

const ORBITS: OrbitSpec[] = [
  { id: "outer", nodeCount: 17, omittedSlot: 13 },
  { id: "middle", nodeCount: 13, omittedSlot: 7 },
  { id: "inner", nodeCount: 7, omittedSlot: 3 },
];

export function ObservationGlyph({
  currentStage,
  clickCount,
  clickThreshold,
  onGlyphClick,
  onKeyboardReveal,
}: ObservationGlyphProps) {
  const [pointer, setPointer] = useState({
    x: 50,
    y: 50,
    tiltX: 0,
    tiltY: 0,
  });
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function clearContactMotion() {
      if (preference.matches) setRipples([]);
    }
    preference.addEventListener("change", clearContactMotion);
    return () => preference.removeEventListener("change", clearContactMotion);
  }, []);

  function emitRipple(x: number, y: number) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ripple = { id: ++rippleId.current, x, y };
    setRipples((current) => [...current.slice(-3), ripple]);
  }

  const glyphStyle = useMemo<GlyphStyle>(
    () => ({
      "--pointer-x": `${pointer.x}%`,
      "--pointer-y": `${pointer.y}%`,
      "--offset-x": `${pointer.tiltY}px`,
      "--offset-y": `${-pointer.tiltX}px`,
      "--click-progress": `${Math.min(1, clickCount / clickThreshold) * 100}%`,
    }),
    [clickCount, clickThreshold, pointer],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    emitRipple(50, 50);
    onKeyboardReveal();
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const centeredX = x - 50;
    const centeredY = y - 50;

    setPointer({
      x: clamp(x, 0, 100),
      y: clamp(y, 0, 100),
      tiltX: clamp(centeredY / -8.5, -5.5, 5.5),
      tiltY: clamp(centeredX / 8.5, -5.5, 5.5),
    });
  }

  function handlePointerLeave() {
    setPointer({
      x: 50,
      y: 50,
      tiltX: 0,
      tiltY: 0,
    });
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x =
      event.detail === 0
        ? 50
        : ((event.clientX - rect.left) / rect.width) * 100;
    const y =
      event.detail === 0
        ? 50
        : ((event.clientY - rect.top) / rect.height) * 100;
    emitRipple(x, y);
    onGlyphClick();
  }

  return (
    <div className="glyph-frame">
      <button
        aria-describedby="glyph-a11y-hint"
        aria-label="Unlabeled circular observation symbol"
        className="glyph-control"
        data-armed={clickCount > 0}
        data-clicks={clickCount}
        data-stage={currentStage}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onPointerLeave={handlePointerLeave}
        onPointerMove={handlePointerMove}
        style={glyphStyle}
        type="button"
      >
        <svg
          className="glyph-calibration"
          viewBox="0 0 600 600"
          aria-hidden="true"
        >
          <circle
            className="calibration-boundary"
            cx="300"
            cy="300"
            r="276"
            pathLength="1"
          />
          <circle className="calibration-inner" cx="300" cy="300" r="259" />
          {Array.from({ length: 23 * 4 }, (_, index) => (
            <line
              key={index}
              x1="300"
              y1="24"
              x2="300"
              y2={index % 4 === 0 ? "38" : "30"}
              transform={`rotate(${(index * 360) / 92} 300 300)`}
              className={
                index % 4 === 0
                  ? "calibration-tick calibration-tick--major"
                  : "calibration-tick"
              }
            />
          ))}
          <path
            className="calibration-cross"
            d="M300 0v56 M300 544v56 M0 300h56 M544 300h56 M300 103v394 M103 300h394"
          />
          <path
            className="calibration-arc"
            pathLength="1"
            d="M106 106 A274 274 0 0 1 494 106 M494 494 A274 274 0 0 1 106 494"
          />
          <path
            className="calibration-diamond"
            d="M300 285 315 300 300 315 285 300Z M300 292v16 M292 300h16"
          />
          <g className="calibration-sweep">
            <path d="M300 44 A256 256 0 0 1 428 78.3" />
            <path
              className="calibration-sweep__tail"
              d="M172 78.3 A256 256 0 0 1 300 44"
            />
          </g>
        </svg>
        <span
          className="glyph-stage-wave"
          key={currentStage}
          aria-hidden="true"
        />
        {ORBITS.map((orbit) => (
          <span
            aria-hidden="true"
            className={`glyph-orbit glyph-orbit--${orbit.id}`}
            data-missing-slot={orbit.omittedSlot}
            data-node-count={orbit.nodeCount}
            key={orbit.id}
          >
            {createOrbitSlots(orbit).map((slot, index) => (
              <span
                className="glyph-node"
                data-slot={slot}
                key={`${orbit.id}-${slot}`}
                style={getNodeStyle(slot, orbit.nodeCount, index)}
              />
            ))}
          </span>
        ))}
        <span className="glyph-progress" aria-hidden="true" />
        <span className="glyph-press-count" aria-hidden="true">
          {currentStage === "ENTRY"
            ? `${clickCount}/${clickThreshold}`
            : currentStage}
        </span>
        <span className="motion-fallback" aria-hidden="true">
          17:13 / 13:7 / 7:3 / 4093
        </span>
        {ripples.map((ripple) => (
          <span
            aria-hidden="true"
            className="glyph-ripple"
            key={ripple.id}
            onAnimationEnd={() =>
              setRipples((current) =>
                current.filter((item) => item.id !== ripple.id),
              )
            }
            style={
              {
                "--ripple-x": `${ripple.x}%`,
                "--ripple-y": `${ripple.y}%`,
              } as CSSProperties
            }
          />
        ))}
      </button>
      <p className="sr-only" id="glyph-a11y-hint">
        Press Enter while focused on this symbol to expose the input channel.
        Number keys also expose it.
      </p>
    </div>
  );
}

function createOrbitSlots(orbit: OrbitSpec): number[] {
  return Array.from(
    { length: orbit.nodeCount },
    (_, index) => index + 1,
  ).filter((slot) => slot !== orbit.omittedSlot);
}

function getNodeStyle(
  slot: number,
  nodeCount: number,
  index: number,
): NodeStyle {
  const angle = ((slot - 1) / nodeCount) * Math.PI * 2 - Math.PI / 2;
  const radius = 49;
  const x = 50 + Math.cos(angle) * radius;
  const y = 50 + Math.sin(angle) * radius;

  return {
    "--x": `${x}%`,
    "--y": `${y}%`,
    "--node-delay": `${index * 73}ms`,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
