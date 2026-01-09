import { useState, useCallback } from "react";
import { Globe, Mic } from "lucide-react";
import { AIPromptsKeyboard } from "./AIPromptsKeyboard";

type KeyboardMode = "russian" | "prompts";

interface KeyboardContainerProps {
  text: string;
  onTextChange: (text: string) => void;
  cursorPosition: number;
  onCursorChange: (position: number) => void;
  selectedText: string;
  previewText: string;
  onPreviewTextChange: (text: string) => void;
}

export function KeyboardContainer({
  text,
  onTextChange,
  cursorPosition,
  onCursorChange,
  selectedText,
  previewText,
  onPreviewTextChange
}: KeyboardContainerProps) {
  const [mode, setMode] = useState<KeyboardMode>("russian");

  const handleAITextChange = useCallback((newText: string) => {
    onTextChange(newText);
    onCursorChange(newText.length);
  }, [onTextChange, onCursorChange]);

  const handleSwitchKeyboard = useCallback(() => {
    setMode(prev => {
      const newMode = prev === "russian" ? "prompts" : "russian";
      // При переключении на промты сбрасываем предпросмотр, чтобы он синхронизировался
      if (newMode === "prompts") {
        onPreviewTextChange("");
      }
      return newMode;
    });
  }, [onPreviewTextChange]);

  return (
    <div className="flex flex-col bg-[#f4f6f6] rounded-t-[1.333rem] shadow-lg">
      {/* Белая скругленная область для клавиатуры (всегда видна) */}
      <div className="p-3 pt-4 bg-white rounded-[1.333rem] m-2 mb-0">
        <AIPromptsKeyboard
          text={text}
          selectedText={selectedText}
          previewText={previewText}
          onPreviewTextChange={onPreviewTextChange}
          onTextChange={handleAITextChange}
          onSwitchKeyboard={handleSwitchKeyboard}
        />
      </div>
      {/* Серая панель с иконками глобуса и микрофона */}
      <div className="flex items-center justify-between px-3 pb-3 pt-4 bg-[#f4f6f6]">
        <button
          type="button"
          onClick={handleSwitchKeyboard}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] bg-transparent touch-manipulation active:scale-95 transition-transform duration-75"
          aria-label="Switch keyboard"
        >
          <Globe className="h-6 w-6 text-foreground/70" />
        </button>
        <button
          type="button"
          className="flex items-center justify-center min-h-[44px] min-w-[44px] bg-transparent touch-manipulation active:scale-95 transition-transform duration-75"
          aria-label="Voice input"
        >
          <Mic className="h-6 w-6 text-foreground/70" />
        </button>
      </div>
      <div className="h-safe-area-inset-bottom bg-card" />
    </div>
  );
}
