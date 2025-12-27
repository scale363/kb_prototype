import { useRef, useEffect } from "react";
import { Clipboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  cursorPosition: number;
  onCursorChange: (position: number) => void;
}

export function TextInputArea({ 
  value, 
  onChange, 
  cursorPosition,
  onCursorChange 
}: TextInputAreaProps) {
  const textareaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      
      if (textareaRef.current.firstChild) {
        const textNode = textareaRef.current.firstChild;
        const pos = Math.min(cursorPosition, value.length);
        range.setStart(textNode, pos);
        range.setEnd(textNode, pos);
      } else {
        range.selectNodeContents(textareaRef.current);
        range.collapse(false);
      }
      
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [cursorPosition, value.length]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const before = value.slice(0, cursorPosition);
        const after = value.slice(cursorPosition);
        const newValue = before + text + after;
        onChange(newValue);
        onCursorChange(cursorPosition + text.length);
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const handleClear = () => {
    onChange("");
    onCursorChange(0);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    // Prevent focus recursion by avoiding manual focus triggering if already focused
  };

  const handleClick = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      onCursorChange(range.startOffset);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative bg-background pb-80">
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <Button
          size="icon"
          variant="ghost"
          onClick={handlePaste}
          data-testid="button-paste"
          aria-label="Paste from clipboard"
        >
          <Clipboard className="h-5 w-5" />
        </Button>
        {value.length > 0 && (
          <Button
            size="icon"
            variant="ghost"
            onClick={handleClear}
            data-testid="button-clear"
            aria-label="Clear text"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div
        ref={textareaRef}
        contentEditable
        suppressContentEditableWarning
        className="flex-1 min-h-[120px] px-4 py-3 pt-14 text-base leading-relaxed outline-none border-b border-border overflow-y-auto touch-manipulation select-text"
        style={{
          WebkitUserSelect: "text",
          userSelect: "text",
          caretColor: "hsl(var(--primary))"
        }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleClick}
        data-testid="input-text-area"
        data-placeholder="Введите текст..."
        inputMode="none"
      >
        {value}
      </div>

      {value.length > 0 && (
        <div className="absolute bottom-2 left-4 text-xs text-muted-foreground" data-testid="text-character-count">
          {value.length} символов
        </div>
      )}
    </div>
  );
}
