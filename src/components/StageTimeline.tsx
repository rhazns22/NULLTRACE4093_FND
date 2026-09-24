import { ARG_STAGES, type ArgStage } from "../domain/argTypes";

type StageTimelineProps = {
  currentStage: ArgStage;
};

export function StageTimeline({ currentStage }: StageTimelineProps) {
  const activeIndex = ARG_STAGES.indexOf(currentStage);

  return (
    <ol className="stage-timeline" aria-label="Stage progression">
      {ARG_STAGES.map((stage, index) => (
        <li
          className="stage-timeline__item"
          data-active={stage === currentStage}
          data-complete={index < activeIndex}
          key={stage}
        >
          <span className="stage-timeline__index">{String(index + 1).padStart(2, "0")}</span>
          <span className="stage-timeline__label">{stage}</span>
        </li>
      ))}
    </ol>
  );
}
