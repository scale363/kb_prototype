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
      className="flex flex-col h-screen bg-background overflow-hidden relative font-sans"
      style={{ touchAction: "manipulation" }}
    >
      <div className="absolute top-0 left-[20px] right-[20px] h-[3px] bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] via-[#10b981] to-[#f59e0b] rounded-b-[2px] z-50" />
      
      <header className="flex items-center justify-between p-7 pb-6 bg-card">
        <h1 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-[1.5px]" data-testid="text-app-title">
          Text Processing
        </h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-[10px] hover:bg-background"
          data-testid="button-close"
        >
          <X className="h-[18px] w-[18px] text-muted-foreground" />
        </Button>
      </header>

      <main className="flex-1 px-7 overflow-hidden flex flex-col">
        <TextInputArea
          value={text}
          onChange={setText}
          cursorPosition={cursorPosition}
          onCursorChange={setCursorPosition}
          onSelectionChange={setSelectedText}
        />
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card p-7 pt-0">
        <KeyboardContainer
          text={text}
          onTextChange={setText}
          cursorPosition={cursorPosition}
          onCursorChange={setCursorPosition}
          selectedText={selectedText}
          previewText={previewText}
          onPreviewTextChange={setPreviewText}
        />
        
        <div className="flex justify-center mt-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-[14px] border-2 border-border hover:bg-background transition-all hover:scale-105"
            data-testid="button-web"
          >
            <Globe className="h-6 w-6 text-muted-foreground" />
          </Button>
        </div>
        <div className="h-safe-area-inset-bottom" />
      </div>
    </div>
  );
}
