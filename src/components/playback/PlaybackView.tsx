import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FluidPlayback } from "./FluidPlayback";
import { StepPlayback } from "./StepPlayback";

type PlaybackMode = "step" | "fluid";

/** Bascule entre les deux modes de lecture (Phase 5, docs/PRD.md §4.4). */
export function PlaybackView() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<PlaybackMode>("step");

  return (
    <>
      {mode === "step" ? <StepPlayback /> : <FluidPlayback />}

      <div className="playback-mode-switch">
        <button
          type="button"
          className={mode === "step" ? "active" : ""}
          onClick={() => setMode("step")}
        >
          {t("playback.mode.step")}
        </button>
        <button
          type="button"
          className={mode === "fluid" ? "active" : ""}
          onClick={() => setMode("fluid")}
        >
          {t("playback.mode.fluid")}
        </button>
      </div>
    </>
  );
}
