import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { collectDistinctValues } from "../../domain/library";
import { useActionEditorStore } from "../../state/actionEditorStore";
import { listActionsFromLibrary } from "../../state/libraryStore";
import { TagPicker } from "./TagPicker";

interface ClassificationDialogProps {
  onClose: () => void;
}

/**
 * Édition du classement de bibliothèque (catégorie/système/variante, voir
 * docs/PRD.md §4.10) — sortie de la page d'édition principale sur retour
 * utilisateur direct ("ça prend énormément de place pour un truc qui doit
 * être édité une seule fois") : un sous-dialogue dédié, ouvert depuis le menu
 * secondaire plutôt que des champs toujours visibles. La catégorie est un
 * choix fermé (Attaque/Défense, retour utilisateur explicite), système et
 * variante restent à vocabulaire libre via `TagPicker`.
 */
export function ClassificationDialog({ onClose }: ClassificationDialogProps) {
  const { t } = useTranslation();
  const category = useActionEditorStore((s) => s.category);
  const setCategory = useActionEditorStore((s) => s.setCategory);
  const system = useActionEditorStore((s) => s.system);
  const setSystem = useActionEditorStore((s) => s.setSystem);
  const variant = useActionEditorStore((s) => s.variant);
  const setVariant = useActionEditorStore((s) => s.setVariant);

  // Suggestions (pas une liste fermée) — recalculées une fois par ouverture,
  // une légère péremption est acceptable pour un simple confort de saisie.
  const suggestions = useMemo(() => {
    const libraryActions = listActionsFromLibrary();
    return {
      system: collectDistinctValues(libraryActions, "system"),
      variant: collectDistinctValues(libraryActions, "variant"),
    };
  }, []);

  return (
    <>
      <div className="menu-scrim classification-scrim" onClick={onClose} />
      <div className="menu-panel classification-dialog">
        <span className="menu-section-label">{t("library.classification")}</span>

        <span className="classification-field-label">{t("library.category")}</span>
        <div className="orientation-switch">
          <button
            type="button"
            className={category === "Attaque" ? "active" : ""}
            onClick={() => setCategory(category === "Attaque" ? "" : "Attaque")}
          >
            {t("library.categoryOffense")}
          </button>
          <button
            type="button"
            className={category === "Défense" ? "active" : ""}
            onClick={() => setCategory(category === "Défense" ? "" : "Défense")}
          >
            {t("library.categoryDefense")}
          </button>
        </div>

        <span className="classification-field-label">{t("library.system")}</span>
        <TagPicker
          value={system}
          suggestions={suggestions.system}
          onChange={setSystem}
          placeholder={t("library.tagPickerPlaceholder")}
        />

        <span className="classification-field-label">{t("library.variant")}</span>
        <TagPicker
          value={variant}
          suggestions={suggestions.variant}
          onChange={setVariant}
          placeholder={t("library.tagPickerPlaceholder")}
        />

        <button type="button" className="primary classification-done" onClick={onClose}>
          {t("library.done")}
        </button>
      </div>
    </>
  );
}
