import { useState, useEffect } from "react";
import { Clipboard, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextInputArea } from "@/components/TextInputArea";
import { KeyboardContainer } from "@/components/KeyboardContainer";

export default function Home() {
  const [text, setText] = useState("привет, петя. Напиши босу что я не приду нафиг, проспал");
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

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        // Сначала очищаем поле
        setText(clipboardText);
        setCursorPosition(clipboardText.length);
        setSelectedText("");
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const handleClear = () => {
    setText("");
    setCursorPosition(0);
    setSelectedText("");
    // Сбрасываем предпросмотр
    const event = new CustomEvent("resetPreviewText");
    window.dispatchEvent(event);
  };

  return (
    <div
      className="flex flex-col h-screen bg-background overflow-hidden"
      style={{ touchAction: "manipulation" }}
    >
      {/* Панель кнопок управления над полем ввода */}
      <div className="flex-shrink-0 border-b border-border px-4 py-2 bg-[#fafafa]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleClear}
              disabled={text.length === 0}
              data-testid="button-clear"
              aria-label="Clear text"
              className="text-muted-foreground hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handlePaste}
              data-testid="button-paste"
              aria-label="Paste from clipboard"
            >
              <Clipboard className="h-5 w-5" />
            </Button>
          </div>
          {text.length > 0 && (
            <span className="text-xs text-muted-foreground" data-testid="text-character-count">
              {text.length} символов
            </span>
          )}
        </div>
      </div>
      {/* Скролящаяся область текста */}
      <div className="flex-1 overflow-y-auto bg-[#fafafa]">
        <TextInputArea
          value={text}
          onChange={setText}
          cursorPosition={cursorPosition}
          onCursorChange={setCursorPosition}
          onSelectionChange={setSelectedText}
          readOnly={false}
        />
      </div>
      {/* Зафиксированная панель клавиатуры внизу */}
      <div className="flex-shrink-0 border-t border-border">
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
  );
}
