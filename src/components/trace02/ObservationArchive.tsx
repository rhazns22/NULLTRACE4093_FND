import { useEffect, useRef } from "react";
import { TRACE_02_COMMENT_LINES, TRACE_02_RECORDS } from "../../domain/trace02/trace02Records";

export function ObservationArchive() {
  const archiveRef = useRef<HTMLElement>(null);
  const commentRef = useRef<Comment | null>(null);

  useEffect(() => {
    const archive = archiveRef.current;

    if (!archive) {
      return;
    }

    if (!commentRef.current) {
      commentRef.current = document.createComment(`\n${TRACE_02_COMMENT_LINES.join("\n")}\n`);
    }

    const existing = Array.from(archive.childNodes).find(
      (node) => node.nodeType === Node.COMMENT_NODE && node.textContent?.includes("NT-TRACE-02"),
    );

    if (!existing) {
      archive.prepend(commentRef.current);
    }

    return () => {
      commentRef.current?.remove();
    };
  }, []);

  return (
    <section
      aria-labelledby="trace02-archive-title"
      className="trace02-archive"
      data-displayed-count="3"
      data-document-count="7"
      data-output-format="4-WORDS"
      data-trace="02"
      id="observation-archive"
      ref={archiveRef}
    >
      <div className="trace02-archive__header">
        <p className="eyebrow">TRACE // 02</p>
        <h2 id="trace02-archive-title">Observation Archive</h2>
        <dl>
          <div>
            <dt>DISPLAYED ENTRIES</dt>
            <dd>03</dd>
          </div>
          <div>
            <dt>DOCUMENT ENTRIES</dt>
            <dd>07</dd>
          </div>
        </dl>
      </div>

      <div className="trace02-records" aria-label="Displayed archive records">
        {TRACE_02_RECORDS.map((record) => (
          <article
            aria-hidden={record.state === "omitted" ? "true" : undefined}
            className="trace02-record"
            data-fragment={record.fragment}
            data-record-id={record.id}
            data-record-state={record.state}
            data-sequence={record.sequence}
            hidden={record.state === "omitted"}
            key={record.id}
          >
            <span>{String(record.sequence).padStart(2, "0")}</span>
            <strong>{record.id}</strong>
            <p>{record.label}</p>
            <small>{record.timestamp}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
