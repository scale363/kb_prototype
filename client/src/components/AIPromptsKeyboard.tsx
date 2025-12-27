import { RefreshCw, Languages, FileText, Clipboard, Globe, ArrowLeft, Copy, Check, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Умная функция для усечения текста, которая не режет слова и показывает начало и конец
function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Вычисляем сколько символов показать с каждой стороны
  const ellipsisLength = 3; // "..."
  const availableLength = maxLength - ellipsisLength;
  const startLength = Math.ceil(availableLength * 0.6); // 60% для начала
  const endLength = Math.floor(availableLength * 0.4); // 40% для конца

  // Получаем начальную часть
  let start = text.slice(0, startLength);
  // Находим последний пробел, чтобы не резать слово
  const lastSpaceInStart = start.lastIndexOf(' ');
  if (lastSpaceInStart > startLength * 0.7) { // Только если пробел не слишком далеко
    start = start.slice(0, lastSpaceInStart);
  }

  // Получаем конечную часть
  let end = text.slice(-endLength);
  // Находим первый пробел, чтобы не резать слово
  const firstSpaceInEnd = end.indexOf(' ');
  if (firstSpaceInEnd !== -1 && firstSpaceInEnd < endLength * 0.3) { // Только если пробел не слишком далеко
    end = end.slice(firstSpaceInEnd + 1);
  }

  return `${start.trim()}...${end.trim()}`;
}

interface AIPromptsKeyboardProps {
  text: string;
  selectedText: string;
  previewText: string;
  onPreviewTextChange: (text: string) => void;
  onTextChange: (text: string) => void;
  onSwitchKeyboard?: () => void;
}

interface PromptButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  colorClass: string;
  borderClass: string;
}

// Tone options for Rephrase feature
interface ToneOption {
  id: string;
  label: string;
  tooltip: string;
  colorClass: string;
  borderClass: string;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    id: "work-safe",
    label: "Work-Safe",
    tooltip: "Rewrites your message to sound natural, polite, and culturally appropriate at work.",
    colorClass: "bg-blue-50 dark:bg-blue-950/30",
    borderClass: "border-blue-200 dark:border-blue-800",
  },
  {
    id: "professional",
    label: "Professional",
    tooltip: "Clear, neutral business tone suitable for clients, managers, and formal communication.",
    colorClass: "bg-slate-50 dark:bg-slate-950/30",
    borderClass: "border-slate-200 dark:border-slate-800",
  },
  {
    id: "friendly",
    label: "Friendly",
    tooltip: "Warm and human tone while staying professional and work-appropriate.",
    colorClass: "bg-green-50 dark:bg-green-950/30",
    borderClass: "border-green-200 dark:border-green-800",
  },
  {
    id: "urgent",
    label: "Urgent",
    tooltip: "Adds urgency and clarity without sounding rude or aggressive.",
    colorClass: "bg-red-50 dark:bg-red-950/30",
    borderClass: "border-red-200 dark:border-red-800",
  },
  {
    id: "short-clear",
    label: "Short & Clear",
    tooltip: "Makes your message concise, easy to read, and action-oriented.",
    colorClass: "bg-amber-50 dark:bg-amber-950/30",
    borderClass: "border-amber-200 dark:border-amber-800",
  },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ru", label: "Russian" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "zh", label: "Chinese" },
];

type MenuLevel = "main" | "tone-select" | "result";

const PROMPT_BUTTONS: PromptButton[] = [
  {
    id: "rephrase",
    label: "Rephrase",
    icon: <RefreshCw className="h-6 w-6" />,
    description: "Rewrite text differently",
    colorClass: "bg-blue-50 dark:bg-blue-950/30",
    borderClass: "border-blue-200 dark:border-blue-800",
  },
  {
    id: "translate",
    label: "Translate",
    icon: <Languages className="h-6 w-6" />,
    description: "Translate to another language",
    colorClass: "bg-purple-50 dark:bg-purple-950/30",
    borderClass: "border-purple-200 dark:border-purple-800",
  },
  {
    id: "snippets",
    label: "Snippets",
    icon: <FileText className="h-6 w-6" />,
    description: "Insert saved text blocks",
    colorClass: "bg-green-50 dark:bg-green-950/30",
    borderClass: "border-green-200 dark:border-green-800",
  },
  {
    id: "clipboard",
    label: "Clipboard",
    icon: <Clipboard className="h-6 w-6" />,
    description: "Paste and format clipboard",
    colorClass: "bg-orange-50 dark:bg-orange-950/30",
    borderClass: "border-orange-200 dark:border-orange-800",
  },
];

export function AIPromptsKeyboard({ text, selectedText, previewText, onPreviewTextChange, onTextChange, onSwitchKeyboard }: AIPromptsKeyboardProps) {
  const { toast } = useToast();
  const [menuLevel, setMenuLevel] = useState<MenuLevel>("main");
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [rephraseResult, setRephraseResult] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleReset = () => {
      onPreviewTextChange("");
      // Reset menu state when preview is reset
      setMenuLevel("main");
      setSelectedTone(null);
      setRephraseResult("");
    };
    window.addEventListener("resetPreviewText", handleReset);
    return () => window.removeEventListener("resetPreviewText", handleReset);
  }, [onPreviewTextChange]);

  // Определяем текст для предпросмотра: приоритет за полем ввода кроме одного случая:
  // мы вставили текст из буфера (previewText), при этом он еще не синхронизировался с основным полем
  // Или если основное поле пустое, а предпросмотр заполнен
  const displayPreviewText = (previewText && (!text || previewText !== text && previewText !== selectedText)) 
    ? previewText 
    : (selectedText || text);
  const displayText = truncateText(displayPreviewText);

  const handlePasteFromClipboard = async () => {
    try {
      // Только текст из буфера обмена
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        // Обновляем только поле предпросмотра, не трогая поле ввода
        onPreviewTextChange(clipboardText);
        toast({
          title: "Вставлено из буфера",
          description: `${clipboardText.length} символов`,
        });
      } else {
        toast({
          title: "Буфер обмена пуст",
          description: "Нет текста в буфере обмена",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Нет доступа к буферу",
        description: "Разрешите доступ к буферу обмена",
        variant: "destructive",
      });
    }
  };

  const handleToneSelect = (toneId: string) => {
    setSelectedTone(toneId);
    // Generate placeholder result
    const toneName = TONE_OPTIONS.find(t => t.id === toneId)?.label || toneId;
    const originalText = selectedText || previewText || text;
    setRephraseResult(`[${toneName} version] This is a rephrased placeholder text. The original message "${truncateText(originalText, 50)}" has been rewritten in a ${toneName.toLowerCase()} tone. This is temporary mock content that will be replaced with actual AI-generated text.`);
    setMenuLevel("result");
    setCopied(false);
  };

  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(rephraseResult);
      setCopied(true);
      toast({
        title: "Скопировано",
        description: "Текст скопирован в буфер обмена",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Ошибка копирования",
        description: "Не удалось скопировать текст",
        variant: "destructive",
      });
    }
  };

  const handleApplyResult = () => {
    if (selectedText) {
      // Replace selected text in the original text
      const startIndex = text.indexOf(selectedText);
      if (startIndex !== -1) {
        const newText = text.substring(0, startIndex) + rephraseResult + text.substring(startIndex + selectedText.length);
        onTextChange(newText);
      } else {
        onTextChange(rephraseResult);
      }
    } else {
      // Replace all text
      onTextChange(rephraseResult);
    }
    // Reset to main menu
    setMenuLevel("main");
    setSelectedTone(null);
    setRephraseResult("");
    toast({
      title: "Применено",
      description: "Текст заменён",
    });
  };

  const handleReprocess = () => {
    if (selectedTone) {
      const toneName = TONE_OPTIONS.find(t => t.id === selectedTone)?.label || selectedTone;
      const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.label || selectedLanguage;
      const originalText = selectedText || previewText || text;
      setRephraseResult(`[${toneName} - ${langName}] Reprocessed placeholder text. The message "${truncateText(originalText, 50)}" has been rewritten in ${toneName.toLowerCase()} tone for ${langName} audience. This is mock content.`);
      setCopied(false);
    }
  };

  const handleBackToMain = () => {
    setMenuLevel("main");
    setSelectedTone(null);
    setRephraseResult("");
  };

  const handleBackToTones = () => {
    setMenuLevel("tone-select");
    setRephraseResult("");
    setCopied(false);
  };

  const handlePromptClick = async (promptId: string) => {
    switch (promptId) {
      case "rephrase":
        if (!text.trim() && !previewText.trim()) {
          toast({
            title: "No text to rephrase",
            description: "Please enter some text first",
            variant: "destructive",
          });
          return;
        }
        setMenuLevel("tone-select");
        break;

      case "translate":
        if (!text.trim()) {
          toast({
            title: "No text to translate",
            description: "Please enter some text first",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Translate",
          description: "AI translation will be available soon",
        });
        break;

      case "snippets":
        toast({
          title: "Snippets",
          description: "Snippet library will be available soon",
        });
        break;

      case "clipboard":
        try {
          const clipboardText = await navigator.clipboard.readText();
          if (clipboardText) {
            onTextChange(text + clipboardText);
            toast({
              title: "Pasted from clipboard",
              description: `Added ${clipboardText.length} characters`,
            });
          } else {
            toast({
              title: "Clipboard empty",
              description: "No text found in clipboard",
              variant: "destructive",
            });
          }
        } catch (err) {
          toast({
            title: "Clipboard access denied",
            description: "Please allow clipboard access",
            variant: "destructive",
          });
        }
        break;
    }
  };

  // Render preview field (always visible)
  const renderPreviewField = () => (
    <div className="px-1">
      <div className="flex flex-col gap-2 p-3 bg-accent/30 border-2 border-accent rounded-lg relative">
        {menuLevel === "result" && rephraseResult ? (
          <>
            <div className="text-xs font-medium text-muted-foreground">
              Результат ({TONE_OPTIONS.find(t => t.id === selectedTone)?.label}):
            </div>
            <div className="text-sm text-foreground font-medium leading-relaxed">
              {truncateText(rephraseResult, 150)}
            </div>
          </>
        ) : displayPreviewText.trim() ? (
          <>
            <div className="text-xs font-medium text-muted-foreground">
              {selectedText ? "Выделенный текст:" : previewText ? "Предпросмотр:" : "Текст для обработки:"}
            </div>
            <div className="text-sm text-foreground font-medium leading-relaxed">
              {displayText}
            </div>
          </>
        ) : (
          <div className="text-xs font-medium text-muted-foreground">
            Введите или вставьте текст для работы
          </div>
        )}
        {/* Paste button - only on main menu */}
        {menuLevel === "main" && (
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-accent/50 active:scale-95 transition-all duration-75 touch-manipulation"
            data-testid="button-paste-empty"
            aria-label="Paste from clipboard"
          >
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );

  // Render main menu buttons
  const renderMainMenu = () => (
    <>
      <div className="grid grid-cols-2 gap-3 p-1">
        {PROMPT_BUTTONS.map((button) => (
          <button
            key={button.id}
            type="button"
            onClick={() => handlePromptClick(button.id)}
            className={`
              flex flex-col items-center justify-center gap-2
              min-h-[72px] p-4
              rounded-xl border-2
              ${button.colorClass}
              ${button.borderClass}
              active:scale-[0.98]
              transition-transform duration-75
              touch-manipulation select-none
            `}
            data-testid={`button-prompt-${button.id}`}
            aria-label={button.label}
          >
            <div className="text-foreground/80">
              {button.icon}
            </div>
            <span className="text-sm font-medium text-foreground">
              {button.label}
            </span>
          </button>
        ))}
      </div>

      {onSwitchKeyboard && (
        <div className="flex justify-start px-1">
          <button
            type="button"
            onClick={onSwitchKeyboard}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] px-4 bg-muted rounded-lg touch-manipulation active:scale-[0.97] transition-transform duration-0"
            data-testid="key-switch-keyboard-ai"
            aria-label="Switch keyboard"
          >
            <Globe className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );

  // Render tone selection menu
  const renderToneSelect = () => (
    <div className="flex flex-col gap-3 p-1">
      {/* Back button */}
      <button
        type="button"
        onClick={handleBackToMain}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
        data-testid="button-back-to-main"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Назад</span>
      </button>

      {/* Tone options */}
      <div className="grid grid-cols-2 gap-3">
        {TONE_OPTIONS.map((tone) => (
          <Tooltip key={tone.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => handleToneSelect(tone.id)}
                className={`
                  flex items-center justify-center gap-2
                  min-h-[56px] p-3
                  rounded-xl border-2
                  ${tone.colorClass}
                  ${tone.borderClass}
                  active:scale-[0.98]
                  transition-transform duration-75
                  touch-manipulation select-none
                `}
                data-testid={`button-tone-${tone.id}`}
                aria-label={tone.label}
              >
                <span className="text-sm font-medium text-foreground">
                  {tone.label}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[250px]">
              <p className="text-xs">{tone.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );

  // Render result view with action buttons
  const renderResult = () => (
    <div className="flex flex-col gap-3 p-1">
      {/* Back button */}
      <button
        type="button"
        onClick={handleBackToTones}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
        data-testid="button-back-to-tones"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Изменить тон</span>
      </button>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {/* Copy and Apply row */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopyResult}
            className={`
              flex-1 flex items-center justify-center gap-2
              min-h-[48px] px-4
              rounded-xl border-2
              ${copied ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : "bg-secondary border-border"}
              active:scale-[0.98]
              transition-all duration-75
              touch-manipulation select-none
            `}
            data-testid="button-copy-result"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">
              {copied ? "Скопировано" : "Копировать"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleApplyResult}
            className="flex-1 flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-xl border-2 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none"
            data-testid="button-apply-result"
          >
            <Check className="h-5 w-5" />
            <span className="text-sm font-medium">Применить</span>
          </button>
        </div>

        {/* Reprocess row with language selector */}
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={handleReprocess}
            className="flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-xl border-2 bg-secondary border-border active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none"
            data-testid="button-reprocess"
          >
            <RotateCcw className="h-5 w-5" />
            <span className="text-sm font-medium">Повторить</span>
          </button>

          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger 
              className="flex-1 min-h-[48px] rounded-xl border-2"
              data-testid="select-language"
            >
              <SelectValue placeholder="Язык" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} data-testid={`option-lang-${lang.code}`}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      {renderPreviewField()}
      
      {menuLevel === "main" && renderMainMenu()}
      {menuLevel === "tone-select" && renderToneSelect()}
      {menuLevel === "result" && renderResult()}
    </div>
  );
}
