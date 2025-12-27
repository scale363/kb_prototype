import { RefreshCw, Languages, FileText, Clipboard, Globe, ArrowLeft, Copy, Check, RotateCcw, ChevronRight, X, HelpCircle, Plus } from "lucide-react";
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
    setSelectedResultId(null);
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
      // On main menu, show only X button that switches keyboard
      return (
        <div className="px-1 py-2 flex items-center justify-between min-h-[44px]">
          <div className="flex-1"></div>
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
      title = tone?.label || selectedTone;
      // Don't show subtitle/tooltip on result level
    }

    return (
      <div className="px-1 py-2 flex items-center justify-between min-h-[44px]">
        <div className="flex-1">
          {title && <div className="text-sm font-semibold text-foreground">{title}</div>}
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
    if (menuLevel !== "main") return null;

    const hasContent = displayPreviewText.trim();

    return (
      <div className="px-1">
        <div className="flex flex-col gap-2 p-3 pb-2.5 bg-accent/30 border-2 border-accent rounded-lg relative">
          {hasContent ? (
            <>
              <div className="text-xs font-medium text-muted-foreground pr-16">
                {selectedText ? "Выделенный текст:" : previewText ? "Предпросмотр:" : "Текст для обработки:"}
              </div>
              <div className="text-sm text-foreground font-medium leading-relaxed pr-2">
                {displayText}
              </div>
            </>
          ) : (
            <div className="text-xs font-medium text-muted-foreground pr-16">
              Введите или вставьте текст для работы
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
      </div>
    );
  };

  // Render main menu buttons
  const renderMainMenu = () => {
    if (menuLevel !== "main") {
      return menuLevel === "tone-select" ? renderToneSelect() : renderResult();
    }

    return (
      <div className="grid grid-cols-2 gap-3 p-1">
        {PROMPT_BUTTONS.map((button) => (
          <button
            key={button.id}
            type="button"
            onClick={() => handlePromptClick(button.id)}
            className={`
              flex flex-col items-center justify-center p-6
              rounded-2xl border-2 border-border bg-card
              transition-all duration-200 hover:-translate-y-0.5
              hover:shadow-md active:translate-y-0
              ${button.colorClass}
            `}
            data-testid={`button-prompt-${button.id}`}
          >
            <div className="mb-3 transition-transform duration-200 group-hover:scale-110">
              {button.icon}
            </div>
            <span className="text-[15px] font-semibold text-foreground">
              {button.label}
            </span>
          </button>
        ))}
      </div>
    );
  };

  const PROMPT_BUTTONS = [
    {
      id: "rephrase",
      label: "Rephrase",
      icon: <RefreshCw className="h-6 w-6 stroke-[2.5px]" />,
      colorClass: "hover:bg-blue-50 hover:border-[#3b82f6] text-[#3b82f6]",
    },
    {
      id: "translate",
      label: "Translate",
      icon: <Languages className="h-6 w-6 stroke-[2.5px]" />,
      colorClass: "hover:bg-purple-50 hover:border-[#8b5cf6] text-[#8b5cf6]",
    },
    {
      id: "snippets",
      label: "Snippets",
      icon: <FileText className="h-6 w-6 stroke-[2.5px]" />,
      colorClass: "hover:bg-green-50 hover:border-[#10b981] text-[#10b981]",
    },
    {
      id: "clipboard",
      label: "Clipboard",
      icon: <Clipboard className="h-6 w-6 stroke-[2.5px]" />,
      colorClass: "hover:bg-orange-50 hover:border-[#f59e0b] text-[#f59e0b]",
    },
  ];

  return (
    <div className="flex flex-col gap-2 w-full">
      {renderHeader()}
      {renderPreviewField()}
      {renderMainMenu()}
    </div>
  );
}

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
                min-h-[56px] p-3 pr-9
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
            <Tooltip
              delayDuration={0}
              open={openTooltipId === tone.id}
              onOpenChange={(open) => setOpenTooltipId(open ? tone.id : null)}
            >
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-75 touch-manipulation z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenTooltipId(openTooltipId === tone.id ? null : tone.id);
                  }}
                  aria-label={`Info about ${tone.label}`}
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[250px] z-50">
                <p className="text-xs">{tone.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  );

  // Render result view with scrollable results
  const renderResult = () => (
    <div className="flex flex-col gap-3 p-1 max-h-[400px]">
      {/* Results container with scroll */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[250px]">
        {rephraseResults.map((result, index) => {
          const isSelected = selectedResultId === result.id;
          return (
            <div
              key={result.id}
              onClick={() => setSelectedResultId(isSelected ? null : result.id)}
              className={`
                flex flex-col gap-2 p-4 rounded-xl cursor-pointer
                ${isSelected
                  ? "bg-accent/50 border-2 border-primary"
                  : "bg-accent/30 border-2 border-accent"}
                active:scale-[0.99] transition-all duration-75
                touch-manipulation
              `}
            >
              {/* Result number and text */}
              <div className="space-y-2">
                {rephraseResults.length > 1 && (
                  <div className="text-xs font-medium text-muted-foreground">
                    Вариант {index + 1}
                  </div>
                )}
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
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyResult(result.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 min-h-[40px] px-3 rounded-lg border-2 bg-primary border-primary-border text-primary-foreground active:scale-[0.98] transition-all duration-75 touch-manipulation select-none"
                    data-testid={`button-apply-${result.id}`}
                  >
                    <span className="text-xs font-medium">Apply</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex gap-2 pt-2 border-t border-border mt-auto">
        <button
          type="button"
          onClick={handleReprocess}
          className="flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded-xl border-2 border-border bg-card hover:bg-accent active:scale-[0.98] transition-all duration-75 touch-manipulation"
        >
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Reprocess</span>
        </button>
        <button
          type="button"
          onClick={handleBackToTones}
          className="flex items-center justify-center min-h-[44px] px-4 rounded-xl border-2 border-border bg-card hover:bg-accent active:scale-[0.98] transition-all duration-75 touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
                      handleApplyResult(result.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 min-h-[40px] px-3 rounded-lg border-2 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none"
                    data-testid={`button-apply-${result.id}`}
                  >
                    <Check className="h-4 w-4" />
                    <span className="text-xs font-medium">Применить</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Control panel */}
      <div className="flex gap-2 pt-2 border-t border-border">
        {/* Language selector (compact) */}
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger
            className="flex-1 min-h-[40px] rounded-lg border-2 text-sm"
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

        {/* Create new variant button (icon only) */}
        <button
          type="button"
          onClick={handleReprocess}
          className="flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg border-2 bg-secondary border-border active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none"
          data-testid="button-reprocess"
          aria-label="Создать новый вариант"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      {renderHeader()}
      {renderPreviewField()}

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
