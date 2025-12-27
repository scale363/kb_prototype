import { useRef, useEffect, useState } from "react";
import { Clipboard, X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  cursorPosition: number;
  onCursorChange: (position: number) => void;
  onSelectionChange?: (selectedText: string) => void;
}

export function TextInputArea({
  value,
  onChange,
  cursorPosition,
  onCursorChange,
  onSelectionChange
}: TextInputAreaProps) {
  const textareaRef = useRef<HTMLDivElement>(null);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      const selection = window.getSelection();
      const range = document.createRange();

      if (textareaRef.current.firstChild) {
        const textNode = textareaRef.current.firstChild;

        // Если есть сохраненный диапазон выделения, восстанавливаем его
        if (selectionRange && selectionRange.start !== selectionRange.end) {
          const startPos = Math.min(selectionRange.start, value.length);
          const endPos = Math.min(selectionRange.end, value.length);
          range.setStart(textNode, startPos);
          range.setEnd(textNode, endPos);
        } else {
          // Иначе устанавливаем курсор
          const pos = Math.min(cursorPosition, value.length);
          range.setStart(textNode, pos);
          range.setEnd(textNode, pos);
        }
      } else {
        range.selectNodeContents(textareaRef.current);
        range.collapse(false);
      }

      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [cursorPosition, value.length, selectionRange]);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      // Optional: add visual feedback
    } catch (err) {
      console.error("Failed to copy:", err);
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
    // Allow text selection shortcuts (Ctrl+A, Shift+arrows, etc.)
    // Prevent only actual text input
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    // Prevent focus recursion by avoiding manual focus triggering if already focused
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString();

      // Сохраняем диапазон выделения
      if (selectedText) {
        setSelectionRange({
          start: range.startOffset,
          end: range.endOffset
        });
        if (onSelectionChange) {
          onSelectionChange(selectedText);
        }
      } else {
        setSelectionRange(null);
        if (onSelectionChange) {
          onSelectionChange("");
        }
        onCursorChange(range.startOffset);
      }
    }
  };

  const handleClick = () => {
    handleSelectionChange();
    // При клике в поле ввода сбрасываем временный предпросмотр в клавиатуре, 
    // чтобы он синхронизировался с текущим текстом/выделением
    const event = new CustomEvent("resetPreviewText");
    window.dispatchEvent(event);
  };

  const handleMouseUp = () => {
    handleSelectionChange();
  };

  return (
    <div className="flex flex-col relative bg-background rounded-2xl border-2 border-border p-5 mb-6 hover:border-primary/20 transition-all group">
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
        Input
      </div>
      
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg border-2 border-border hover:bg-blue-50 hover:border-blue-600 transition-all"
          onClick={handleCopy}
          data-testid="button-copy"
          aria-label="Copy to clipboard"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={textareaRef}
        contentEditable
        suppressContentEditableWarning
        className="text-[15px] leading-[1.6] text-foreground outline-none touch-manipulation select-text min-h-[100px] overflow-y-auto"
        style={{
          WebkitUserSelect: "text",
          userSelect: "text",
          caretColor: "hsl(var(--primary))",
          resize: "none"
        }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleClick}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        data-testid="input-text-area"
        data-placeholder="Введите текст..."
        inputMode="none"
      >
        {value}
      </div>
    </div>
  );
}
