import { useState, useCallback } from "react";
import { Globe, Mic } from "lucide-react";
import { RussianKeyboard } from "./RussianKeyboard";
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

  const handleKeyPress = useCallback((key: string) => {
    const before = text.slice(0, cursorPosition);
    const after = text.slice(cursorPosition);
    const newText = before + key + after;
    onTextChange(newText);
    onCursorChange(cursorPosition + 1);
  }, [text, cursorPosition, onTextChange, onCursorChange]);

  const handleBackspace = useCallback(() => {
    if (cursorPosition > 0) {
      const before = text.slice(0, cursorPosition - 1);
      const after = text.slice(cursorPosition);
      onTextChange(before + after);
      onCursorChange(cursorPosition - 1);
    }
  }, [text, cursorPosition, onTextChange, onCursorChange]);

  const handleEnter = useCallback(() => {
    handleKeyPress("\n");
  }, [handleKeyPress]);

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
    <div className="flex flex-col bg-[#f4f6f6] border-t border-border rounded-t-[2rem] shadow-lg">
      {/* Белая скругленная область для клавиатуры */}
      <div className="p-3 pt-4 bg-white rounded-[2rem] m-1 mb-0">
        {mode === "russian" ? (
          <RussianKeyboard
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onEnter={handleEnter}
          />
        ) : (
          <AIPromptsKeyboard
            text={text}
            selectedText={selectedText}
            previewText={previewText}
            onPreviewTextChange={onPreviewTextChange}
            onTextChange={handleAITextChange}
          />
        )}
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
