import { useMemo, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

interface TagPickerProps {
  /** Valeur sélectionnée ("" = aucune) — un seul choix à la fois, voir docs/PRD.md §4.10. */
  value: string;
  /** Valeurs déjà utilisées — pas une liste fermée. */
  suggestions: string[];
  onChange: (value: string) => void;
  /** Retire une valeur des suggestions futures (croix sur chaque pastille). */
  onRemoveSuggestion?: (value: string) => void;
  placeholder?: string;
}

/**
 * Sélecteur "à la Notion" pour un champ à choix unique mais vocabulaire
 * ouvert (système/variante du classement) : cliquer ouvre un menu déroulant
 * listant les valeurs déjà utilisées sous forme de pastilles, avec un champ
 * de recherche qui double comme moyen d'en créer une nouvelle si elle
 * n'existe pas encore, et une croix sur chaque pastille pour la retirer des
 * suggestions futures.
 */
export function TagPicker({
  value,
  suggestions,
  onChange,
  onRemoveSuggestion,
  placeholder,
}: TagPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => suggestions.filter((s) => s.toLowerCase().includes(query.trim().toLowerCase())),
    [suggestions, query],
  );
  const trimmedQuery = query.trim();
  const canCreate =
    trimmedQuery.length > 0 &&
    !suggestions.some((s) => s.toLowerCase() === trimmedQuery.toLowerCase());

  const open = () => {
    setQuery("");
    setIsOpen(true);
  };

  const select = (next: string) => {
    onChange(next);
    setIsOpen(false);
    setQuery("");
  };

  // Ferme uniquement quand le focus quitte réellement le composant (pas
  // simplement l'input vers un bouton du menu déroulant) — voir `onMouseDown`
  // sur les options ci-dessous, qui empêche ce transfert de focus.
  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") setIsOpen(false);
  };

  return (
    <div className="tag-picker" ref={containerRef} onBlur={handleBlur}>
      {!isOpen && (
        <button type="button" className="tag-picker-trigger" onClick={open}>
          {value || <span className="tag-picker-placeholder">{placeholder}</span>}
        </button>
      )}

      {isOpen && (
        <div className="tag-picker-dropdown">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="tag-picker-search"
          />
          <div className="tag-picker-options">
            {value && (
              <button
                type="button"
                className="tag-picker-option tag-picker-clear"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select("")}
              >
                {t("library.tagPickerClear")}
              </button>
            )}
            {filtered.map((option) => (
              <div key={option} className="tag-picker-row">
                <button
                  type="button"
                  className={`tag-picker-pill${option === value ? " is-selected" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(option)}
                >
                  {option}
                </button>
                {onRemoveSuggestion && (
                  <button
                    type="button"
                    className="tag-picker-remove"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onRemoveSuggestion(option)}
                    aria-label={t("library.tagPickerRemove", { value: option })}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {canCreate && (
              <button
                type="button"
                className="tag-picker-option tag-picker-create"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(trimmedQuery)}
              >
                {t("library.tagPickerCreate", { value: trimmedQuery })}
              </button>
            )}
            {filtered.length === 0 && !canCreate && (
              <p className="tag-picker-empty">{t("library.tagPickerEmpty")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
