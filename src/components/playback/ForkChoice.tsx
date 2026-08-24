import { useTranslation } from "react-i18next";
import type { Frame } from "../../domain/models";

interface ForkChoiceProps {
  /** Les frames-enfants parmi lesquelles choisir (un embranchement, voir docs/DATA_MODEL.md §9). */
  options: Frame[];
  onChoose: (id: string) => void;
  /** Désactive les boutons pendant qu'une transition est déjà en cours d'animation. */
  disabled?: boolean;
}

/** Boutons de choix de branche, réutilisés par le pas à pas et le mode fluide. */
export function ForkChoice({ options, onChoose, disabled = false }: ForkChoiceProps) {
  const { t } = useTranslation();
  return (
    <div className="fork-choice">
      <p>{t("playback.chooseBranch")}</p>
      <div className="fork-choice-options">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChoose(option.id)}
            disabled={disabled}
          >
            {option.branchLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
