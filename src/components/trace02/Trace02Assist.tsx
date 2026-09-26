import type { AssistLevel } from "../../domain/argTypes";
import { TRACE_02_RECORDS } from "../../domain/trace02/trace02Records";

type Trace02AssistProps = {
  assistLevel: AssistLevel;
  onAssist: () => void;
};

const ASSIST_LINES: Record<Exclude<AssistLevel, 0>, string[]> = {
  1: ["THE VIEW IS NOT", "THE DOCUMENT."],
  2: ["COUNT THE CHILDREN.", "NOT THE PIXELS."],
  3: ["INSPECT", "#observation-archive", 'FILTER: [data-record-state="omitted"]', "ORDER: data-sequence"],
};

export function Trace02Assist({ assistLevel, onAssist }: Trace02AssistProps) {
  const canAdvance = assistLevel < 3;

  return (
    <aside className="trace02-assist" aria-label="Trace 02 small signal">
      <button disabled={!canAdvance} onClick={onAssist} type="button">
        SMALL SIGNAL {canAdvance ? `// ${assistLevel + 1}` : "// 3"}
      </button>
      {assistLevel > 0 && (
        <div className="trace02-assist__signals" aria-live="polite">
          {([1, 2, 3] as const)
            .filter((level) => level <= assistLevel)
            .map((level) => (
              <p key={level}>
                <span>assist // {level}</span>
                {ASSIST_LINES[level].map((line) => (
                  <strong key={line}>{line}</strong>
                ))}
              </p>
            ))}
        </div>
      )}
      {assistLevel >= 3 && (
        <div className="trace02-transcript">
          <h3>DOCUMENT TRANSCRIPT</h3>
          <table>
            <thead>
              <tr>
                <th scope="col">Element</th>
                <th scope="col">Record</th>
                <th scope="col">State</th>
                <th scope="col">Sequence</th>
                <th scope="col">Fragment</th>
              </tr>
            </thead>
            <tbody>
              {TRACE_02_RECORDS.map((record) => (
                <tr key={record.id}>
                  <td>article</td>
                  <td>{record.id}</td>
                  <td>{record.state}</td>
                  <td>{record.sequence}</td>
                  <td>{record.fragment ?? "none"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </aside>
  );
}
