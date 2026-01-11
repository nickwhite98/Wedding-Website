import { useEffect, useRef } from "react";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export const useKonamiCode = (onSuccess: () => void) => {
  const keysPressed = useRef<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Add the key to our sequence
      keysPressed.current.push(event.key);

      // Keep only the last 10 keys (length of Konami code)
      if (keysPressed.current.length > KONAMI_CODE.length) {
        keysPressed.current.shift();
      }

      // Check if the sequence matches the Konami code
      const matches = keysPressed.current.every(
        (key, index) => key === KONAMI_CODE[index]
      );

      if (
        matches &&
        keysPressed.current.length === KONAMI_CODE.length
      ) {
        console.log("🎮 Konami Code activated!");
        keysPressed.current = []; // Reset the sequence
        onSuccess();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSuccess]);
};
