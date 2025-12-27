import { useState, useCallback } from "react";
import { RussianKeyboard } from "./RussianKeyboard";
import { AIPromptsKeyboard } from "./AIPromptsKeyboard";

type KeyboardMode = "russian" | "prompts";

interface KeyboardContainerProps {
  text: string;
  onTextChange: (text: string) => void;
  cursorPosition: number;
  onCursorChange: (position: number) => void;
  selectedText: string;
}

export function KeyboardContainer({
  text,
  onTextChange,
  cursorPosition,
  onCursorChange,
  selectedText
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
    setMode(prev => prev === "russian" ? "prompts" : "russian");
  }, []);

  return (
    <div className="flex flex-col bg-card border-t border-border rounded-t-2xl shadow-lg">
      <div className="p-3 pt-4">
        {mode === "russian" ? (
          <RussianKeyboard
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onEnter={handleEnter}
            onSwitchKeyboard={handleSwitchKeyboard}
          />
        ) : (
          <AIPromptsKeyboard
            text={text}
            selectedText={selectedText}
            onTextChange={handleAITextChange}
            onSwitchKeyboard={handleSwitchKeyboard}
          />
        )}
      </div>

      <div className="h-safe-area-inset-bottom bg-card" />
    </div>
  );
}
