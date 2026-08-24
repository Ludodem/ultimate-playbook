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
    <div>
      <div className="playback-mode-switch">
        <button type="button" onClick={() => setMode("step")} disabled={mode === "step"}>
          {t("playback.mode.step")}
        </button>
        <button type="button" onClick={() => setMode("fluid")} disabled={mode === "fluid"}>
          {t("playback.mode.fluid")}
        </button>
      </div>
      {mode === "step" ? <StepPlayback /> : <FluidPlayback />}
    </div>
  );
}
