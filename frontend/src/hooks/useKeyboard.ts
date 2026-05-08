import { useEffect } from "react";

type KeyHandler = (event: KeyboardEvent) => void;
type KeyMap = Record<string, KeyHandler>;

export function useKeyboard(keyMap: KeyMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      const key = event.key;
      const handlerFn = keyMap[key];
      if (handlerFn) {
        event.preventDefault();
        handlerFn(event);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyMap, enabled]);
}
