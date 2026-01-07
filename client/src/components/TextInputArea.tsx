import { useRef, useEffect } from "react";

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  cursorPosition: number;
  onCursorChange: (position: number) => void;
  onSelectionChange?: (selectedText: string) => void;
  readOnly?: boolean;
}

export function TextInputArea({
  value,
  onChange,
  cursorPosition,
  onCursorChange,
  onSelectionChange,
  readOnly = false
}: TextInputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      const pos = Math.min(cursorPosition, value.length);
      textareaRef.current.setSelectionRange(pos, pos);
    }
  }, [cursorPosition, value.length]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Обновляем позицию курсора
    const newCursorPosition = e.target.selectionStart;
    onCursorChange(newCursorPosition);
  };

  const handleSelect = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;

      if (start !== end) {
        // Есть выделение
        const selectedText = value.substring(start, end);
        if (onSelectionChange) {
          onSelectionChange(selectedText);
        }
      } else {
        // Только курсор
        if (onSelectionChange) {
          onSelectionChange("");
        }
        onCursorChange(start);
      }
    }
  };

  const handleClick = () => {
    handleSelect();
    // При клике в поле ввода сбрасываем временный предпросмотр в клавиатуре,
    // чтобы он синхронизировался с текущим текстом/выделением
    const event = new CustomEvent("resetPreviewText");
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col bg-[#f4f6f600] p-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onClick={handleClick}
        readOnly={readOnly}
        inputMode={readOnly ? "none" : "text"}
        className="min-h-[130px] px-4 py-3 pt-4 text-base leading-relaxed outline-none border-2 border-border rounded-xl overflow-y-auto resize-none"
        style={{
          caretColor: "hsl(var(--primary))"
        }}
        data-testid="input-text-area"
        placeholder="Введите текст..."
      />
    </div>
  );
}
