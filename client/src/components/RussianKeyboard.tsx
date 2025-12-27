import { useState, useCallback } from "react";
import { Delete, CornerDownLeft } from "lucide-react";

interface RussianKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
}

const RUSSIAN_LAYOUT_LOWER = [
  ["й", "ц", "у", "к", "е", "н", "г", "ш", "щ", "з", "х", "ъ"],
  ["ф", "ы", "в", "а", "п", "р", "о", "л", "д", "ж", "э"],
  ["я", "ч", "с", "м", "и", "т", "ь", "б", "ю"],
];

const RUSSIAN_LAYOUT_UPPER = [
  ["Й", "Ц", "У", "К", "Е", "Н", "Г", "Ш", "Щ", "З", "Х", "Ъ"],
  ["Ф", "Ы", "В", "А", "П", "Р", "О", "Л", "Д", "Ж", "Э"],
  ["Я", "Ч", "С", "М", "И", "Т", "Ь", "Б", "Ю"],
];

const NUMBERS_ROW = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const SYMBOLS_ROW_1 = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"];
const SYMBOLS_ROW_2 = ["-", "_", "=", "+", "[", "]", "{", "}", "|", "\\"];
const PUNCTUATION = [".", ",", "?", "!", "'", "\"", ":", ";"];

export function RussianKeyboard({ onKeyPress, onBackspace, onEnter }: RussianKeyboardProps) {
  const [isShift, setIsShift] = useState(false);
  const [isSymbols, setIsSymbols] = useState(false);

  const layout = isShift ? RUSSIAN_LAYOUT_UPPER : RUSSIAN_LAYOUT_LOWER;

  const handleKeyPress = useCallback((key: string) => {
    onKeyPress(key);
    if (isShift) {
      setIsShift(false);
    }
  }, [onKeyPress, isShift]);

  const handleShift = useCallback(() => {
    setIsShift(prev => !prev);
  }, []);

  const handleSymbols = useCallback(() => {
    setIsSymbols(prev => !prev);
  }, []);

  const KeyButton = ({ 
    children, 
    onClick, 
    className = "",
    dataTestId,
    ariaLabel
  }: { 
    children: React.ReactNode; 
    onClick: () => void;
    className?: string;
    dataTestId?: string;
    ariaLabel?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center
        min-h-[44px] min-w-[28px]
        bg-secondary text-secondary-foreground
        rounded-lg font-medium text-base sm:text-lg
        active:scale-95 active:bg-muted
        transition-transform duration-75
        touch-manipulation select-none
        ${className}
      `}
      data-testid={dataTestId}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );

  if (isSymbols) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex gap-1.5 justify-center">
          {NUMBERS_ROW.map((num) => (
            <KeyButton
              key={num}
              onClick={() => handleKeyPress(num)}
              dataTestId={`key-${num}`}
              className="flex-1"
            >
              {num}
            </KeyButton>
          ))}
        </div>

        <div className="flex gap-1.5 justify-center">
          {SYMBOLS_ROW_1.map((sym) => (
            <KeyButton
              key={sym}
              onClick={() => handleKeyPress(sym)}
              dataTestId={`key-symbol-${sym}`}
              className="flex-1"
            >
              {sym}
            </KeyButton>
          ))}
        </div>

        <div className="flex gap-1.5 justify-center">
          {SYMBOLS_ROW_2.map((sym) => (
            <KeyButton
              key={sym}
              onClick={() => handleKeyPress(sym)}
              dataTestId={`key-symbol-${sym}`}
              className="flex-1"
            >
              {sym}
            </KeyButton>
          ))}
        </div>

        <div className="flex gap-1.5 justify-center">
          <KeyButton
            onClick={handleSymbols}
            className="flex-[1.5] bg-muted"
            dataTestId="key-abc"
            ariaLabel="Switch to letters"
          >
            <span className="text-sm font-medium">АБВ</span>
          </KeyButton>

          {PUNCTUATION.slice(0, 6).map((p) => (
            <KeyButton
              key={p}
              onClick={() => handleKeyPress(p)}
              dataTestId={`key-punct-${p}`}
              className="flex-1"
            >
              {p}
            </KeyButton>
          ))}

          <KeyButton
            onClick={onBackspace}
            className="flex-[1.5] bg-muted"
            dataTestId="key-backspace"
            ariaLabel="Backspace"
          >
            <Delete className="h-5 w-5" />
          </KeyButton>
        </div>

        <div className="flex gap-1.5 justify-center">
          <KeyButton
            onClick={() => handleKeyPress(" ")}
            className="flex-[5] min-w-0 bg-card"
            dataTestId="key-space"
            ariaLabel="Space"
          >
            пробел
          </KeyButton>
          <KeyButton
            onClick={onEnter}
            className="flex-[2] bg-primary text-primary-foreground"
            dataTestId="key-enter"
            ariaLabel="Enter"
          >
            <CornerDownLeft className="h-5 w-5" />
          </KeyButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-1 justify-center">
        {layout[0].map((key) => (
          <KeyButton
            key={key}
            onClick={() => handleKeyPress(key)}
            dataTestId={`key-${key.toLowerCase()}`}
            className="flex-1"
          >
            {key}
          </KeyButton>
        ))}
      </div>

      <div className="flex gap-1 justify-center px-3">
        {layout[1].map((key) => (
          <KeyButton
            key={key}
            onClick={() => handleKeyPress(key)}
            dataTestId={`key-${key.toLowerCase()}`}
            className="flex-1"
          >
            {key}
          </KeyButton>
        ))}
      </div>

      <div className="flex gap-1 justify-center">
        <KeyButton
          onClick={handleShift}
          className={`flex-[1.3] ${isShift ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          dataTestId="key-shift"
          ariaLabel="Shift"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5l-7 7h4v7h6v-7h4l-7-7z" />
          </svg>
        </KeyButton>

        {layout[2].map((key) => (
          <KeyButton
            key={key}
            onClick={() => handleKeyPress(key)}
            dataTestId={`key-${key.toLowerCase()}`}
            className="flex-1"
          >
            {key}
          </KeyButton>
        ))}

        <KeyButton
          onClick={onBackspace}
          className="flex-[1.3] bg-muted"
          dataTestId="key-backspace"
          ariaLabel="Backspace"
        >
          <Delete className="h-5 w-5" />
        </KeyButton>
      </div>

      <div className="flex gap-1.5 justify-center">
        <KeyButton
          onClick={handleSymbols}
          className="flex-[1.5] bg-muted"
          dataTestId="key-symbols"
          ariaLabel="Switch to symbols"
        >
          <span className="text-sm font-medium">123</span>
        </KeyButton>

        <KeyButton
          onClick={() => handleKeyPress(",")}
          className="flex-1"
          dataTestId="key-comma"
        >
          ,
        </KeyButton>

        <KeyButton
          onClick={() => handleKeyPress(" ")}
          className="flex-[5] min-w-0 bg-card"
          dataTestId="key-space"
          ariaLabel="Space"
        >
          пробел
        </KeyButton>

        <KeyButton
          onClick={() => handleKeyPress(".")}
          className="flex-1"
          dataTestId="key-dot"
        >
          .
        </KeyButton>

        <KeyButton
          onClick={onEnter}
          className="flex-[1.5] bg-primary text-primary-foreground"
          dataTestId="key-enter"
          ariaLabel="Enter"
        >
          <CornerDownLeft className="h-5 w-5" />
        </KeyButton>
      </div>
    </div>
  );
}
