import { useEffect, useState, useCallback } from "react";

const KONAMI_SEQUENCE = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a",
];

const FISZ_SEQUENCE = ["f", "i", "s", "z"];

export const useKonamiCode = (onActivate?: () => void) => {
  const [activated, setActivated] = useState(false);
  const [showDrunk, setShowDrunk] = useState(false);

  useEffect(() => {
    if (activated) return;
    let idx = 0;
    let fiszIdx = 0;

    const handler = (e: KeyboardEvent) => {
      // Konami sequence
      if (e.key === KONAMI_SEQUENCE[idx]) {
        idx++;
        if (idx === KONAMI_SEQUENCE.length) {
          setActivated(true);
          setShowDrunk(true);
          onActivate?.();
          setTimeout(() => setShowDrunk(false), 6000);
          idx = 0;
          return;
        }
      } else {
        idx = e.key === KONAMI_SEQUENCE[0] ? 1 : 0;
      }

      // Fisz sequence
      if (e.key.toLowerCase() === FISZ_SEQUENCE[fiszIdx]) {
        fiszIdx++;
        if (fiszIdx === FISZ_SEQUENCE.length) {
          setActivated(true);
          setShowDrunk(true);
          onActivate?.();
          setTimeout(() => setShowDrunk(false), 6000);
          fiszIdx = 0;
          return;
        }
      } else {
        fiszIdx = e.key.toLowerCase() === FISZ_SEQUENCE[0] ? 1 : 0;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activated, onActivate]);

  const deactivate = useCallback(() => {
    setActivated(false);
    setShowDrunk(false);
  }, []);

  return { activated, showDrunk, deactivate };
};
