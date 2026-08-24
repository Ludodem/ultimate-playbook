import "@testing-library/jest-dom/vitest";

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
