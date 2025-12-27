import { useState, useCallback } from "react";
import { RussianKeyboard } from "./RussianKeyboard";
import { AIPromptsKeyboard } from "./AIPromptsKeyboard";

type KeyboardMode = "russian" | "prompts";

interface KeyboardContainerProps {
  text: string;
  onTextChange: (text: string) => void;
  cursorPosition: number;
  onCursorChange: (position: number) => void;
}

export function KeyboardContainer({ 
  text, 
  onTextChange, 
  cursorPosition,
  onCursorChange 
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

  return (
    <div className="flex flex-col bg-card border-t border-border rounded-t-2xl shadow-lg">
      <div className="flex justify-center p-3 pb-2">
        <div className="inline-flex bg-muted rounded-full p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode("russian")}
            className={`
              px-5 py-2 rounded-full text-sm font-medium
              transition-all duration-150 touch-manipulation
              ${mode === "russian" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground"
              }
            `}
            data-testid="toggle-mode-russian"
            aria-label="Russian keyboard"
            aria-pressed={mode === "russian"}
          >
            АБВ
          </button>
          <button
            type="button"
            onClick={() => setMode("prompts")}
            className={`
              px-5 py-2 rounded-full text-sm font-medium
              transition-all duration-150 touch-manipulation
              ${mode === "prompts" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground"
              }
            `}
            data-testid="toggle-mode-prompts"
            aria-label="AI prompts"
            aria-pressed={mode === "prompts"}
          >
            AI
          </button>
        </div>
      </div>

      <div className="p-3 pt-1">
        {mode === "russian" ? (
          <RussianKeyboard
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onEnter={handleEnter}
          />
        ) : (
          <AIPromptsKeyboard
            text={text}
            onTextChange={handleAITextChange}
          />
        )}
      </div>

      <div className="h-safe-area-inset-bottom bg-card" />
    </div>
  );
}
