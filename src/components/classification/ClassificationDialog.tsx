import { useState } from "react";
import { useTranslation } from "react-i18next";
import { collectDistinctValues } from "../../domain/library";
import { useActionEditorStore } from "../../state/actionEditorStore";
import { listActionsFromLibrary } from "../../state/libraryStore";
import {
  listKnownTags,
  registerTag,
  removeKnownTag,
  type TagField,
} from "../../state/tagRegistryStore";
import { TagPicker } from "./TagPicker";

interface ClassificationDialogProps {
  onClose: () => void;
}

/** Union du registre persistant (voir `tagRegistryStore.ts`) et des valeurs
 * actuellement utilisées dans la bibliothèque — au cas où une action
 * importée porte une valeur jamais passée par le sélecteur. */
function mergeSuggestions(field: TagField): string[] {
  const fromLibrary = collectDistinctValues(listActionsFromLibrary(), field);
  const fromRegistry = listKnownTags(field);
  return [...new Set([...fromRegistry, ...fromLibrary])].sort((a, b) => a.localeCompare(b));
}

/**
 * Édition du classement de bibliothèque (catégorie/système/variante, voir
 * docs/PRD.md §4.10) — sortie de la page d'édition principale sur retour
 * utilisateur direct ("ça prend énormément de place pour un truc qui doit
 * être édité une seule fois") : un sous-dialogue dédié, ouvert depuis le menu
 * secondaire plutôt que des champs toujours visibles. La catégorie est un
 * choix fermé (Attaque/Défense, retour utilisateur explicite — le sélecteur
 * n'a pas besoin d'un libellé séparé, les deux boutons parlent d'eux-mêmes),
 * système et variante restent à vocabulaire libre via `TagPicker`.
 */
export function ClassificationDialog({ onClose }: ClassificationDialogProps) {
  const { t } = useTranslation();
  const category = useActionEditorStore((s) => s.category);
  const setCategory = useActionEditorStore((s) => s.setCategory);
  const system = useActionEditorStore((s) => s.system);
  const setSystem = useActionEditorStore((s) => s.setSystem);
  const variant = useActionEditorStore((s) => s.variant);
  const setVariant = useActionEditorStore((s) => s.setVariant);

  const [systemSuggestions, setSystemSuggestions] = useState(() => mergeSuggestions("system"));
  const [variantSuggestions, setVariantSuggestions] = useState(() => mergeSuggestions("variant"));

  // Une valeur choisie/créée est enregistrée pour de bon (voir
  // `tagRegistryStore.ts`) : la retirer de CETTE action plus tard ne doit pas
  // la faire disparaître des suggestions futures, retour utilisateur direct.
  const handleSystemChange = (next: string) => {
    if (next) {
      registerTag("system", next);
      setSystemSuggestions(mergeSuggestions("system"));
    }
    setSystem(next);
  };

  const handleVariantChange = (next: string) => {
    if (next) {
      registerTag("variant", next);
      setVariantSuggestions(mergeSuggestions("variant"));
    }
    setVariant(next);
  };

  const handleRemoveSystemSuggestion = (v: string) => {
    removeKnownTag("system", v);
    setSystemSuggestions(mergeSuggestions("system"));
  };

  const handleRemoveVariantSuggestion = (v: string) => {
    removeKnownTag("variant", v);
    setVariantSuggestions(mergeSuggestions("variant"));
  };

  return (
    <>
      <div className="menu-scrim classification-scrim" onClick={onClose} />
      <div className="menu-panel classification-dialog">
        <span className="menu-section-label">{t("library.classification")}</span>

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
          suggestions={systemSuggestions}
          onChange={handleSystemChange}
          onRemoveSuggestion={handleRemoveSystemSuggestion}
          placeholder={t("library.tagPickerPlaceholder")}
        />

        <span className="classification-field-label">{t("library.variant")}</span>
        <TagPicker
          value={variant}
          suggestions={variantSuggestions}
          onChange={handleVariantChange}
          onRemoveSuggestion={handleRemoveVariantSuggestion}
          placeholder={t("library.tagPickerPlaceholder")}
        />

        <button type="button" className="primary classification-done" onClick={onClose}>
          {t("library.done")}
        </button>
      </div>
    </>
  );
}
