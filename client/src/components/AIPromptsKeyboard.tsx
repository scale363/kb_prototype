import { RefreshCw, Languages, FileText, Clipboard, Globe, ArrowLeft, Copy, Check, RotateCcw, ChevronRight, X, HelpCircle, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
  emoji: string;
  tooltip: string;
  colorClass: string;
  borderClass: string;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    id: "work-safe",
    label: "Work-Safe",
    emoji: "\u{1F3E2}",
    tooltip: "Rewrites your message to sound natural, polite, and culturally appropriate at work.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "professional",
    label: "Professional",
    emoji: "\u{1F454}",
    tooltip: "Clear, neutral business tone suitable for clients, managers, and formal communication.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "friendly",
    label: "Friendly",
    emoji: "\u{1F44B}",
    tooltip: "Warm and human tone while staying professional and work-appropriate.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "urgent",
    label: "Urgent",
    emoji: "\u{26A1}",
    tooltip: "Adds urgency and clarity without sounding rude or aggressive.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "short-clear",
    label: "Short & Clear",
    emoji: "\u{2702}\uFE0F",
    tooltip: "Makes your message concise, easy to read, and action-oriented.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
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

interface RephraseResult {
  id: string;
  text: string;
  tone: string;
  language: string;
  timestamp: number;
}

const PROMPT_BUTTONS: PromptButton[] = [
  {
    id: "rephrase",
    label: "Rephrase",
    icon: <RefreshCw className="h-6 w-6 text-blue-500" />,
    description: "Rewrite text differently",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "translate",
    label: "Translate",
    icon: <Languages className="h-6 w-6 text-purple-500" />,
    description: "Translate to another language",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "snippets",
    label: "Snippets",
    icon: <FileText className="h-6 w-6 text-emerald-500" />,
    description: "Insert saved text blocks",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "clipboard",
    label: "Clipboard",
    icon: <Clipboard className="h-6 w-6 text-orange-500" />,
    description: "Paste and format clipboard",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
];

export function AIPromptsKeyboard({ text, selectedText, previewText, onPreviewTextChange, onTextChange, onSwitchKeyboard }: AIPromptsKeyboardProps) {
  const { toast } = useToast();
  const [menuLevel, setMenuLevel] = useState<MenuLevel>("main");
  const [selectedTone, setSelectedTone] = useState<string | null>(null);

  // Load saved language from localStorage or default to "en"
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem("rephrase-language") || "en";
    } catch {
      return "en";
    }
  });

  const [rephraseResults, setRephraseResults] = useState<RephraseResult[]>([]);
  const [copiedResultId, setCopiedResultId] = useState<string | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  // Ref for auto-scrolling to the bottom when new variant is generated
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Save language selection to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("rephrase-language", selectedLanguage);
    } catch {
      // localStorage might not be available
    }
  }, [selectedLanguage]);

  useEffect(() => {
    const handleReset = () => {
      onPreviewTextChange("");
      // Reset menu state when preview is reset
      setMenuLevel("main");
      setSelectedTone(null);
      setRephraseResults([]);
    };
    window.addEventListener("resetPreviewText", handleReset);
    return () => window.removeEventListener("resetPreviewText", handleReset);
  }, [onPreviewTextChange]);

  // Auto-scroll to bottom when new variant is generated
  useEffect(() => {
    if (resultsContainerRef.current && rephraseResults.length > 0) {
      // Use smooth scrolling to the bottom
      resultsContainerRef.current.scrollTo({
        top: resultsContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [rephraseResults.length]);

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
    // Generate first result
    const toneName = TONE_OPTIONS.find(t => t.id === toneId)?.label || toneId;
    const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.label || selectedLanguage;
    const originalText = selectedText || previewText || text;

    const newResult: RephraseResult = {
      id: `result-${Date.now()}`,
      text: `[${toneName} - ${langName}] This is a rephrased placeholder text. The original message "${truncateText(originalText, 50)}" has been rewritten in a ${toneName.toLowerCase()} tone for ${langName} audience. This is temporary mock content that will be replaced with actual AI-generated text.`,
      tone: toneId,
      language: selectedLanguage,
      timestamp: Date.now(),
    };

    setRephraseResults([newResult]);
    setMenuLevel("result");
    setCopiedResultId(null);
    setSelectedResultId(null);
  };

  const handleCopyResult = async (resultId: string) => {
    const result = rephraseResults.find(r => r.id === resultId);
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.text);
      setCopiedResultId(resultId);
      toast({
        title: "Скопировано",
        description: "Текст скопирован в буфер обмена",
      });
      setTimeout(() => setCopiedResultId(null), 2000);
    } catch {
      toast({
        title: "Ошибка копирования",
        description: "Не удалось скопировать текст",
        variant: "destructive",
      });
    }
  };

  const handleApplyResult = (resultId: string) => {
    const result = rephraseResults.find(r => r.id === resultId);
    if (!result) return;

    if (selectedText) {
      // Replace selected text in the original text
      const startIndex = text.indexOf(selectedText);
      if (startIndex !== -1) {
        const newText = text.substring(0, startIndex) + result.text + text.substring(startIndex + selectedText.length);
        onTextChange(newText);
      } else {
        onTextChange(result.text);
      }
    } else {
      // Replace all text
      onTextChange(result.text);
    }
    // Reset to main menu
    setMenuLevel("main");
    setSelectedTone(null);
    setRephraseResults([]);
    toast({
      title: "Применено",
      description: "Текст заменён",
    });
  };

  const handleReprocess = () => {
    if (!selectedTone) return;

    const toneName = TONE_OPTIONS.find(t => t.id === selectedTone)?.label || selectedTone;
    const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.label || selectedLanguage;
    const originalText = selectedText || previewText || text;

    const newResult: RephraseResult = {
      id: `result-${Date.now()}`,
      text: `[${toneName} - ${langName}] Reprocessed placeholder text #${rephraseResults.length + 1}. The message "${truncateText(originalText, 50)}" has been rewritten in ${toneName.toLowerCase()} tone for ${langName} audience. This is mock content.`,
      tone: selectedTone,
      language: selectedLanguage,
      timestamp: Date.now(),
    };

    // Add new result to the end of the array
    setRephraseResults([...rephraseResults, newResult]);
    setCopiedResultId(null);
    // Automatically select the new variant
    setSelectedResultId(newResult.id);
  };

  const handleBackToMain = () => {
    setMenuLevel("main");
    setSelectedTone(null);
    setRephraseResults([]);
    setSelectedResultId(null);
  };

  const handleBackToTones = () => {
    setMenuLevel("tone-select");
    setRephraseResults([]);
    setCopiedResultId(null);
    setSelectedResultId(null);
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

  // Render header with title and close button
  const renderHeader = () => {
    let title = "";
    let onClose = handleBackToMain;

    if (menuLevel === "main") {
      // On main menu, show title and X button that switches keyboard
      return (
        <div className="px-1 py-2 flex items-center justify-between min-h-[44px]">
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#6c7180]">Sound professional at work</div>
          </div>
          {onSwitchKeyboard && (
            <button
              type="button"
              onClick={onSwitchKeyboard}
              className="p-1.5 rounded-md hover:bg-accent active:scale-95 transition-all duration-75 touch-manipulation"
              aria-label="Switch keyboard"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
      );
    } else if (menuLevel === "tone-select") {
      title = "Rephrase";
    } else if (menuLevel === "result" && selectedTone) {
      const tone = TONE_OPTIONS.find(t => t.id === selectedTone);
      title = `Optimized for ${(tone?.label || selectedTone).toLowerCase()} tone`;
      const tooltip = tone?.tooltip;

      return (
        <div className="px-1 py-2 flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-2 flex-1">
            <div className="text-sm font-semibold text-[#6c7180]">{title}</div>
            {tooltip && (
              <Tooltip
                delayDuration={0}
                open={openTooltipId === "header-info"}
                onOpenChange={(open) => setOpenTooltipId(open ? "header-info" : null)}
              >
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-75 touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTooltipId(openTooltipId === "header-info" ? null : "header-info");
                    }}
                    aria-label={`Info about ${title}`}
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px] z-50">
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent active:scale-95 transition-all duration-75 touch-manipulation"
            aria-label="Close and return to main menu"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      );
    }

    return (
      <div className="px-1 py-2 flex items-center justify-between min-h-[44px]">
        <div className="flex-1">
          {title && <div className="text-sm font-semibold text-[#6c7180]">{title}</div>}
        </div>
        {onSwitchKeyboard && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent active:scale-95 transition-all duration-75 touch-manipulation"
            aria-label="Close and return to main menu"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>
    );
  };

  // Render preview field (only on main menu)
  const renderPreviewField = () => {
    const hasContent = displayPreviewText.trim();

    return (
      <div className="px-1 flex flex-col gap-2">
        <div className="flex flex-col gap-2 p-3 bg-accent/30 border-2 border-accent rounded-lg relative">
          {hasContent ? (
            <div className="text-sm text-foreground font-medium leading-relaxed pr-8">
              {displayText}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground/60 pr-8">
              Enter or paste text to process
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="p-1.5 rounded-md hover:bg-accent/50 active:scale-95 transition-all duration-75 touch-manipulation"
              data-testid="button-paste-empty"
              aria-label="Paste from clipboard"
            >
              <Clipboard className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Language selector moved here - only on main menu */}
        <div className="flex gap-2">
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger
              className="w-1/2 min-h-[40px] rounded-lg border-2 text-sm"
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
    );
  };

  // Render main menu buttons
  const renderMainMenu = () => (
    <div className="grid grid-cols-2 gap-3 p-1">
      {PROMPT_BUTTONS.map((button) => (
        <button
          key={button.id}
          type="button"
          onClick={() => handlePromptClick(button.id)}
          className={`
            flex flex-col items-center justify-center gap-2
            min-h-[72px] p-4
            rounded-xl border
            ${button.colorClass}
            ${button.borderClass}
            hover-elevate active-elevate-2
            active:scale-[0.98]
            transition-transform duration-75
            touch-manipulation select-none
          `}
          data-testid={`button-prompt-${button.id}`}
          aria-label={button.label}
        >
          {button.icon}
          <span className="text-sm font-medium text-foreground">
            {button.label}
          </span>
        </button>
      ))}
    </div>
  );

  // Render tone selection menu
  const renderToneSelect = () => (
    <div className="flex flex-col gap-3 p-1">
      {/* Tone options */}
      <div className="grid grid-cols-2 gap-3">
        {TONE_OPTIONS.map((tone) => (
          <div key={tone.id} className="relative">
            <button
              type="button"
              onClick={() => handleToneSelect(tone.id)}
              className={`
                w-full flex items-center justify-center gap-2
                min-h-[56px] p-3
                rounded-xl border
                ${tone.colorClass}
                ${tone.borderClass}
                hover-elevate active-elevate-2
                active:scale-[0.98]
                transition-transform duration-75
                touch-manipulation select-none
              `}
              data-testid={`button-tone-${tone.id}`}
              aria-label={tone.label}
            >
              <span className="text-lg">{tone.emoji}</span>
              <span className="text-sm font-medium text-foreground">
                {tone.label}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Render result view with scrollable results
  const renderResult = () => (
    <div className="flex flex-col gap-3 p-1 max-h-[400px]">
      {/* Results container with scroll */}
      <div ref={resultsContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[250px]">
        {rephraseResults.map((result, index) => {
          const isSelected = selectedResultId === result.id;
          return (
            <div
              key={result.id}
              onClick={() => setSelectedResultId(isSelected ? null : result.id)}
              className={`
                flex flex-col gap-2 p-4 rounded-xl cursor-pointer
                ${isSelected
                  ? "bg-accent/20 border border-primary/50"
                  : "bg-accent/10 border border-accent"}
                active:scale-[0.99] transition-all duration-75
                touch-manipulation
              `}
            >
              {/* Result text */}
              <div className="space-y-2">
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {result.text}
                </div>
              </div>
              {/* Action buttons for this result - only show when selected */}
              {isSelected && (
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyResult(result.id);
                    }}
                    className={`
                      flex-1 flex items-center justify-center gap-2
                      min-h-[40px] px-3
                      rounded-lg border-2
                      ${copiedResultId === result.id
                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                        : "bg-secondary border-border"}
                      active:scale-[0.98]
                      transition-all duration-75
                      touch-manipulation select-none
                    `}
                    data-testid={`button-copy-${result.id}`}
                  >
                    {copiedResultId === result.id ? (
                      <>
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium">Скопировано</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span className="text-xs font-medium">Копировать</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyResult(result.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 min-h-[40px] px-3 rounded-lg border-2 border-[#0b9786] active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none bg-[#0b9786] text-[#ffffff]"
                    data-testid={`button-apply-${result.id}`}
                  >
                    <Check className="h-4 w-4" />
                    <span className="text-xs font-semibold">Применить</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Control panel */}
      <div className="flex gap-2 pt-2 border-t border-border justify-end">
        {/* Create new variant button (icon only) */}
        <button
          type="button"
          onClick={handleReprocess}
          className="flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg border-2 bg-secondary border-border active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none"
          data-testid="button-reprocess"
          aria-label="Создать новый variant"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      {renderHeader()}
      {menuLevel === "main" && renderPreviewField()}

      {menuLevel === "main" && renderMainMenu()}
      {menuLevel === "tone-select" && renderToneSelect()}
      {menuLevel === "result" && renderResult()}

      {/* Globe button at bottom left - iOS style */}
      {onSwitchKeyboard && (
        <div className="px-1 py-2">
          <button
            type="button"
            onClick={onSwitchKeyboard}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] px-4 bg-muted rounded-lg touch-manipulation active:scale-[0.97] transition-transform duration-75"
            data-testid="key-switch-keyboard-ai"
            aria-label="Switch keyboard"
          >
            <Globe className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
