import { useMemo, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type TouchEvent } from "react";
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
  depthZ: number;
};

type NodeStyle = CSSProperties & {
  "--x": string;
  "--y": string;
  "--node-delay": string;
};

type GlyphStyle = CSSProperties & {
  "--pointer-x": string;
  "--pointer-y": string;
  "--tilt-x": string;
  "--tilt-y": string;
  "--click-progress": string;
};

type Ripple = {
  id: number;
  x: number;
  y: number;
};

const ORBITS: OrbitSpec[] = [
  { id: "outer", nodeCount: 17, omittedSlot: 13, depthZ: 18 },
  { id: "middle", nodeCount: 13, omittedSlot: 7, depthZ: 38 },
  { id: "inner", nodeCount: 7, omittedSlot: 3, depthZ: 62 },
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

  const glyphStyle = useMemo<GlyphStyle>(
    () => ({
      "--pointer-x": `${pointer.x}%`,
      "--pointer-y": `${pointer.y}%`,
      "--tilt-x": `${pointer.tiltX}deg`,
      "--tilt-y": `${pointer.tiltY}deg`,
      "--click-progress": `${Math.min(1, clickCount / clickThreshold) * 100}%`,
    }),
    [clickCount, clickThreshold, pointer],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    onKeyboardReveal();
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
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

  function handleTouchMove(event: TouchEvent<HTMLButtonElement>) {
    if (!event.touches[0]) return;
    const touch = event.touches[0];
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
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
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const newRipple: Ripple = {
      id: Date.now() + Math.random(),
      x,
      y,
    };

    setRipples((prev) => [...prev.slice(-3), newRipple]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

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
        onTouchMove={handleTouchMove}
        onTouchEnd={handlePointerLeave}
        style={glyphStyle}
        type="button"
      >
        <span className="glyph-aura" aria-hidden="true" />
        <span className="glyph-axis" aria-hidden="true" />
        {ORBITS.map((orbit) => (
          <span
            aria-hidden="true"
            className={`glyph-orbit glyph-orbit--${orbit.id}`}
            data-missing-slot={orbit.omittedSlot}
            data-node-count={orbit.nodeCount}
            key={orbit.id}
            style={{ transform: `translate(-50%, -50%) translateZ(${orbit.depthZ}px)` }}
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
        <span className="glyph-core" aria-hidden="true" />
        <span className="glyph-press-count" aria-hidden="true">
          {currentStage === "ENTRY" ? `${clickCount}/${clickThreshold}` : currentStage}
        </span>
        <span className="motion-fallback" aria-hidden="true">
          17:13 / 13:7 / 7:3 / 4093
        </span>
        {ripples.map((ripple) => (
          <span
            aria-hidden="true"
            className="glyph-ripple"
            key={ripple.id}
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
        Press Enter while focused on this symbol to expose the input channel. Number keys also expose it.
      </p>
    </div>
  );
}

function createOrbitSlots(orbit: OrbitSpec): number[] {
  return Array.from({ length: orbit.nodeCount }, (_, index) => index + 1).filter(
    (slot) => slot !== orbit.omittedSlot,
  );
}

function getNodeStyle(slot: number, nodeCount: number, index: number): NodeStyle {
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
