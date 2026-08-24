import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// Sans `test.globals: true` dans vite.config.ts, le nettoyage automatique de
// Testing Library entre les tests (démontage du DOM rendu) ne se déclenche
// pas tout seul — on l'enregistre explicitement.
afterEach(() => {
  cleanup();
});

// jsdom ne fournit pas ResizeObserver. Nos composants (ex: Field) l'utilisent
// pour être responsive ; un stub suffit en test, le rendu canvas réel étant
// validé manuellement (voir docs/ROADMAP.md, Phase 2).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
