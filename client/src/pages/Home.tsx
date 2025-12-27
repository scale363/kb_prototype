import { useState, useEffect } from "react";
import { TextInputArea } from "@/components/TextInputArea";
import { KeyboardContainer } from "@/components/KeyboardContainer";

export default function Home() {
  const [text, setText] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedText, setSelectedText] = useState("");
  const [previewText, setPreviewText] = useState("");

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
      className="flex flex-col h-screen bg-white overflow-hidden font-sans"
      style={{ touchAction: "manipulation" }}
    >
      <header className="flex items-center justify-center p-4 border-b border-gray-100 bg-white shadow-sm z-10">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight" data-testid="text-app-title">
          AI Keyboard
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-[420px]">
        <TextInputArea
          value={text}
          onChange={setText}
          cursorPosition={cursorPosition}
          onCursorChange={setCursorPosition}
          onSelectionChange={setSelectedText}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-100 rounded-t-[32px] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <div className="max-w-2xl mx-auto">
          <KeyboardContainer
            text={text}
            onTextChange={setText}
            cursorPosition={cursorPosition}
            onCursorChange={setCursorPosition}
            selectedText={selectedText}
            previewText={previewText}
            onPreviewTextChange={setPreviewText}
          />
        </div>
      </div>
    </div>
  );
}
