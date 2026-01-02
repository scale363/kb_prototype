import { RefreshCw, Languages, FileText, Clipboard, Globe, ArrowLeft, Copy, Check, RotateCcw, ChevronRight, X, HelpCircle, Plus, MessageSquare, Bookmark, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
    emoji: "\u{1F6E1}",
    tooltip: "Checks grammar and rewrites your message to sound natural, polite, and culturally appropriate at work.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "grammar-check",
    label: "Grammar Check",
    emoji: "✍️",
    tooltip: "Fixes grammar, spelling, and punctuation without rewriting your message.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "informal",
    label: "Informal",
    emoji: "💬",
    tooltip: "Makes your message sound informal and natural — not work-style.",
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

const QUICK_REPLY_ACTIONS: QuickReplyAction[] = [
  {
    id: "help-me-write",
    label: "Help me write",
    emoji: "📝",
    tooltip: "Describe the situation, and we'll help you write a clear, professional message.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "neutral-reply",
    label: "Neutral reply",
    emoji: "🛡️",
    tooltip: "Paste the message to generate a socially appropriate, neutral response that buys you time and avoids risks in business communication.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "agree-politely",
    label: "Agree politely",
    emoji: "🤝",
    tooltip: "Paste the message to generate a polite, professional agreement without taking on unnecessary commitments.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "decline-politely",
    label: "Decline politely",
    emoji: "🚫",
    tooltip: "Paste the message to generate a polite, professional decline based on its content.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "ask-to-clarify",
    label: "Clarify details",
    emoji: "❓",
    tooltip: "Paste the message to generate professional clarification questions based on its content.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "apologize",
    label: "Apologize",
    emoji: "🙏",
    tooltip: "Briefly describe the situation to write a polite apology.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "service-complaint",
    label: "Service Complaint",
    emoji: "⚠️",
    tooltip: "Briefly describe the issue to write a clear, professional complaint message without escalation.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "remind-politely",
    label: "Remind politely",
    emoji: "⏰",
    tooltip: "Paste your previous message to write a polite reminder.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
];

// Subtexts for quick reply actions in the result form
const QUICK_REPLY_SUBTEXTS: Record<string, string> = {
  "neutral-reply": "Improve the result by pasting the message.",
  "agree-politely": "Improve the result by pasting the message.",
  "decline-politely": "Improve the result by pasting the request.",
  "ask-to-clarify": "Improve the result by pasting the message.",
  "apologize": "Improve the result by describing the situation.",
  "service-complaint": "Improve the result by describing the issue.",
  "remind-politely": "Improve the result by pasting the message you want to follow up on.",
  "help-me-write": "Improve the result by describing the situation.",
};

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ru", label: "Russian" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "zh", label: "Chinese" },
];

type MenuLevel = "main" | "tone-select" | "result" | "translate-result" | "quick-replies-select" | "quick-replies-result" | "saved-text" | "rephrase-empty-preview" | "translate-empty-preview" | "quick-replies-empty-preview";

interface RephraseResult {
  id: string;
  text: string;
  tone: string;
  language: string;
  timestamp: number;
}

interface TranslateResult {
  id: string;
  text: string;
  language: string;
  timestamp: number;
}

interface QuickReplyAction {
  id: string;
  label: string;
  emoji: string;
  tooltip: string;
  colorClass: string;
  borderClass: string;
}

interface QuickReplyResult {
  id: string;
  text: string;
  action: string;
  timestamp: number;
}

interface SavedTextItem {
  id: string;
  text: string;
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
    id: "quick-replies",
    label: "Help me write",
    icon: <MessageSquare className="h-6 w-6 text-emerald-500" />,
    description: "Help me write a message for your situation",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "saved-text",
    label: "Saved text",
    icon: <Bookmark className="h-6 w-6 text-orange-500" />,
    description: "Quick insert saved text",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
];

export function AIPromptsKeyboard({ text, selectedText, previewText, onPreviewTextChange, onTextChange, onSwitchKeyboard }: AIPromptsKeyboardProps) {
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

  // Load saved translation language from localStorage or default to "en"
  const [translateLanguage, setTranslateLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem("translate-language") || "en";
    } catch {
      return "en";
    }
  });

  const [translateResults, setTranslateResults] = useState<TranslateResult[]>([]);
  const [selectedTranslateResultId, setSelectedTranslateResultId] = useState<string | null>(null);

  // Load saved quick replies language from localStorage or default to "en"
  const [quickRepliesLanguage, setQuickRepliesLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem("quick-replies-language") || "en";
    } catch {
      return "en";
    }
  });

  const [selectedQuickReplyAction, setSelectedQuickReplyAction] = useState<string | null>(null);
  const [quickReplyResults, setQuickReplyResults] = useState<QuickReplyResult[]>([]);
  const [selectedQuickReplyResultId, setSelectedQuickReplyResultId] = useState<string | null>(null);

  // Load saved text items from localStorage
  const [savedTextItems, setSavedTextItems] = useState<SavedTextItem[]>(() => {
    try {
      const saved = localStorage.getItem("saved-text-items");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  // Save translation language selection to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("translate-language", translateLanguage);
    } catch {
      // localStorage might not be available
    }
  }, [translateLanguage]);

  // Save quick replies language selection to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("quick-replies-language", quickRepliesLanguage);
    } catch {
      // localStorage might not be available
    }
  }, [quickRepliesLanguage]);

  // Save saved text items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("saved-text-items", JSON.stringify(savedTextItems));
    } catch {
      // localStorage might not be available
    }
  }, [savedTextItems]);

  useEffect(() => {
    const handleReset = () => {
      onPreviewTextChange("");
      // Reset menu state when preview is reset
      setMenuLevel("main");
      setSelectedTone(null);
      setRephraseResults([]);
      setTranslateResults([]);
      setQuickReplyResults([]);
      setSelectedQuickReplyAction(null);
    };
    window.addEventListener("resetPreviewText", handleReset);
    return () => window.removeEventListener("resetPreviewText", handleReset);
  }, [onPreviewTextChange]);

  // Auto-scroll to bottom when new variant is generated
  useEffect(() => {
    if (resultsContainerRef.current && (rephraseResults.length > 0 || translateResults.length > 0 || quickReplyResults.length > 0)) {
      // Use smooth scrolling to the bottom
      resultsContainerRef.current.scrollTo({
        top: resultsContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [rephraseResults.length, translateResults.length, quickReplyResults.length]);

  // Auto-transition from rephrase-empty-preview to tone-select when preview becomes non-empty
  useEffect(() => {
    if (menuLevel === "rephrase-empty-preview" && (previewText.trim() || text.trim())) {
      setMenuLevel("tone-select");
    }
  }, [menuLevel, previewText, text]);

  // Auto-transition from translate-empty-preview to translate-result when preview becomes non-empty
  useEffect(() => {
    if (menuLevel === "translate-empty-preview" && (previewText.trim() || text.trim())) {
      handleTranslate();
    }
  }, [menuLevel, previewText, text]);

  // Auto-transition from quick-replies-empty-preview to help-me-write action when preview becomes non-empty
  useEffect(() => {
    if (menuLevel === "quick-replies-empty-preview" && (previewText.trim() || text.trim())) {
      handleQuickReplyActionSelect("help-me-write");
    }
  }, [menuLevel, previewText, text]);

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
      }
    } catch (err) {
      // Ignore clipboard errors silently
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
    setSelectedResultId(newResult.id);
  };

  const handleCopyResult = async (resultId: string) => {
    const result = rephraseResults.find(r => r.id === resultId) 
      || translateResults.find(r => r.id === resultId)
      || quickReplyResults.find(r => r.id === resultId);
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.text);
      setCopiedResultId(resultId);
      setTimeout(() => setCopiedResultId(null), 2000);
    } catch {
      // Ignore copy errors silently
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
    setTranslateResults([]);
    setSelectedTranslateResultId(null);
    setSelectedQuickReplyAction(null);
    setQuickReplyResults([]);
    setSelectedQuickReplyResultId(null);
  };

  const handleBackToTones = () => {
    setMenuLevel("tone-select");
    setRephraseResults([]);
    setCopiedResultId(null);
    setSelectedResultId(null);
  };

  const handleTranslate = () => {
    const originalText = selectedText || previewText || text;
    const langName = LANGUAGES.find(l => l.code === translateLanguage)?.label || translateLanguage;

    const newResult: TranslateResult = {
      id: `translate-result-${Date.now()}`,
      text: `[Translated to ${langName}] This is a translation placeholder. The original message "${truncateText(originalText, 50)}" has been translated to ${langName}. This is temporary mock content that will be replaced with actual AI-generated translation.`,
      language: translateLanguage,
      timestamp: Date.now(),
    };

    setTranslateResults([newResult]);
    setMenuLevel("translate-result");
    setCopiedResultId(null);
    setSelectedTranslateResultId(newResult.id);
  };

  const handleRetranslate = () => {
    const originalText = selectedText || previewText || text;
    const langName = LANGUAGES.find(l => l.code === translateLanguage)?.label || translateLanguage;

    const newResult: TranslateResult = {
      id: `translate-result-${Date.now()}`,
      text: `[Translated to ${langName}] Retranslated placeholder text #${translateResults.length + 1}. The message "${truncateText(originalText, 50)}" has been translated to ${langName}. This is mock content.`,
      language: translateLanguage,
      timestamp: Date.now(),
    };

    // Add new result to the end of the array
    setTranslateResults([...translateResults, newResult]);
    setCopiedResultId(null);
    // Automatically select the new variant
    setSelectedTranslateResultId(newResult.id);
  };

  const handleApplyTranslateResult = (resultId: string) => {
    const result = translateResults.find(r => r.id === resultId);
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
    setTranslateResults([]);
  };

  const handleQuickReplyActionSelect = (actionId: string) => {
    setSelectedQuickReplyAction(actionId);
    const actionName = QUICK_REPLY_ACTIONS.find(a => a.id === actionId)?.label || actionId;
    const langName = LANGUAGES.find(l => l.code === quickRepliesLanguage)?.label || quickRepliesLanguage;
    const originalText = selectedText || previewText || text;

    const newResult: QuickReplyResult = {
      id: `quick-reply-${Date.now()}`,
      text: `[${actionName} - ${langName}] This is a placeholder for your ${actionName.toLowerCase()} message. Context: "${truncateText(originalText, 50)}". This is temporary mock content that will be replaced with actual AI-generated text in ${langName}.`,
      action: actionId,
      timestamp: Date.now(),
    };

    setQuickReplyResults([newResult]);
    setMenuLevel("quick-replies-result");
    setCopiedResultId(null);
    setSelectedQuickReplyResultId(newResult.id);
  };

  const handleRegenerateQuickReply = () => {
    if (!selectedQuickReplyAction) return;

    const actionName = QUICK_REPLY_ACTIONS.find(a => a.id === selectedQuickReplyAction)?.label || selectedQuickReplyAction;
    const langName = LANGUAGES.find(l => l.code === quickRepliesLanguage)?.label || quickRepliesLanguage;
    const originalText = selectedText || previewText || text;

    const newResult: QuickReplyResult = {
      id: `quick-reply-${Date.now()}`,
      text: `[${actionName} - ${langName}] Regenerated placeholder #${quickReplyResults.length + 1} for ${actionName.toLowerCase()}. Context: "${truncateText(originalText, 50)}". This is mock content in ${langName}.`,
      action: selectedQuickReplyAction,
      timestamp: Date.now(),
    };

    setQuickReplyResults([...quickReplyResults, newResult]);
    setCopiedResultId(null);
    setSelectedQuickReplyResultId(newResult.id);
  };

  const handleApplyQuickReplyResult = (resultId: string) => {
    const result = quickReplyResults.find(r => r.id === resultId);
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
    setQuickReplyResults([]);
  };

  const handleSaveFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && clipboardText.trim()) {
        const newItem: SavedTextItem = {
          id: `saved-${Date.now()}`,
          text: clipboardText.trim(),
          timestamp: Date.now(),
        };
        setSavedTextItems([newItem, ...savedTextItems]);
      }
    } catch (err) {
      // Ignore clipboard errors silently
    }
  };

  const handleDeleteSavedText = (itemId: string) => {
    setSavedTextItems(savedTextItems.filter(item => item.id !== itemId));
  };

  const handleInsertSavedText = (itemId: string) => {
    const item = savedTextItems.find(i => i.id === itemId);
    if (!item) return;

    onTextChange(text + item.text);
    setMenuLevel("main");
  };

  const handlePromptClick = async (promptId: string) => {
    switch (promptId) {
      case "rephrase":
        if (!text.trim() && !previewText.trim()) {
          // Show empty preview state with prompt to paste text
          setMenuLevel("rephrase-empty-preview");
          return;
        }
        setMenuLevel("tone-select");
        break;

      case "translate":
        if (!text.trim() && !previewText.trim()) {
          // Show empty preview state with prompt to paste text
          setMenuLevel("translate-empty-preview");
          return;
        }
        handleTranslate();
        break;

      case "quick-replies":
        if (!text.trim() && !previewText.trim()) {
          // Show empty preview state with prompt to paste text
          setMenuLevel("quick-replies-empty-preview");
          return;
        }
        // Directly trigger "help-me-write" action
        handleQuickReplyActionSelect("help-me-write");
        break;

      case "saved-text":
        setMenuLevel("saved-text");
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
    } else if (menuLevel === "rephrase-empty-preview") {
      title = "✏️ Rephrase";
      const tooltip = "Make your message sound natural, polite, and professional.";

      return (
        <div className="px-1 py-2 flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-2 flex-1">
            <div className="text-sm font-semibold text-[#6c7180]">{title}</div>
            {tooltip && (
              <Tooltip
                delayDuration={0}
                open={openTooltipId === "rephrase-empty-info"}
                onOpenChange={(open) => setOpenTooltipId(open ? "rephrase-empty-info" : null)}
              >
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-75 touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTooltipId(openTooltipId === "rephrase-empty-info" ? null : "rephrase-empty-info");
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
    } else if (menuLevel === "translate-empty-preview") {
      title = "🌍 Translate";
      const tooltip = "Literal translation to clearly understand meaning and tone.";

      return (
        <div className="px-1 py-2 flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-2 flex-1">
            <div className="text-sm font-semibold text-[#6c7180]">{title}</div>
            {tooltip && (
              <Tooltip
                delayDuration={0}
                open={openTooltipId === "translate-empty-info"}
                onOpenChange={(open) => setOpenTooltipId(open ? "translate-empty-info" : null)}
              >
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-75 touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTooltipId(openTooltipId === "translate-empty-info" ? null : "translate-empty-info");
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
    } else if (menuLevel === "quick-replies-empty-preview") {
      title = "📝 Help me write. ";
      const tooltip = "Describe the situation, and we'll help you write a clear, professional message.";

      return (
        <div className="px-1 py-2 flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-2 flex-1">
            <div className="text-sm font-semibold text-[#6c7180]">{title}</div>
            {tooltip && (
              <Tooltip
                delayDuration={0}
                open={openTooltipId === "quick-replies-empty-info"}
                onOpenChange={(open) => setOpenTooltipId(open ? "quick-replies-empty-info" : null)}
              >
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-75 touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTooltipId(openTooltipId === "quick-replies-empty-info" ? null : "quick-replies-empty-info");
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
    } else if (menuLevel === "tone-select") {
      title = "✏️ Improve your message";
      const tooltip = "Make your message sound natural, polite, and professional.";

      return (
        <div className="px-1 py-2 flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-2 flex-1">
            <div className="text-sm font-semibold text-[#6c7180]">{title}</div>
            {tooltip && (
              <Tooltip
                delayDuration={0}
                open={openTooltipId === "tone-select-info"}
                onOpenChange={(open) => setOpenTooltipId(open ? "tone-select-info" : null)}
              >
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-75 touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTooltipId(openTooltipId === "tone-select-info" ? null : "tone-select-info");
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
    } else if (menuLevel === "quick-replies-select") {
      title = "💬 Quick replies";
      const tooltip = "All replies are generated in a safe, professional tone suitable for work communication. Paste a client message or briefly describe the situation to get started.";

      return (
        <div className="px-1 py-2 flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-2 flex-1">
            <div className="text-sm font-semibold text-[#6c7180]">{title}</div>
            {tooltip && (
              <Tooltip
                delayDuration={0}
                open={openTooltipId === "quick-replies-select-info"}
                onOpenChange={(open) => setOpenTooltipId(open ? "quick-replies-select-info" : null)}
              >
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-75 touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTooltipId(openTooltipId === "quick-replies-select-info" ? null : "quick-replies-select-info");
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
    } else if (menuLevel === "saved-text") {
      title = "🔖 Saved text";
      const tooltip = "Addresses, replies, and common phrases — always at hand";

      return (
        <div className="px-1 py-2 flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-2 flex-1">
            <div className="text-sm font-semibold text-[#6c7180]">{title}</div>
            {tooltip && (
              <Tooltip
                delayDuration={0}
                open={openTooltipId === "saved-text-info"}
                onOpenChange={(open) => setOpenTooltipId(open ? "saved-text-info" : null)}
              >
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-75 touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTooltipId(openTooltipId === "saved-text-info" ? null : "saved-text-info");
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
    } else if (menuLevel === "translate-result") {
      title = "🌍 Translated message";
      const tooltip = "Literal translation to clearly understand meaning and tone.";

      return (
        <div className="px-1 py-2 flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-2 flex-1">
            <div className="text-sm font-semibold text-[#6c7180]">{title}</div>
            {tooltip && (
              <Tooltip
                delayDuration={0}
                open={openTooltipId === "translate-result-info"}
                onOpenChange={(open) => setOpenTooltipId(open ? "translate-result-info" : null)}
              >
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-75 touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTooltipId(openTooltipId === "translate-result-info" ? null : "translate-result-info");
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
    } else if (menuLevel === "quick-replies-result" && selectedQuickReplyAction) {
      const action = QUICK_REPLY_ACTIONS.find(a => a.id === selectedQuickReplyAction);
      // Special title for help-me-write action
      if (selectedQuickReplyAction === "help-me-write") {
        title = "📝 Message for your situation";
      } else {
        title = `${action?.emoji || ''} ${action?.label || selectedQuickReplyAction}`;
      }
      const tooltip = action?.tooltip;

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
    } else if (menuLevel === "result" && selectedTone) {
      const tone = TONE_OPTIONS.find(t => t.id === selectedTone);
      // Custom titles for each tone
      const titleMap: Record<string, string> = {
        "grammar-check": "✍️ Grammar corrected",
        "work-safe": `${tone?.emoji || ''} Safe to send at work`,
        "informal": "💬 Informal version",
        "short-clear": `${tone?.emoji || ''} Shorter and clearer`,
      };
      title = titleMap[selectedTone] || `${tone?.emoji || ''} Optimized for ${(tone?.label || selectedTone).toLowerCase()} tone`;
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
    if (menuLevel !== "main") return null;

    const hasContent = displayPreviewText.trim();

    return (
      <div className="px-1">
        <div className="flex flex-col gap-2 p-3 bg-accent/30 border-2 border-accent rounded-lg relative">
          {hasContent ? (
            <div className="text-sm text-foreground font-medium leading-relaxed pr-8">
              {displayText}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground/60 pr-8">Paste a message or situation here</div>
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

  // Render empty preview prompt for rephrase
  const renderRephraseEmptyPreview = () => (
    <div className="flex flex-col gap-4 p-1">
      {/* Preview field */}
      <div className="flex flex-col gap-2 p-3 bg-accent/30 border-2 border-accent rounded-lg relative">
        <div className="text-sm text-muted-foreground/60 pr-8">Paste your message here</div>
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="p-1.5 rounded-md hover:bg-accent/50 active:scale-95 transition-all duration-75 touch-manipulation"
            data-testid="button-paste-rephrase-empty"
            aria-label="Paste from clipboard"
          >
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Large prompt message */}
      <div className="flex flex-col items-center justify-center gap-3 py-6 px-4">
        <div className="text-center text-[18px] font-semibold text-[#22282a]">Make your message sound natural, polite, and professional.</div>
      </div>
    </div>
  );

  // Render empty preview prompt for translate
  const renderTranslateEmptyPreview = () => (
    <div className="flex flex-col gap-4 p-1">
      {/* Preview field */}
      <div className="flex flex-col gap-2 p-3 bg-accent/30 border-2 border-accent rounded-lg relative">
        <div className="text-sm text-muted-foreground/60 pr-8">
          Paste the message you received
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="p-1.5 rounded-md hover:bg-accent/50 active:scale-95 transition-all duration-75 touch-manipulation"
            data-testid="button-paste-translate-empty"
            aria-label="Paste from clipboard"
          >
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Large prompt message */}
      <div className="flex flex-col items-center justify-center gap-3 py-6 px-4">
        <div className="text-center text-[18px] font-semibold text-[#22282a]">
          Understand the message clearly in your language.
        </div>
      </div>
    </div>
  );

  // Render empty preview prompt for quick replies
  const renderQuickRepliesEmptyPreview = () => (
    <div className="flex flex-col gap-4 p-1">
      {/* Preview field */}
      <div className="flex flex-col gap-2 p-3 bg-accent/30 border-2 border-accent rounded-lg relative">
        <div className="text-sm text-muted-foreground/60 pr-8">
          Briefly describe the situation…
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="p-1.5 rounded-md hover:bg-accent/50 active:scale-95 transition-all duration-75 touch-manipulation"
            data-testid="button-paste-quick-replies-empty"
            aria-label="Paste from clipboard"
          >
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Large prompt message */}
      <div className="flex flex-col items-center justify-center gap-3 py-6 px-4">
        <div className="text-center text-[18px] font-semibold text-[#22282a]">We'll turn your situation into a clear, well-written message.</div>
      </div>
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
  const renderResult = () => {
    // Check if current tone should hide language selector
    const shouldHideLanguageSelector = selectedTone === "grammar-check";
    // Check if current tone should hide new variant button
    const shouldHideNewVariantButton = selectedTone === "grammar-check";

    return (
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
        <div className="flex gap-2 pt-2">
          {/* Language selector (compact) - hide for grammar-check */}
          {!shouldHideLanguageSelector && (
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
          )}

          {/* Create new variant button (icon only) - hide for grammar-check */}
          {!shouldHideNewVariantButton && (
            <button
              type="button"
              onClick={handleReprocess}
              className={`flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg border-2 bg-secondary border-border active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none ${shouldHideLanguageSelector ? 'ml-auto' : ''}`}
              data-testid="button-reprocess"
              aria-label="Создать новый вариант"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render translate result view with scrollable results
  const renderTranslateResult = () => {
    const selectedResult = translateResults.find(r => r.id === selectedTranslateResultId);
    const isCopied = selectedResult && copiedResultId === selectedResult.id;
    
    return (
      <div className="flex flex-col gap-3 p-1 max-h-[400px]">
        {/* Results container with scroll */}
        <div ref={resultsContainerRef} className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[280px]">
          {translateResults.map((result) => {
            const isSelected = selectedTranslateResultId === result.id;
            const isResultCopied = copiedResultId === result.id;
            return (
              <div
                key={result.id}
                onClick={() => setSelectedTranslateResultId(isSelected ? null : result.id)}
                className="relative p-3 rounded-lg cursor-pointer border border-primary/50 active:scale-[0.99] transition-all duration-75 touch-manipulation bg-[#fdfdfd]"
              >
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pr-8">
                  {result.text}
                </div>
                {/* Copy button inside variant */}
                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyResult(result.id);
                    }}
                    className={`
                      absolute top-2 right-2
                      flex items-center justify-center h-7 w-7 rounded-md
                      ${isResultCopied
                        ? "bg-green-100 dark:bg-green-950/50"
                        : "bg-background/80 hover:bg-accent/50"}
                      active:scale-[0.95] transition-all duration-75 touch-manipulation
                    `}
                    data-testid={`button-copy-translate-${result.id}`}
                    aria-label="Copy"
                    title="Copy"
                  >
                    {isResultCopied ? (
                      <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {/* Compact control panel - all 4 elements on one line */}
        <div className="flex items-center gap-2 pt-1">
          {/* Language selector (compact) */}
          <Select value={translateLanguage} onValueChange={setTranslateLanguage}>
            <SelectTrigger
              className="w-[120px] h-9 rounded-md border text-sm"
              data-testid="select-translate-language"
            >
              <SelectValue placeholder="Язык" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} data-testid={`option-translate-lang-${lang.code}`}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* New variant button (icon only) */}
          <button
            type="button"
            onClick={handleRetranslate}
            className="flex items-center justify-center h-9 w-9 rounded-md border bg-secondary hover:bg-accent/50 active:scale-[0.97] transition-all duration-75 touch-manipulation"
            data-testid="button-retranslate"
            aria-label="Новый вариант"
            title="Новый вариант"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <div className="flex-1" />

          {/* Apply button */}
          <button
            type="button"
            onClick={() => selectedResult && handleApplyTranslateResult(selectedResult.id)}
            disabled={!selectedResult}
            className={`
              flex items-center justify-center gap-1.5 h-9 px-3 rounded-md
              bg-[#0b9786] text-white font-medium text-sm
              ${!selectedResult ? "opacity-40 cursor-not-allowed" : "hover:bg-[#0a8a7a] active:scale-[0.97]"}
              transition-all duration-75 touch-manipulation
            `}
            data-testid="button-apply-translate"
          >
            <Check className="h-4 w-4" />
            <span>Apply</span>
          </button>
        </div>
      </div>
    );
  };

  // Render quick replies selection menu
  const renderQuickRepliesSelect = () => (
    <div className="flex flex-col gap-3 p-1">
      {/* Quick reply action options */}
      <div className="grid grid-cols-2 gap-3">
        {QUICK_REPLY_ACTIONS.map((action) => (
          <div key={action.id} className="relative">
            <button
              type="button"
              onClick={() => handleQuickReplyActionSelect(action.id)}
              className={`
                w-full flex items-center justify-center gap-2
                min-h-[56px] p-3
                rounded-xl border
                ${action.colorClass}
                ${action.borderClass}
                hover-elevate active-elevate-2
                active:scale-[0.98]
                transition-transform duration-75
                touch-manipulation select-none
              `}
              data-testid={`button-quick-reply-${action.id}`}
              aria-label={action.label}
            >
              <span className="text-lg">{action.emoji}</span>
              <span className="text-sm font-medium text-foreground">
                {action.label}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Render quick replies result view with scrollable results
  const renderQuickRepliesResult = () => {
    // Get subtext for the selected action
    const subtext = selectedQuickReplyAction
      ? QUICK_REPLY_SUBTEXTS[selectedQuickReplyAction] || ""
      : "";

    return (
      <div className="flex flex-col gap-3 p-1 max-h-[400px]">
        {/* Results container with scroll */}
      <div ref={resultsContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[250px]">
        {quickReplyResults.map((result, index) => {
          const isSelected = selectedQuickReplyResultId === result.id;
          return (
            <div
              key={result.id}
              onClick={() => setSelectedQuickReplyResultId(isSelected ? null : result.id)}
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
                    data-testid={`button-copy-quick-reply-${result.id}`}
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
                      handleApplyQuickReplyResult(result.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 min-h-[40px] px-3 rounded-lg border-2 border-[#0b9786] active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none bg-[#0b9786] text-[#ffffff]"
                    data-testid={`button-apply-quick-reply-${result.id}`}
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
      <div className="flex gap-2 pt-2">
        {/* Language selector (compact) */}
        <Select value={quickRepliesLanguage} onValueChange={setQuickRepliesLanguage}>
          <SelectTrigger
            className="flex-1 min-h-[40px] rounded-lg border-2 text-sm"
            data-testid="select-quick-replies-language"
          >
            <SelectValue placeholder="Язык" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code} data-testid={`option-quick-replies-lang-${lang.code}`}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Create new variant button (icon only) */}
        <button
          type="button"
          onClick={handleRegenerateQuickReply}
          className="flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg border-2 bg-secondary border-border active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none"
          data-testid="button-regenerate-quick-reply"
          aria-label="Создать новый вариант"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>
    </div>
    );
  };

  // Render saved text view
  const renderSavedText = () => (
    <div className="flex flex-col gap-3 p-1 max-h-[400px]">
      {/* Save from clipboard button */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSaveFromClipboard}
          className="flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg border-2 bg-primary text-primary-foreground border-primary active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none"
          data-testid="button-save-from-clipboard"
        >
          <Clipboard className="h-4 w-4" />
          <span className="text-sm font-medium">Add from Clipboard</span>
        </button>
      </div>

      {/* Saved text items list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[250px]">
        {savedTextItems.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-[15px] pl-[5px] pr-[5px] font-medium">No saved texts yet.

          Save addresses, common phrases, or replies 
          to insert them in one click.</div>
        ) : (
          savedTextItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleInsertSavedText(item.id)}
              className="flex items-center gap-2 p-3 rounded-lg border bg-card border-border cursor-pointer hover:bg-accent/50 active:scale-[0.99] transition-all duration-75 touch-manipulation"
            >
              <div className="flex-1 text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                {item.text}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSavedText(item.id);
                }}
                className="p-1.5 rounded-md hover:bg-destructive/10 active:scale-95 transition-all duration-75 touch-manipulation flex-shrink-0"
                data-testid={`button-delete-${item.id}`}
                aria-label="Delete saved text"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      {renderHeader()}
      {renderPreviewField()}
      {menuLevel === "main" && renderMainMenu()}
      {menuLevel === "rephrase-empty-preview" && renderRephraseEmptyPreview()}
      {menuLevel === "translate-empty-preview" && renderTranslateEmptyPreview()}
      {menuLevel === "quick-replies-empty-preview" && renderQuickRepliesEmptyPreview()}
      {menuLevel === "tone-select" && renderToneSelect()}
      {menuLevel === "result" && renderResult()}
      {menuLevel === "translate-result" && renderTranslateResult()}
      {menuLevel === "quick-replies-select" && renderQuickRepliesSelect()}
      {menuLevel === "quick-replies-result" && renderQuickRepliesResult()}
      {menuLevel === "saved-text" && renderSavedText()}
      {/* Globe button at bottom left - iOS style */}
      {onSwitchKeyboard && (
        <div className="px-1 py-2 bg-[#f4f6f6]">
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
