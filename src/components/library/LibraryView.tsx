import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { computeLibraryTree, countGroupActions, type LibraryGroup } from "../../domain/library";
import type { Action } from "../../domain/models";
import { useActionEditorStore } from "../../state/actionEditorStore";
import {
  deleteActionFromLibrary,
  listActionsFromLibrary,
  saveActionToLibrary,
} from "../../state/libraryStore";

interface LibraryViewProps {
  onCreateNew: () => void;
}

function findGroupAtPath(groups: LibraryGroup[], path: string[]): LibraryGroup | null {
  let level = groups;
  let current: LibraryGroup | null = null;
  for (const key of path) {
    const found = level.find((g) => g.key === key);
    if (!found) return null;
    current = found;
    level = found.children;
  }
  return current;
}

/**
 * Écran d'accueil de l'app (docs/PRD.md §4.10) : liste des actions
 * sauvegardées localement, navigables en drill-down par category → system →
 * variant (`domain/library.ts`). Remplace la reprise automatique de la
 * dernière action éditée — voir docs/ARCHITECTURE.md §8.
 */
export function LibraryView({ onCreateNew }: LibraryViewProps) {
  const { t } = useTranslation();
  const loadAction = useActionEditorStore((s) => s.loadAction);
  const [actions, setActions] = useState<Action[]>(() => listActionsFromLibrary());
  const [path, setPath] = useState<string[]>([]);

  const tree = useMemo(() => computeLibraryTree(actions), [actions]);
  const currentGroup = path.length === 0 ? null : findGroupAtPath(tree, path);
  const groups = path.length === 0 ? tree : (currentGroup?.children ?? []);
  const directActions = path.length === 0 ? [] : (currentGroup?.actions ?? []);
  const isEmpty = groups.length === 0 && directActions.length === 0;

  const refresh = () => setActions(listActionsFromLibrary());

  const handleDuplicate = (action: Action) => {
    const now = new Date().toISOString();
    saveActionToLibrary({
      ...action,
      id: crypto.randomUUID(),
      name: `${action.name} (copie)`,
      createdAt: now,
      updatedAt: now,
    });
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteActionFromLibrary(id);
    refresh();
  };

  const groupLabel = (key: string) => key || t("library.unclassified");

  return (
    <div className="library-view">
      <button type="button" className="primary library-create" onClick={onCreateNew}>
        {t("library.createNew")}
      </button>

      {path.length > 0 && (
        <nav className="library-breadcrumb">
          <button type="button" onClick={() => setPath([])}>
            {t("library.root")}
          </button>
          {path.map((key, index) => (
            <span key={index}>
              {" / "}
              <button type="button" onClick={() => setPath(path.slice(0, index + 1))}>
                {groupLabel(key)}
              </button>
            </span>
          ))}
        </nav>
      )}

      {isEmpty && path.length === 0 && <p className="hint">{t("library.empty")}</p>}

      {groups.length > 0 && (
        <div className="library-groups">
          {groups.map((group) => (
            <button
              key={group.key}
              type="button"
              className="library-group-tile"
              onClick={() => setPath([...path, group.key])}
            >
              <span>{groupLabel(group.key)}</span>
              <span className="library-group-count">{countGroupActions(group)}</span>
            </button>
          ))}
        </div>
      )}

      {directActions.length > 0 && (
        <div className="library-actions">
          {directActions.map((action) => (
            <div key={action.id} className="library-action-card">
              <button
                type="button"
                className="library-action-open"
                onClick={() => loadAction(action)}
              >
                {action.name}
              </button>
              <div className="library-action-buttons">
                <button type="button" onClick={() => handleDuplicate(action)}>
                  {t("library.duplicate")}
                </button>
                <button type="button" className="danger" onClick={() => handleDelete(action.id)}>
                  {t("library.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
