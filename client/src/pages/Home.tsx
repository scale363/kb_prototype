import { useState, useEffect } from "react";
import { TextInputArea } from "@/components/TextInputArea";
import { KeyboardContainer } from "@/components/KeyboardContainer";

export default function Home() {
  const [text, setText] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if ((window as unknown as { lastTouchEnd?: number }).lastTouchEnd && 
          now - ((window as unknown as { lastTouchEnd: number }).lastTouchEnd) < 300) {
        e.preventDefault();
      }
      (window as unknown as { lastTouchEnd: number }).lastTouchEnd = now;
    };

    document.addEventListener("touchstart", preventZoom, { passive: false });
    document.addEventListener("touchend", preventDoubleTapZoom, { passive: false });

    return () => {
      document.removeEventListener("touchstart", preventZoom);
      document.removeEventListener("touchend", preventDoubleTapZoom);
    };
  }, []);

  return (
    <div 
      className="flex flex-col h-screen bg-background overflow-hidden"
      style={{ touchAction: "manipulation" }}
    >
      <header className="flex items-center justify-center p-3 border-b border-border bg-card">
        <h1 className="text-lg font-semibold text-foreground" data-testid="text-app-title">
          AI Keyboard
        </h1>
      </header>

      <TextInputArea
        value={text}
        onChange={setText}
        cursorPosition={cursorPosition}
        onCursorChange={setCursorPosition}
      />

      <KeyboardContainer
        text={text}
        onTextChange={setText}
        cursorPosition={cursorPosition}
        onCursorChange={setCursorPosition}
      />
    </div>
  );
}
