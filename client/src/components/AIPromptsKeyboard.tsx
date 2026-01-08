import { RefreshCw, Languages, FileText, Clipboard, Globe, ArrowLeft, Copy, Check, RotateCcw, ChevronRight, X, HelpCircle, Plus, MessageSquare, Bookmark, Trash2, CheckCircle2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DiffText } from "@/components/DiffText";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

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
    label: "Professional tone",
    emoji: "\u{1F6E1}",
    tooltip: "Checks grammar and rewrites your message to sound natural, polite, and culturally appropriate at work.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "informal",
    label: "Informal tone",
    emoji: "💬",
    tooltip: "Makes your message sound informal and natural — not work-style.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "short-clear",
    label: "Shorter",
    emoji: "◯",
    tooltip: "Makes your message concise, easy to read, and action-oriented.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "make-longer",
    label: "Longer",
    emoji: "◯",
    tooltip: "Expands your message with more details and context while keeping the same meaning.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "more-polite",
    label: "More Polite",
    emoji: "◯",
    tooltip: "Makes your message sound more polite and courteous.",
    colorClass: "bg-card dark:bg-card",
    borderClass: "border-border",
  },
  {
    id: "more-direct",
    label: "More Direct",
    emoji: "◯",
    tooltip: "Makes your message more direct and straightforward.",
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
  { code: "en", label: "English", emoji: "🇬🇧" },
  { code: "ru", label: "Russian", emoji: "🇷🇺" },
  { code: "es", label: "Spanish", emoji: "🇪🇸" },
  { code: "de", label: "German", emoji: "🇩🇪" },
  { code: "zh", label: "Chinese", emoji: "🇨🇳" },
];

// Response types for Help me write feature
const RESPONSE_TYPES = [
  { code: "chat", label: "Chat message", emoji: "💬" },
  { code: "email", label: "Email", emoji: "✉️" },
];

// Rotating placeholder texts for Help me write empty state
const HELP_ME_WRITE_PLACEHOLDERS = [
  "Briefly describe the situation…",
  'E.g. "email to embassy — ask appointment rules"',  
  'E.g. "decline meeting — no availability this week"',
  'E.g. "hotel complaint — noisy room at night"',
  'E.g. "say no to task — already overloaded"',
  'E.g. "congratulatory message to a friend"',
  'E.g. "missing the deadline - ask for 2 more days"',
  'E.g. "restaurant review — tasty food, cozy place"',
];

type MenuLevel = "main" | "tone-select" | "result" | "translate-result" | "quick-replies-select" | "quick-replies-result" | "saved-text" | "rephrase-empty-preview" | "translate-empty-preview" | "quick-replies-empty-preview" | "grammar-check-result" | "grammar-check-empty-preview";

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
  originalText: string;
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

interface GrammarCheckResult {
  id: string;
  text: string;
  originalText: string;
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
    id: "grammar-check",
    label: "Grammar check",
    icon: <CheckCircle2 className="h-6 w-6 text-pink-500" />,
    description: "Check grammar and spelling",
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

  // State for tracking button group mode: 'main' for default buttons, or 'rephrase'/'translate'/'quick-replies' for option buttons
  const [buttonGroupMode, setButtonGroupMode] = useState<'main' | 'rephrase' | 'translate' | 'quick-replies'>('main');

  // Load saved rephrase tone from localStorage or default to "work-safe"
  const [selectedTone, setSelectedTone] = useState<string>(() => {
    try {
      return localStorage.getItem("rephrase-tone") || "work-safe";
    } catch {
      return "work-safe";
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
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isRephrasing, setIsRephrasing] = useState<boolean>(false);
  const [translateCarouselApi, setTranslateCarouselApi] = useState<CarouselApi>();
  const [currentTranslateIndex, setCurrentTranslateIndex] = useState(0);
  const [rephraseCarouselApi, setRephraseCarouselApi] = useState<CarouselApi>();
  const [currentRephraseIndex, setCurrentRephraseIndex] = useState(0);
  const [quickReplyCarouselApi, setQuickReplyCarouselApi] = useState<CarouselApi>();
  const [currentQuickReplyIndex, setCurrentQuickReplyIndex] = useState(0);

  // Load saved quick replies language from localStorage or default to "en"
  const [quickRepliesLanguage, setQuickRepliesLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem("quick-replies-language") || "en";
    } catch {
      return "en";
    }
  });

  // Load saved response type from localStorage or default to "chat"
  const [responseType, setResponseType] = useState<string>(() => {
    try {
      return localStorage.getItem("help-write-response-type") || "chat";
    } catch {
      return "chat";
    }
  });

  const [selectedQuickReplyAction, setSelectedQuickReplyAction] = useState<string | null>(null);
  const [quickReplyResults, setQuickReplyResults] = useState<QuickReplyResult[]>([]);
  const [selectedQuickReplyResultId, setSelectedQuickReplyResultId] = useState<string | null>(null);
  const [isGeneratingQuickReply, setIsGeneratingQuickReply] = useState<boolean>(false);

  const [grammarCheckResults, setGrammarCheckResults] = useState<GrammarCheckResult[]>([]);
  const [selectedGrammarCheckResultId, setSelectedGrammarCheckResultId] = useState<string | null>(null);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState<boolean>(false);

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

  // Ref for tracking translate language changes
  const prevTranslateLanguageRef = useRef<string>(translateLanguage);

  // Ref for tracking quick replies language changes
  const prevQuickRepliesLanguageRef = useRef<string>(quickRepliesLanguage);

  // Ref for tracking response type changes
  const prevResponseTypeRef = useRef<string>(responseType);

  // Ref for tracking rephrase tone changes
  const prevRephraseSelectedToneRef = useRef<string>(selectedTone);

  // AbortController refs for canceling ongoing requests
  const rephraseAbortControllerRef = useRef<AbortController | null>(null);
  const translateAbortControllerRef = useRef<AbortController | null>(null);
  const quickReplyAbortControllerRef = useRef<AbortController | null>(null);
  const grammarCheckAbortControllerRef = useRef<AbortController | null>(null);

  // State for rotating placeholder in Help me write empty state
  const [placeholderIndex, setPlaceholderIndex] = useState<number>(0);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState<string>("");
  const [isFirstChange, setIsFirstChange] = useState<boolean>(true);

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

  // Save response type selection to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("help-write-response-type", responseType);
    } catch {
      // localStorage might not be available
    }
  }, [responseType]);

  // Save rephrase tone selection to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("rephrase-tone", selectedTone);
    } catch {
      // localStorage might not be available
    }
  }, [selectedTone]);

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
      setButtonGroupMode('main'); // Reset button group mode
      // Don't reset selectedTone - keep it for next rephrase
      setRephraseResults([]);
      setTranslateResults([]);
      setQuickReplyResults([]);
      setSelectedQuickReplyAction(null);
      setGrammarCheckResults([]);
    };
    window.addEventListener("resetPreviewText", handleReset);
    return () => window.removeEventListener("resetPreviewText", handleReset);
  }, [onPreviewTextChange]);

  // Auto-scroll to bottom when new variant is generated
  useEffect(() => {
    if (resultsContainerRef.current && (rephraseResults.length > 0 || translateResults.length > 0 || quickReplyResults.length > 0 || grammarCheckResults.length > 0)) {
      // Use smooth scrolling to the bottom
      resultsContainerRef.current.scrollTo({
        top: resultsContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [rephraseResults.length, translateResults.length, quickReplyResults.length, grammarCheckResults.length]);

  // Auto-transition from rephrase-empty-preview to generate with last tone when preview becomes non-empty
  useEffect(() => {
    if (menuLevel === "rephrase-empty-preview" && (previewText.trim() || text.trim())) {
      handleToneSelect(selectedTone);
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

  // Auto-transition from grammar-check-empty-preview to grammar-check-result when preview becomes non-empty
  useEffect(() => {
    if (menuLevel === "grammar-check-empty-preview" && (previewText.trim() || text.trim())) {
      handleGrammarCheck();
    }
  }, [menuLevel, previewText, text]);

  // Rotate placeholder text in Help me write empty state with animation
  useEffect(() => {
    if (menuLevel === "quick-replies-empty-preview" && !previewText.trim() && !text.trim()) {
      const currentPhrase = HELP_ME_WRITE_PLACEHOLDERS[placeholderIndex];
      let currentCharIndex = 0;
      let timeoutId: NodeJS.Timeout;
      let intervalId: NodeJS.Timeout;

      const startNextPhrase = () => {
        // Move to next phrase
        setPlaceholderIndex((prevIndex) => (prevIndex + 1) % HELP_ME_WRITE_PLACEHOLDERS.length);
        setIsFirstChange(false);
      };

      if (isFirstChange && placeholderIndex === 0) {
        // For the very first placeholder, show it immediately
        setAnimatedPlaceholder(currentPhrase);
        // After 1 second, move to the next phrase
        timeoutId = setTimeout(() => {
          startNextPhrase();
        }, 1000);
      } else {
        // Animate character by character
        setAnimatedPlaceholder("");
        intervalId = setInterval(() => {
          if (currentCharIndex < currentPhrase.length) {
            setAnimatedPlaceholder(currentPhrase.substring(0, currentCharIndex + 1));
            currentCharIndex++;
          } else {
            clearInterval(intervalId);
            // Wait a bit before starting the next phrase
            timeoutId = setTimeout(() => {
              startNextPhrase();
            }, 2000);
          }
        }, 30); // Fast character animation - 30ms per character
      }

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (intervalId) clearInterval(intervalId);
      };
    } else {
      // Reset state when leaving empty preview
      setPlaceholderIndex(0);
      setAnimatedPlaceholder("");
      setIsFirstChange(true);
    }
  }, [menuLevel, previewText, text, placeholderIndex, isFirstChange]);

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

  const handleToneSelect = async (toneId: string) => {
    setSelectedTone(toneId);
    setButtonGroupMode('main'); // Reset button group mode when starting generation
    const originalText = selectedText || previewText || text;

    // Check message length
    if (originalText.length > 1000) {
      setMenuLevel("result");
      const newResult: RephraseResult = {
        id: `result-${Date.now()}`,
        text: "Message is too long. Maximum 1000 characters allowed.",
        tone: toneId,
        language: "",
        timestamp: Date.now(),
      };
      setRephraseResults([newResult]);
      setSelectedResultId(newResult.id);
      return;
    }

    // Cancel any ongoing rephrase request
    if (rephraseAbortControllerRef.current && !rephraseAbortControllerRef.current.signal.aborted) {
      rephraseAbortControllerRef.current.abort("User cancelled");
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    rephraseAbortControllerRef.current = abortController;

    // Show loading skeleton
    setIsRephrasing(true);
    setMenuLevel("result");
    setRephraseResults([]);

    try {
      const response = await fetch("/api/ai/rephrase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: originalText,
          tone: toneId,
        }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (data.success && data.rephrased) {
        const newResult: RephraseResult = {
          id: `result-${Date.now()}`,
          text: data.rephrased,
          tone: toneId,
          language: "",
          timestamp: Date.now(),
        };

        setRephraseResults([newResult]);
        setSelectedResultId(newResult.id);
      } else {
        // Fallback to error message if API fails
        const newResult: RephraseResult = {
          id: `result-${Date.now()}`,
          text: `Error: ${data.error || "Rephrasing failed"}`,
          tone: toneId,
          language: "",
          timestamp: Date.now(),
        };
        setRephraseResults([newResult]);
        setSelectedResultId(newResult.id);
      }
    } catch (error: any) {
      // Ignore abort errors (request was canceled intentionally)
      if (error.name === 'AbortError' || error.message === 'User cancelled' || error === 'User cancelled') {
        return;
      }
      console.error("Rephrase error:", error);
      const newResult: RephraseResult = {
        id: `result-${Date.now()}`,
        text: "Error: Failed to connect to AI service",
        tone: toneId,
        language: "",
        timestamp: Date.now(),
      };
      setRephraseResults([newResult]);
      setSelectedResultId(newResult.id);
    } finally {
      // Only clear loading state if this request wasn't aborted
      if (rephraseAbortControllerRef.current === abortController) {
        setIsRephrasing(false);
        rephraseAbortControllerRef.current = null;
      }
      setCopiedResultId(null);
    }
  };

  const handleCopyResult = async (resultId: string) => {
    const result = rephraseResults.find(r => r.id === resultId)
      || translateResults.find(r => r.id === resultId)
      || quickReplyResults.find(r => r.id === resultId)
      || grammarCheckResults.find(r => r.id === resultId);
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
    // Don't reset selectedTone - keep it for next rephrase
    setRephraseResults([]);
  };

  const handleReprocess = async () => {
    if (!selectedTone) return;

    const originalText = selectedText || previewText || text;

    // Check message length
    if (originalText.length > 1000) {
      const newResult: RephraseResult = {
        id: `result-${Date.now()}`,
        text: "Message is too long. Maximum 1000 characters allowed.",
        tone: selectedTone,
        language: "",
        timestamp: Date.now(),
      };
      setRephraseResults([...rephraseResults, newResult]);
      setSelectedResultId(newResult.id);
      return;
    }

    // Cancel any ongoing rephrase request
    if (rephraseAbortControllerRef.current && !rephraseAbortControllerRef.current.signal.aborted) {
      rephraseAbortControllerRef.current.abort("User cancelled");
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    rephraseAbortControllerRef.current = abortController;

    // Show loading state
    setIsRephrasing(true);

    try {
      const response = await fetch("/api/ai/rephrase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: originalText,
          tone: selectedTone,
        }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (data.success && data.rephrased) {
        const newResult: RephraseResult = {
          id: `result-${Date.now()}`,
          text: data.rephrased,
          tone: selectedTone,
          language: "",
          timestamp: Date.now(),
        };

        setRephraseResults([...rephraseResults, newResult]);
        setSelectedResultId(newResult.id);
      } else {
        const newResult: RephraseResult = {
          id: `result-${Date.now()}`,
          text: `Error: ${data.error || "Rephrasing failed"}`,
          tone: selectedTone,
          language: "",
          timestamp: Date.now(),
        };
        setRephraseResults([...rephraseResults, newResult]);
        setSelectedResultId(newResult.id);
      }
    } catch (error: any) {
      // Ignore abort errors (request was canceled intentionally)
      if (error.name === 'AbortError' || error.message === 'User cancelled' || error === 'User cancelled') {
        return;
      }
      console.error("Reprocess error:", error);
      const newResult: RephraseResult = {
        id: `result-${Date.now()}`,
        text: "Error: Failed to connect to AI service",
        tone: selectedTone,
        language: "",
        timestamp: Date.now(),
      };
      setRephraseResults([...rephraseResults, newResult]);
      setSelectedResultId(newResult.id);
    } finally {
      // Only clear loading state if this request wasn't aborted
      if (rephraseAbortControllerRef.current === abortController) {
        setIsRephrasing(false);
        rephraseAbortControllerRef.current = null;
      }
      setCopiedResultId(null);
    }
  };

  const handleBackToMain = () => {
    setMenuLevel("main");
    setButtonGroupMode('main'); // Reset button group mode when returning to main menu
    // Don't reset selectedTone - keep it for next rephrase
    setRephraseResults([]);
    setSelectedResultId(null);
    setTranslateResults([]);
    setSelectedTranslateResultId(null);
    setSelectedQuickReplyAction(null);
    setQuickReplyResults([]);
    setSelectedQuickReplyResultId(null);
    setGrammarCheckResults([]);
    setSelectedGrammarCheckResultId(null);
  };

  const handleBackToTones = () => {
    setMenuLevel("tone-select");
    setRephraseResults([]);
    setCopiedResultId(null);
    setSelectedResultId(null);
  };

  const handleTranslate = async (langCode?: string) => {
    const targetLanguage = langCode || translateLanguage;
    setButtonGroupMode('main'); // Reset button group mode when starting translation
    const originalText = selectedText || previewText || text;

    // Check message length
    if (originalText.length > 1000) {
      setMenuLevel("translate-result");
      const newResult: TranslateResult = {
        id: `translate-result-${Date.now()}`,
        text: "Message is too long. Maximum 1000 characters allowed.",
        originalText: originalText,
        language: targetLanguage,
        timestamp: Date.now(),
      };
      setTranslateResults([newResult]);
      setSelectedTranslateResultId(newResult.id);
      return;
    }

    // Cancel any ongoing translate request
    if (translateAbortControllerRef.current && !translateAbortControllerRef.current.signal.aborted) {
      translateAbortControllerRef.current.abort("User cancelled");
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    translateAbortControllerRef.current = abortController;

    // Show loading skeleton
    setIsTranslating(true);
    setMenuLevel("translate-result");
    setTranslateResults([]);

    try {
      const response = await fetch("/api/ai/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: originalText,
          targetLanguage: targetLanguage,
        }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (data.success && data.translated) {
        const newResult: TranslateResult = {
          id: `translate-result-${Date.now()}`,
          text: data.translated,
          originalText: originalText,
          language: targetLanguage,
          timestamp: Date.now(),
        };

        setTranslateResults([newResult]);
        setSelectedTranslateResultId(newResult.id);
      } else {
        // Fallback to placeholder if API fails
        const langName = LANGUAGES.find(l => l.code === targetLanguage)?.label || targetLanguage;
        const newResult: TranslateResult = {
          id: `translate-result-${Date.now()}`,
          text: `Error: ${data.error || "Translation failed"}`,
          originalText: originalText,
          language: targetLanguage,
          timestamp: Date.now(),
        };
        setTranslateResults([newResult]);
        setSelectedTranslateResultId(newResult.id);
      }
    } catch (error: any) {
      // Ignore abort errors (request was canceled intentionally)
      if (error.name === 'AbortError' || error.message === 'User cancelled' || error === 'User cancelled') {
        return;
      }
      console.error("Translation error:", error);
      const newResult: TranslateResult = {
        id: `translate-result-${Date.now()}`,
        text: "Error: Failed to connect to translation service",
        originalText: originalText,
        language: targetLanguage,
        timestamp: Date.now(),
      };
      setTranslateResults([newResult]);
      setSelectedTranslateResultId(newResult.id);
    } finally {
      // Only clear loading state if this request wasn't aborted
      if (translateAbortControllerRef.current === abortController) {
        setIsTranslating(false);
        translateAbortControllerRef.current = null;
      }
    }
  };

  const handleRetranslate = async () => {
    const originalText = selectedText || previewText || text;

    // Check message length
    if (originalText.length > 1000) {
      const newResult: TranslateResult = {
        id: `translate-result-${Date.now()}`,
        text: "Message is too long. Maximum 1000 characters allowed.",
        originalText: originalText,
        language: translateLanguage,
        timestamp: Date.now(),
      };
      setTranslateResults([...translateResults, newResult]);
      setSelectedTranslateResultId(newResult.id);
      return;
    }

    // Cancel any ongoing translate request
    if (translateAbortControllerRef.current && !translateAbortControllerRef.current.signal.aborted) {
      translateAbortControllerRef.current.abort("User cancelled");
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    translateAbortControllerRef.current = abortController;

    // Show loading state
    setIsTranslating(true);

    try {
      const response = await fetch("/api/ai/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: originalText,
          targetLanguage: translateLanguage,
        }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (data.success && data.translated) {
        const newResult: TranslateResult = {
          id: `translate-result-${Date.now()}`,
          text: data.translated,
          originalText: originalText,
          language: translateLanguage,
          timestamp: Date.now(),
        };

        setTranslateResults([...translateResults, newResult]);
        setSelectedTranslateResultId(newResult.id);
      } else {
        const newResult: TranslateResult = {
          id: `translate-result-${Date.now()}`,
          text: `Error: ${data.error || "Translation failed"}`,
          originalText: originalText,
          language: translateLanguage,
          timestamp: Date.now(),
        };
        setTranslateResults([...translateResults, newResult]);
        setSelectedTranslateResultId(newResult.id);
      }
    } catch (error: any) {
      // Ignore abort errors (request was canceled intentionally)
      if (error.name === 'AbortError' || error.message === 'User cancelled' || error === 'User cancelled') {
        return;
      }
      console.error("Retranslation error:", error);
      const newResult: TranslateResult = {
        id: `translate-result-${Date.now()}`,
        text: "Error: Failed to connect to translation service",
        originalText: originalText,
        language: translateLanguage,
        timestamp: Date.now(),
      };
      setTranslateResults([...translateResults, newResult]);
      setSelectedTranslateResultId(newResult.id);
    } finally {
      // Only clear loading state if this request wasn't aborted
      if (translateAbortControllerRef.current === abortController) {
        setIsTranslating(false);
        translateAbortControllerRef.current = null;
      }
      setCopiedResultId(null);
    }
  };

  // Auto-generate new translation when language changes in translate-result mode
  useEffect(() => {
    if (menuLevel === "translate-result" &&
        translateLanguage !== prevTranslateLanguageRef.current &&
        (translateResults.length > 0 || isTranslating)) {
      handleRetranslate();
      // Blur the select to remove focus
      const selectElement = document.querySelector('[data-testid="select-translate-language"]');
      if (selectElement instanceof HTMLElement) {
        selectElement.blur();
      }
    }
    prevTranslateLanguageRef.current = translateLanguage;
  }, [translateLanguage]);

  // Sync carousel with current index and selected result
  useEffect(() => {
    if (!translateCarouselApi) return;

    const onSelect = () => {
      const selectedIndex = translateCarouselApi.selectedScrollSnap();
      setCurrentTranslateIndex(selectedIndex);
      if (translateResults[selectedIndex]) {
        setSelectedTranslateResultId(translateResults[selectedIndex].id);
      }
    };

    translateCarouselApi.on("select", onSelect);
    return () => {
      translateCarouselApi.off("select", onSelect);
    };
  }, [translateCarouselApi, translateResults]);

  // Auto-scroll to newest translation variant when a new one is added
  useEffect(() => {
    if (translateCarouselApi && translateResults.length > 0) {
      const lastIndex = translateResults.length - 1;
      translateCarouselApi.scrollTo(lastIndex);
    }
  }, [translateResults.length, translateCarouselApi]);

  // Sync rephrase carousel with current index and selected result
  useEffect(() => {
    if (!rephraseCarouselApi) return;

    const onSelect = () => {
      const selectedIndex = rephraseCarouselApi.selectedScrollSnap();
      setCurrentRephraseIndex(selectedIndex);
      if (rephraseResults[selectedIndex]) {
        setSelectedResultId(rephraseResults[selectedIndex].id);
      }
    };

    rephraseCarouselApi.on("select", onSelect);
    return () => {
      rephraseCarouselApi.off("select", onSelect);
    };
  }, [rephraseCarouselApi, rephraseResults]);

  // Auto-scroll to newest rephrase variant when a new one is added
  useEffect(() => {
    if (rephraseCarouselApi && rephraseResults.length > 0) {
      const lastIndex = rephraseResults.length - 1;
      rephraseCarouselApi.scrollTo(lastIndex);
    }
  }, [rephraseResults.length, rephraseCarouselApi]);

  // Sync quick reply carousel with current index and selected result
  useEffect(() => {
    if (!quickReplyCarouselApi) return;

    const onSelect = () => {
      const selectedIndex = quickReplyCarouselApi.selectedScrollSnap();
      setCurrentQuickReplyIndex(selectedIndex);
      if (quickReplyResults[selectedIndex]) {
        setSelectedQuickReplyResultId(quickReplyResults[selectedIndex].id);
      }
    };

    quickReplyCarouselApi.on("select", onSelect);
    return () => {
      quickReplyCarouselApi.off("select", onSelect);
    };
  }, [quickReplyCarouselApi, quickReplyResults]);

  // Auto-scroll to newest quick reply variant when a new one is added
  useEffect(() => {
    if (quickReplyCarouselApi && quickReplyResults.length > 0) {
      const lastIndex = quickReplyResults.length - 1;
      quickReplyCarouselApi.scrollTo(lastIndex);
    }
  }, [quickReplyResults.length, quickReplyCarouselApi]);

  // Auto-generate new quick reply variant when language changes in quick-replies-result mode
  useEffect(() => {
    if (menuLevel === "quick-replies-result" &&
        quickRepliesLanguage !== prevQuickRepliesLanguageRef.current &&
        (quickReplyResults.length > 0 || isGeneratingQuickReply)) {
      handleRegenerateQuickReply();
      // Blur the select to remove focus
      const selectElement = document.querySelector('[data-testid="select-quick-replies-language"]');
      if (selectElement instanceof HTMLElement) {
        selectElement.blur();
      }
    }
    prevQuickRepliesLanguageRef.current = quickRepliesLanguage;
  }, [quickRepliesLanguage]);

  // Auto-generate new quick reply variant when response type changes in quick-replies-result mode
  useEffect(() => {
    if (menuLevel === "quick-replies-result" &&
        responseType !== prevResponseTypeRef.current &&
        (quickReplyResults.length > 0 || isGeneratingQuickReply)) {
      handleRegenerateQuickReply();
      // Blur the select to remove focus
      const selectElement = document.querySelector('[data-testid="select-response-type"]');
      if (selectElement instanceof HTMLElement) {
        selectElement.blur();
      }
    }
    prevResponseTypeRef.current = responseType;
  }, [responseType]);

  // Auto-generate new rephrase variant when tone changes in result mode
  useEffect(() => {
    if (menuLevel === "result" &&
        selectedTone !== prevRephraseSelectedToneRef.current &&
        (rephraseResults.length > 0 || isRephrasing)) {
      handleReprocess();
      // Blur the select to remove focus
      const selectElement = document.querySelector('[data-testid="select-rephrase-tone"]');
      if (selectElement instanceof HTMLElement) {
        selectElement.blur();
      }
    }
    prevRephraseSelectedToneRef.current = selectedTone;
  }, [selectedTone]);

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

  const handleQuickReplyActionSelect = async (actionId: string) => {
    setSelectedQuickReplyAction(actionId);
    setButtonGroupMode('main'); // Reset button group mode when starting generation
    const originalText = selectedText || previewText || text;

    // Check message length
    if (originalText.length > 1000) {
      setMenuLevel("quick-replies-result");
      const newResult: QuickReplyResult = {
        id: `quick-reply-${Date.now()}`,
        text: "Message is too long. Maximum 1000 characters allowed.",
        action: actionId,
        timestamp: Date.now(),
      };
      setQuickReplyResults([newResult]);
      setSelectedQuickReplyResultId(newResult.id);
      return;
    }

    // Cancel any ongoing quick reply request
    if (quickReplyAbortControllerRef.current && !quickReplyAbortControllerRef.current.signal.aborted) {
      quickReplyAbortControllerRef.current.abort("User cancelled");
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    quickReplyAbortControllerRef.current = abortController;

    // Show loading skeleton
    setIsGeneratingQuickReply(true);
    setMenuLevel("quick-replies-result");
    setQuickReplyResults([]);

    try {
      const response = await fetch("/api/ai/help-write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          situation: originalText,
          language: quickRepliesLanguage,
          responseType: responseType
        }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (data.success && data.generatedText) {
        const newResult: QuickReplyResult = {
          id: `quick-reply-${Date.now()}`,
          text: data.generatedText,
          action: actionId,
          timestamp: Date.now(),
        };

        setQuickReplyResults([newResult]);
        setSelectedQuickReplyResultId(newResult.id);
      } else {
        // Fallback to error message if API fails
        const newResult: QuickReplyResult = {
          id: `quick-reply-${Date.now()}`,
          text: `Error: ${data.error || "Failed to generate message"}`,
          action: actionId,
          timestamp: Date.now(),
        };
        setQuickReplyResults([newResult]);
        setSelectedQuickReplyResultId(newResult.id);
      }
    } catch (error: any) {
      // Ignore abort errors (request was canceled intentionally)
      if (error.name === 'AbortError' || error.message === 'User cancelled' || error === 'User cancelled') {
        return;
      }
      console.error("Help write error:", error);
      const newResult: QuickReplyResult = {
        id: `quick-reply-${Date.now()}`,
        text: "Error: Failed to connect to AI service",
        action: actionId,
        timestamp: Date.now(),
      };
      setQuickReplyResults([newResult]);
      setSelectedQuickReplyResultId(newResult.id);
    } finally {
      // Only clear loading state if this request wasn't aborted
      if (quickReplyAbortControllerRef.current === abortController) {
        setIsGeneratingQuickReply(false);
        quickReplyAbortControllerRef.current = null;
      }
    }
  };

  const handleRegenerateQuickReply = async () => {
    if (!selectedQuickReplyAction) return;

    const originalText = selectedText || previewText || text;

    // Check message length
    if (originalText.length > 1000) {
      const newResult: QuickReplyResult = {
        id: `quick-reply-${Date.now()}`,
        text: "Message is too long. Maximum 1000 characters allowed.",
        action: selectedQuickReplyAction,
        timestamp: Date.now(),
      };
      setQuickReplyResults([...quickReplyResults, newResult]);
      setSelectedQuickReplyResultId(newResult.id);
      return;
    }

    // Cancel any ongoing quick reply request
    if (quickReplyAbortControllerRef.current && !quickReplyAbortControllerRef.current.signal.aborted) {
      quickReplyAbortControllerRef.current.abort("User cancelled");
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    quickReplyAbortControllerRef.current = abortController;

    // Show loading state
    setIsGeneratingQuickReply(true);

    try {
      const response = await fetch("/api/ai/help-write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          situation: originalText,
          language: quickRepliesLanguage,
          responseType: responseType,
        }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (data.success && data.generatedText) {
        const newResult: QuickReplyResult = {
          id: `quick-reply-${Date.now()}`,
          text: data.generatedText,
          action: selectedQuickReplyAction,
          timestamp: Date.now(),
        };

        setQuickReplyResults([...quickReplyResults, newResult]);
        setSelectedQuickReplyResultId(newResult.id);
      } else {
        const newResult: QuickReplyResult = {
          id: `quick-reply-${Date.now()}`,
          text: `Error: ${data.error || "Failed to generate message"}`,
          action: selectedQuickReplyAction,
          timestamp: Date.now(),
        };
        setQuickReplyResults([...quickReplyResults, newResult]);
        setSelectedQuickReplyResultId(newResult.id);
      }
    } catch (error: any) {
      // Ignore abort errors (request was canceled intentionally)
      if (error.name === 'AbortError' || error.message === 'User cancelled' || error === 'User cancelled') {
        return;
      }
      console.error("Regenerate quick reply error:", error);
      const newResult: QuickReplyResult = {
        id: `quick-reply-${Date.now()}`,
        text: "Error: Failed to connect to AI service",
        action: selectedQuickReplyAction,
        timestamp: Date.now(),
      };
      setQuickReplyResults([...quickReplyResults, newResult]);
      setSelectedQuickReplyResultId(newResult.id);
    } finally {
      // Only clear loading state if this request wasn't aborted
      if (quickReplyAbortControllerRef.current === abortController) {
        setIsGeneratingQuickReply(false);
        quickReplyAbortControllerRef.current = null;
      }
      setCopiedResultId(null);
    }
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

  const handleGrammarCheck = async () => {
    const originalText = selectedText || previewText || text;

    // Check message length
    if (originalText.length > 1000) {
      setMenuLevel("grammar-check-result");
      const newResult: GrammarCheckResult = {
        id: `grammar-check-result-${Date.now()}`,
        text: "Message is too long. Maximum 1000 characters allowed.",
        originalText: originalText,
        timestamp: Date.now(),
      };
      setGrammarCheckResults([newResult]);
      setSelectedGrammarCheckResultId(newResult.id);
      return;
    }

    // Cancel any ongoing grammar check request
    if (grammarCheckAbortControllerRef.current && !grammarCheckAbortControllerRef.current.signal.aborted) {
      grammarCheckAbortControllerRef.current.abort("User cancelled");
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    grammarCheckAbortControllerRef.current = abortController;

    // Show loading skeleton
    setIsCheckingGrammar(true);
    setMenuLevel("grammar-check-result");
    setGrammarCheckResults([]);

    try {
      const response = await fetch("/api/ai/rephrase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: originalText,
          tone: "grammar-check",
        }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (data.success && data.rephrased) {
        const newResult: GrammarCheckResult = {
          id: `grammar-check-result-${Date.now()}`,
          text: data.rephrased,
          originalText: originalText,
          timestamp: Date.now(),
        };

        setGrammarCheckResults([newResult]);
        setSelectedGrammarCheckResultId(newResult.id);
      } else {
        const newResult: GrammarCheckResult = {
          id: `grammar-check-result-${Date.now()}`,
          text: `Error: ${data.error || "Grammar check failed"}`,
          originalText: originalText,
          timestamp: Date.now(),
        };
        setGrammarCheckResults([newResult]);
        setSelectedGrammarCheckResultId(newResult.id);
      }
    } catch (error: any) {
      // Ignore abort errors (request was canceled intentionally)
      if (error.name === 'AbortError' || error.message === 'User cancelled' || error === 'User cancelled') {
        return;
      }
      console.error("Grammar check error:", error);
      const newResult: GrammarCheckResult = {
        id: `grammar-check-result-${Date.now()}`,
        text: "Error: Failed to connect to AI service",
        originalText: originalText,
        timestamp: Date.now(),
      };
      setGrammarCheckResults([newResult]);
      setSelectedGrammarCheckResultId(newResult.id);
    } finally {
      // Only clear loading state if this request wasn't aborted
      if (grammarCheckAbortControllerRef.current === abortController) {
        setIsCheckingGrammar(false);
        grammarCheckAbortControllerRef.current = null;
      }
    }
  };

  const handleRegenerateGrammarCheck = async () => {
    const originalText = selectedText || previewText || text;

    // Check message length
    if (originalText.length > 1000) {
      const newResult: GrammarCheckResult = {
        id: `grammar-check-result-${Date.now()}`,
        text: "Message is too long. Maximum 1000 characters allowed.",
        originalText: originalText,
        timestamp: Date.now(),
      };
      setGrammarCheckResults([...grammarCheckResults, newResult]);
      setSelectedGrammarCheckResultId(newResult.id);
      return;
    }

    // Show loading state
    setIsCheckingGrammar(true);

    try {
      const response = await fetch("/api/ai/rephrase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: originalText,
          tone: "grammar-check",
        }),
      });

      const data = await response.json();

      if (data.success && data.rephrased) {
        const newResult: GrammarCheckResult = {
          id: `grammar-check-result-${Date.now()}`,
          text: data.rephrased,
          originalText: originalText,
          timestamp: Date.now(),
        };

        setGrammarCheckResults([...grammarCheckResults, newResult]);
        setSelectedGrammarCheckResultId(newResult.id);
      } else {
        const newResult: GrammarCheckResult = {
          id: `grammar-check-result-${Date.now()}`,
          text: `Error: ${data.error || "Grammar check failed"}`,
          originalText: originalText,
          timestamp: Date.now(),
        };
        setGrammarCheckResults([...grammarCheckResults, newResult]);
        setSelectedGrammarCheckResultId(newResult.id);
      }
    } catch (error) {
      console.error("Regenerate grammar check error:", error);
      const newResult: GrammarCheckResult = {
        id: `grammar-check-result-${Date.now()}`,
        text: "Error: Failed to connect to AI service",
        originalText: originalText,
        timestamp: Date.now(),
      };
      setGrammarCheckResults([...grammarCheckResults, newResult]);
      setSelectedGrammarCheckResultId(newResult.id);
    } finally {
      setIsCheckingGrammar(false);
      setCopiedResultId(null);
    }
  };

  const handleApplyGrammarCheckResult = (resultId: string) => {
    const result = grammarCheckResults.find(r => r.id === resultId);
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
    setGrammarCheckResults([]);
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
        // Show tone selection buttons instead of directly generating
        setButtonGroupMode('rephrase');
        break;

      case "translate":
        if (!text.trim() && !previewText.trim()) {
          // Show empty preview state with prompt to paste text
          setMenuLevel("translate-empty-preview");
          return;
        }
        // Show language selection buttons instead of directly translating
        setButtonGroupMode('translate');
        break;

      case "grammar-check":
        if (!text.trim() && !previewText.trim()) {
          // Show empty preview state with prompt to paste text
          setMenuLevel("grammar-check-empty-preview");
          return;
        }
        handleGrammarCheck();
        break;

      case "quick-replies":
        if (!text.trim() && !previewText.trim()) {
          // Show empty preview state with prompt to paste text
          setMenuLevel("quick-replies-empty-preview");
          return;
        }
        // Show quick reply action buttons instead of directly triggering help-me-write
        setButtonGroupMode('quick-replies');
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
      // Handler for X button in main menu
      const handleMainMenuClose = () => {
        // If we're showing option buttons, go back to main button group
        if (buttonGroupMode !== 'main') {
          setButtonGroupMode('main');
        } else if (onSwitchKeyboard) {
          // Otherwise close the keyboard
          onSwitchKeyboard();
        }
      };

      return (
        <div className="px-1 py-2 flex items-center justify-between min-h-[44px] -mt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0b9786] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-base font-semibold text-foreground">Your message</div>
          </div>
          {(onSwitchKeyboard || buttonGroupMode !== 'main') && (
            <button
              type="button"
              onClick={handleMainMenuClose}
              className="p-1.5 rounded-md hover:bg-accent active:scale-95 transition-all duration-75 touch-manipulation"
              aria-label="Close and return to main menu"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
      );
    } else if (menuLevel === "rephrase-empty-preview") {
      return (
        <div className="px-1 py-3 flex items-center justify-between min-h-[44px] -mt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0b9786] flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <div className="text-base font-semibold text-foreground">Rephrase</div>
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
      return (
        <div className="px-1 py-3 flex items-center justify-between min-h-[44px] -mt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0b9786] flex items-center justify-center">
              <Languages className="w-4 h-4 text-white" />
            </div>
            <div className="text-base font-semibold text-foreground">Translate</div>
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
      return (
        <div className="px-1 py-3 flex items-center justify-between min-h-[44px] -mt-1">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-full bg-[#0b9786] flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="text-base font-semibold text-foreground">Describe the situation</div>
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
    } else if (menuLevel === "grammar-check-empty-preview") {
      return (
        <div className="px-1 py-3 flex items-center justify-between min-h-[44px] -mt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0b9786] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="text-base font-semibold text-foreground">Grammar check</div>
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
      return (
        <div className="px-1 py-3 flex items-center justify-between min-h-[44px] -mt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0b9786] flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <div className="text-base font-semibold text-foreground">How should it sound?</div>
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
      const tooltip = `For best results, briefly describe the situation and your intention.

E.g.
"email to embassy — ask visa requirements"
"project invitation — politely decline"
"delivery complaint — pizza cold"`;

      return (
        <div className="px-1 py-2 flex items-center justify-between min-h-[44px] -mt-1">
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
                  <p className="text-xs whitespace-pre-line">{tooltip}</p>
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
      return (
        <div className="px-1 py-3 flex items-center justify-between min-h-[44px] -mt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0b9786] flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-white" />
            </div>
            <div className="text-base font-semibold text-foreground">Saved text</div>
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
      return (
        <div className="px-1 py-3 flex items-center justify-between min-h-[44px] -mt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0b9786] flex items-center justify-center">
              <Languages className="w-4 h-4 text-white" />
            </div>
            {isTranslating ? (
              <div className="text-base font-semibold text-foreground">Translating…</div>
            ) : (
              <div className="text-base font-semibold text-foreground">Translated message</div>
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
      const tooltip = `For best results, briefly describe the situation and your intention.

E.g.
"email to embassy — ask visa requirements"
"project invitation — politely decline"
"delivery complaint — pizza cold"`;

      return (
        <div className="px-1 py-3 flex items-center justify-between min-h-[44px] -mt-1">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-full bg-[#0b9786] flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            {isGeneratingQuickReply ? (
              <div className="text-base font-semibold text-foreground">Generating your message…</div>
            ) : (
              <div className="text-base font-semibold text-foreground">Suggested message</div>
            )}
            {tooltip && !isGeneratingQuickReply && (
              <Tooltip
                delayDuration={0}
                open={openTooltipId === "quick-replies-result-info"}
                onOpenChange={(open) => setOpenTooltipId(open ? "quick-replies-result-info" : null)}
              >
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-75 touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTooltipId(openTooltipId === "quick-replies-result-info" ? null : "quick-replies-result-info");
                    }}
                    aria-label="Info about Suggested message"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px] z-50">
                  <p className="text-xs whitespace-pre-line">{tooltip}</p>
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
    } else if (menuLevel === "grammar-check-result") {
      return (
        <div className="px-1 py-3 flex items-center justify-between min-h-[44px] -mt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0b9786] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            {isCheckingGrammar ? (
              <div className="text-base font-semibold text-foreground">Checking grammar…</div>
            ) : (
              <div className="text-base font-semibold text-foreground">Grammar corrected</div>
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
    } else if (menuLevel === "result") {
      // Determine the title based on selected tone
      let resultTitle = "How should it sound?";
      if (selectedTone === "work-safe") {
        resultTitle = "Improved message";
      } else if (selectedTone === "informal") {
        resultTitle = "Improved message";
      } else if (selectedTone === "short-clear") {
        resultTitle = "Improved message";
      } else if (selectedTone === "make-longer") {
        resultTitle = "Improved message";
      }

      return (
        <div className="px-1 py-3 flex items-center justify-between min-h-[44px] -mt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0b9786] flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            {isRephrasing ? (
              <div className="text-base font-semibold text-foreground">Rephrasing…</div>
            ) : (
              <div className="text-base font-semibold text-foreground">{resultTitle}</div>
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
      <div className="px-1 py-2 flex items-center justify-between min-h-[44px] -mt-1">
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

    const handleCopyPreviewText = async () => {
      try {
        await navigator.clipboard.writeText(displayPreviewText);
      } catch {
        // Ignore copy errors silently
      }
    };

    return (
      <div className="px-1">
        {/* Preview field without border and background */}
        <div className="flex items-start justify-between gap-3 py-2 px-1 relative pl-[18px] pr-[18px] pt-[12px] pb-[12px]">
          {hasContent ? (
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap flex-1 mt-[5px] mb-[5px]">
              {displayPreviewText}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground/60 flex-1 mt-[4px] mb-[4px]">Paste a message or situation here</div>
          )}
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="p-2 rounded-md hover:bg-accent/50 active:scale-95 transition-all duration-75 touch-manipulation flex-shrink-0"
            data-testid="button-paste-preview"
            aria-label="Paste text"
          >
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  };

  // Render tone option buttons for Rephrase
  const renderToneButtons = () => {
    // First row: 2 tone buttons (Professional, Informal)
    // Second row: 4 length/style buttons (Shorter, Longer, More Polite, More Direct)
    const firstRow = TONE_OPTIONS.slice(0, 2);
    const secondRow = TONE_OPTIONS.slice(2, 6);

    return (
      <div className="overflow-x-auto scrollbar-hide p-3 pt-[15px] pb-[15px]">
        <div className="flex flex-col gap-2 min-w-min ml-[-10px] mr-[-10px]">
          {/* First row - 2 buttons */}
          <div className="flex gap-2">
            {firstRow.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleToneSelect(option.id)}
                className="flex flex-row items-center justify-center gap-2 h-11 px-4 py-2 rounded-full border-2 bg-card dark:bg-card border-border hover-elevate active-elevate-2 active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none flex-shrink-0"
                data-testid={`button-tone-${option.id}`}
                aria-label={option.label}
              >
                <span className="text-lg">{option.emoji}</span>
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          {/* Second row - 4 buttons */}
          <div className="flex gap-2">
            {secondRow.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleToneSelect(option.id)}
                className="flex flex-row items-center justify-center gap-2 h-11 px-4 py-2 rounded-full border-2 bg-card dark:bg-card border-border hover-elevate active-elevate-2 active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none flex-shrink-0"
                data-testid={`button-tone-${option.id}`}
                aria-label={option.label}
              >
                <span className="text-lg">{option.emoji}</span>
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render language option buttons for Translate
  const renderLanguageButtons = () => {
    // Split into 2 rows: first row 3 languages, second row 2 languages
    const firstRow = LANGUAGES.slice(0, 3);
    const secondRow = LANGUAGES.slice(3, 5);

    return (
      <div className="overflow-x-auto scrollbar-hide p-3 pt-[15px] pb-[15px]">
        <div className="flex flex-col gap-2 min-w-min ml-[-10px] mr-[-10px]">
          {/* First row - 3 buttons */}
          <div className="flex gap-2">
            {firstRow.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setTranslateLanguage(lang.code);
                  handleTranslate(lang.code);
                }}
                className="flex flex-row items-center justify-center gap-2 h-11 px-4 py-2 rounded-full border-2 bg-card dark:bg-card border-border hover-elevate active-elevate-2 active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none flex-shrink-0"
                data-testid={`button-lang-${lang.code}`}
                aria-label={lang.label}
              >
                <span className="text-lg">{lang.emoji}</span>
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {lang.label}
                </span>
              </button>
            ))}
          </div>

          {/* Second row - 2 buttons */}
          <div className="flex gap-2">
            {secondRow.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setTranslateLanguage(lang.code);
                  handleTranslate(lang.code);
                }}
                className="flex flex-row items-center justify-center gap-2 h-11 px-4 py-2 rounded-full border-2 bg-card dark:bg-card border-border hover-elevate active-elevate-2 active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none flex-shrink-0"
                data-testid={`button-lang-${lang.code}`}
                aria-label={lang.label}
              >
                <span className="text-lg">{lang.emoji}</span>
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {lang.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render response type buttons for Help me write (Chat message and Email)
  const renderQuickReplyButtons = () => {
    return (
      <div className="overflow-x-auto scrollbar-hide p-3 pt-[15px] pb-[15px]">
        <div className="flex flex-col gap-2 min-w-min ml-[-10px] mr-[-10px]">
          {/* First row - 2 buttons (Chat message and Email) */}
          <div className="flex gap-2">
            {RESPONSE_TYPES.map((type) => (
              <button
                key={type.code}
                type="button"
                onClick={() => {
                  setResponseType(type.code);
                  handleQuickReplyActionSelect("help-me-write");
                }}
                className="flex flex-row items-center justify-center gap-2 h-11 px-4 py-2 rounded-full border-2 bg-card dark:bg-card border-border hover-elevate active-elevate-2 active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none flex-shrink-0"
                data-testid={`button-response-type-${type.code}`}
                aria-label={type.label}
              >
                <span className="text-lg">{type.emoji}</span>
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {type.label}
                </span>
              </button>
            ))}
          </div>

          {/* Second row - empty to maintain consistent height with other button groups */}
          <div className="flex gap-2 h-11"></div>
        </div>
      </div>
    );
  };

  // Render main menu buttons (or option buttons based on buttonGroupMode)
  const renderMainMenu = () => {
    // Show option buttons if in special mode
    if (buttonGroupMode === 'rephrase') {
      return renderToneButtons();
    } else if (buttonGroupMode === 'translate') {
      return renderLanguageButtons();
    } else if (buttonGroupMode === 'quick-replies') {
      return renderQuickReplyButtons();
    }

    // Otherwise show main menu buttons
    // First row: rephrase, translate, saved-text
    const firstRowButtons = PROMPT_BUTTONS.filter(b =>
      ['rephrase', 'translate', 'saved-text'].includes(b.id)
    );
    // Second row: quick-replies, grammar-check
    const secondRowButtons = PROMPT_BUTTONS.filter(b =>
      ['quick-replies', 'grammar-check'].includes(b.id)
    );

    return (
      <div className="overflow-x-auto scrollbar-hide p-3 pt-[15px] pb-[15px]">
        <div className="flex flex-col gap-2 min-w-min ml-[-10px] mr-[-10px]">
          {/* First row - 3 buttons */}
          <div className="flex gap-2">
            {firstRowButtons.map((button) => (
              <button
                key={button.id}
                type="button"
                onClick={() => handlePromptClick(button.id)}
                className="flex flex-row items-center justify-center gap-2 h-11 px-4 py-2 rounded-full border-2 bg-card dark:bg-card border-border hover-elevate active-elevate-2 active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none flex-shrink-0"
                data-testid={`button-prompt-${button.id}`}
                aria-label={button.label}
              >
                {button.icon}
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {button.label}
                </span>
              </button>
            ))}
          </div>

          {/* Second row - 2 buttons */}
          <div className="flex gap-2">
            {secondRowButtons.map((button) => (
              <button
                key={button.id}
                type="button"
                onClick={() => handlePromptClick(button.id)}
                className="flex flex-row items-center justify-center gap-2 h-11 px-4 py-2 rounded-full border-2 bg-card dark:bg-card border-border hover-elevate active-elevate-2 active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none flex-shrink-0"
                data-testid={`button-prompt-${button.id}`}
                aria-label={button.label}
              >
                {button.icon}
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {button.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render empty preview prompt for rephrase
  const renderRephraseEmptyPreview = () => {
    const hasContent = displayPreviewText.trim();

    return (
      <div className="flex flex-col gap-4 p-1">
        {/* Preview field - main page style */}
        <div className="flex items-start justify-between gap-3 py-2 px-1 relative">
          {hasContent ? (
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap flex-1 mt-[5px] mb-[5px]">
              {displayPreviewText}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground/60 flex-1 mt-[4px] mb-[4px]">Paste your message here</div>
          )}
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="p-2 rounded-md hover:bg-accent/50 active:scale-95 transition-all duration-75 touch-manipulation flex-shrink-0"
            data-testid="button-paste-rephrase-empty"
            aria-label="Paste text"
          >
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        {/* Large prompt message */}
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4">
          <div className="text-center font-semibold text-[#22282a] text-[16px]">Paste the message you want to rephrase. We’ll help adjust the tone and wording.</div>
        </div>
      </div>
    );
  };

  // Render empty preview prompt for translate
  const renderTranslateEmptyPreview = () => {
    const hasContent = displayPreviewText.trim();

    return (
      <div className="flex flex-col gap-4 p-1">
        {/* Preview field - main page style */}
        <div className="flex items-start justify-between gap-3 py-2 px-1 relative">
          {hasContent ? (
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap flex-1 mt-[5px] mb-[5px]">
              {displayPreviewText}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground/60 flex-1 mt-[4px] mb-[4px]">Paste the message to translate</div>
          )}
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="p-2 rounded-md hover:bg-accent/50 active:scale-95 transition-all duration-75 touch-manipulation flex-shrink-0"
            data-testid="button-paste-translate-empty"
            aria-label="Paste text"
          >
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        {/* Large prompt message */}
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4">
          <div className="text-center font-semibold text-[#22282a] text-[16px]">
            Paste any message you want to translate. The meaning and tone will stay the same.
          </div>
        </div>
      </div>
    );
  };

  // Render empty preview prompt for quick replies
  const renderQuickRepliesEmptyPreview = () => {
    const hasContent = displayPreviewText.trim();

    return (
      <div className="flex flex-col gap-4 p-1">
        {/* Preview field - main page style */}
        <div className="flex items-start justify-between gap-3 py-2 px-1 relative">
          {hasContent ? (
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap flex-1 mt-[5px] mb-[5px]">
              {displayPreviewText}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground/60 flex-1 mt-[4px] mb-[4px]">{animatedPlaceholder}</div>
          )}
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="p-2 rounded-md hover:bg-accent/50 active:scale-95 transition-all duration-75 touch-manipulation flex-shrink-0"
            data-testid="button-paste-quick-replies-empty"
            aria-label="Paste text"
          >
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        {/* Large prompt message */}
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4">
          <div className="text-center font-semibold text-[#22282a] text-[16px]">Write a few words about the context and what you want to say. No need to write the full message.</div>
        </div>
      </div>
    );
  };

  // Render empty preview prompt for grammar check
  const renderGrammarCheckEmptyPreview = () => {
    const hasContent = displayPreviewText.trim();

    return (
      <div className="flex flex-col gap-4 p-1">
        {/* Preview field - main page style */}
        <div className="flex items-start justify-between gap-3 py-2 px-1 relative">
          {hasContent ? (
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap flex-1 mt-[5px] mb-[5px]">
              {displayPreviewText}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground/60 flex-1 mt-[4px] mb-[4px]">Paste your message here</div>
          )}
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="p-2 rounded-md hover:bg-accent/50 active:scale-95 transition-all duration-75 touch-manipulation flex-shrink-0"
            data-testid="button-paste-grammar-check-empty"
            aria-label="Paste text"
          >
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Large prompt message */}
        <div className="flex flex-col items-center justify-center gap-3 py-6 px-4">
          <div className="text-center text-[18px] font-semibold text-[#22282a]">Paste your message to fix grammar, spelling, and punctuation. The wording and tone will stay the same.</div>
        </div>
      </div>
    );
  };

  // Render tone selection menu
  const renderToneSelect = () => {
    const hasContent = displayPreviewText.trim();

    return (
      <div className="flex flex-col gap-3 p-1">
        {/* Preview field - same style as main page */}
        <div className="flex items-start justify-between gap-3 py-2 px-1 relative">
          {hasContent ? (
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap flex-1 mt-[5px] mb-[5px]">
              {displayPreviewText}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground/60 flex-1 mt-[4px] mb-[4px]">Paste your message here</div>
          )}
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="p-2 rounded-md hover:bg-accent/50 active:scale-95 transition-all duration-75 touch-manipulation flex-shrink-0"
            data-testid="button-paste-rephrase"
            aria-label="Paste text"
          >
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tone options in a 2-column grid - similar to Help me write */}
        <div className="grid grid-cols-2 gap-3">
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone.id}
              type="button"
              onClick={() => handleToneSelect(tone.id)}
              className={`
                flex items-center justify-center gap-2
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
          ))}
        </div>
      </div>
    );
  };

  // Render result view with carousel
  const renderResult = () => {
    // Show skeleton while rephrasing
    if (isRephrasing) {
      return (
        <div ref={resultsContainerRef} className="p-3 space-y-0">
          <div className="py-4 px-3">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <Carousel
          setApi={setRephraseCarouselApi}
          className="w-full"
        >
          <CarouselContent>
            {rephraseResults.map((result, index) => {
              const isResultCopied = copiedResultId === result.id;
              return (
                <CarouselItem key={result.id}>
                  <div className="p-3">
                    {/* Rephrase text with copy button */}
                    <div className="relative py-4 px-3">
                      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pr-8">
                        {result.text}
                      </div>
                      {/* Copy button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyResult(result.id);
                        }}
                        className={`
                          absolute top-3 right-2
                          flex items-center justify-center h-7 w-7 rounded-md
                          ${isResultCopied
                            ? "bg-green-100 dark:bg-green-950/50"
                            : "bg-background/80 hover:bg-accent/50"}
                          active:scale-[0.95] transition-all duration-75 touch-manipulation
                        `}
                        data-testid={`button-copy-${result.id}`}
                        aria-label="Copy"
                        title="Copy"
                      >
                        {isResultCopied ? (
                          <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        {/* Carousel indicators */}
        {rephraseResults.length > 1 && (
          <div className="flex justify-center gap-1.5 py-3">
            {rephraseResults.map((_, index) => (
              <button
                key={index}
                onClick={() => rephraseCarouselApi?.scrollTo(index)}
                className={`
                  h-2 rounded-full transition-all duration-200
                  ${index === currentRephraseIndex
                    ? "w-6 bg-[#0b9786]"
                    : "w-2 bg-muted-foreground/30"}
                `}
                aria-label={`Go to variant ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render result footer with control panel
  const renderResultFooter = () => {
    const selectedResult = rephraseResults.find(r => r.id === selectedResultId);
    const selectedToneOption = TONE_OPTIONS.find(t => t.id === selectedTone);
    const selectedToneLabel = selectedToneOption?.label || selectedTone;
    const selectedToneEmoji = selectedToneOption?.emoji || "📝";

    return (
      <div className="flex-shrink-0 border-t border-border bg-white p-3">
        <div className="flex items-center gap-2 mt-1">
          {/* Tone selector (compact) */}
          <Select value={selectedTone} onValueChange={setSelectedTone}>
            <SelectTrigger
              className="w-auto h-11 rounded-full border-2 border-border text-sm px-4 gap-2"
              data-testid="select-rephrase-tone"
            >
              <span className="text-lg flex-shrink-0">{selectedToneEmoji}</span>
              <SelectValue placeholder="Tone">
                {selectedToneLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TONE_OPTIONS.map((tone, index) => (
                <>
                  <SelectItem key={tone.id} value={tone.id} data-testid={`option-rephrase-tone-${tone.id}`}>
                    {tone.emoji} {tone.label}
                  </SelectItem>
                  {(index === 1 || index === 3) && (
                    <Separator key={`separator-${index}`} className="my-1" />
                  )}
                </>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1"></div>

          {/* Apply button */}
          <button
            type="button"
            onClick={() => selectedResult && handleApplyResult(selectedResult.id)}
            disabled={!selectedResult}
            className={`
              flex items-center justify-center gap-1.5 h-11 w-11 rounded-full
              bg-[#0b9786] text-white font-medium
              ${!selectedResult ? "opacity-40 cursor-not-allowed" : "hover:bg-[#0a8a7a] active:scale-[0.95]"}
              transition-all duration-75 touch-manipulation flex-shrink-0
            `}
            data-testid="button-apply"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  // Render translate result view with carousel
  const renderTranslateResult = () => {
    // Show skeleton while translating
    if (isTranslating) {
      return (
        <div ref={resultsContainerRef} className="p-3 space-y-0">
          <div className="py-4 px-3">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <Carousel
          setApi={setTranslateCarouselApi}
          className="w-full"
        >
          <CarouselContent>
            {translateResults.map((result, index) => {
              const isResultCopied = copiedResultId === result.id;
              return (
                <CarouselItem key={result.id}>
                  <div className="p-3">
                    {/* Translation text with copy button */}
                    <div className="relative py-4 px-3">
                      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pr-8">
                        {result.text}
                      </div>
                      {/* Copy button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyResult(result.id);
                        }}
                        className={`
                          absolute top-3 right-2
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
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        {/* Dot indicators */}
        {translateResults.length > 1 && (
          <div className="flex justify-center gap-2 py-3">
            {translateResults.map((result, index) => (
              <button
                key={result.id}
                onClick={() => translateCarouselApi?.scrollTo(index)}
                className={`
                  h-2 rounded-full transition-all duration-200
                  ${index === currentTranslateIndex
                    ? "w-6 bg-[#0b9786]"
                    : "w-2 bg-border hover:bg-border/80"}
                `}
                aria-label={`Go to variant ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render translate result footer with control panel
  const renderTranslateResultFooter = () => {
    const selectedResult = translateResults.find(r => r.id === selectedTranslateResultId);
    const selectedLangLabel = LANGUAGES.find(l => l.code === translateLanguage)?.label || translateLanguage;

    return (
      <div className="flex-shrink-0 border-t border-border bg-white p-3">
        <div className="flex items-center gap-2 mt-1">
          {/* Language selector - compact */}
          <Select value={translateLanguage} onValueChange={setTranslateLanguage}>
            <SelectTrigger
              className="w-auto h-11 rounded-full border-2 border-border text-sm px-4 gap-2"
              data-testid="select-translate-language"
            >
              <Languages className="h-5 w-5 text-purple-500 flex-shrink-0" />
              <SelectValue placeholder="Язык">
                {selectedLangLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} data-testid={`option-translate-lang-${lang.code}`}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1"></div>

          {/* Apply button */}
          <button
            type="button"
            onClick={() => selectedResult && handleApplyTranslateResult(selectedResult.id)}
            disabled={!selectedResult}
            className={`
              flex items-center justify-center gap-1.5 h-11 w-11 rounded-full
              bg-[#0b9786] text-white font-medium
              ${!selectedResult ? "opacity-40 cursor-not-allowed" : "hover:bg-[#0a8a7a] active:scale-[0.95]"}
              transition-all duration-75 touch-manipulation flex-shrink-0
            `}
            data-testid="button-apply-translate"
          >
            <Check className="h-5 w-5" />
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
    // Show skeleton while generating
    if (isGeneratingQuickReply) {
      return (
        <div ref={resultsContainerRef} className="p-3 space-y-0">
          <div className="py-4 px-3">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <Carousel
          setApi={setQuickReplyCarouselApi}
          className="w-full"
        >
          <CarouselContent>
            {quickReplyResults.map((result, index) => {
              const isResultCopied = copiedResultId === result.id;
              return (
                <CarouselItem key={result.id}>
                  <div className="p-3">
                    {/* Quick reply text with copy button */}
                    <div className="relative py-4 px-3">
                      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pr-8">
                        {result.text}
                      </div>
                      {/* Copy button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyResult(result.id);
                        }}
                        className={`
                          absolute top-3 right-2
                          flex items-center justify-center h-7 w-7 rounded-md
                          ${isResultCopied
                            ? "bg-green-100 dark:bg-green-950/50"
                            : "bg-background/80 hover:bg-accent/50"}
                          active:scale-[0.95] transition-all duration-75 touch-manipulation
                        `}
                        data-testid={`button-copy-quick-reply-${result.id}`}
                        aria-label="Copy"
                        title="Copy"
                      >
                        {isResultCopied ? (
                          <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        {/* Carousel indicators */}
        {quickReplyResults.length > 1 && (
          <div className="flex justify-center gap-1.5 py-3">
            {quickReplyResults.map((_, index) => (
              <button
                key={index}
                onClick={() => quickReplyCarouselApi?.scrollTo(index)}
                className={`
                  h-2 rounded-full transition-all duration-200
                  ${index === currentQuickReplyIndex
                    ? "w-6 bg-[#0b9786]"
                    : "w-2 bg-muted-foreground/30"}
                `}
                aria-label={`Go to variant ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render quick replies result footer with control panel
  const renderQuickRepliesResultFooter = () => {
    const selectedResult = quickReplyResults.find(r => r.id === selectedQuickReplyResultId);
    const selectedResponseType = RESPONSE_TYPES.find(t => t.code === responseType);
    const selectedResponseTypeLabel = selectedResponseType?.label || responseType;
    const selectedResponseTypeEmoji = selectedResponseType?.emoji || "💬";

    return (
      <div className="flex-shrink-0 border-t border-border bg-white p-3">
        <div className="flex items-center gap-2 mt-1">
          {/* Response type selector (compact) */}
          <Select value={responseType} onValueChange={setResponseType}>
            <SelectTrigger
              className="w-auto h-11 rounded-full border-2 border-border text-sm px-4 gap-2"
              data-testid="select-response-type"
            >
              <span className="text-lg flex-shrink-0">{selectedResponseTypeEmoji}</span>
              <SelectValue placeholder="Response type">
                {selectedResponseTypeLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {RESPONSE_TYPES.map((type) => (
                <SelectItem key={type.code} value={type.code} data-testid={`option-response-type-${type.code}`}>
                  {type.emoji} {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1"></div>

          {/* Apply button */}
          <button
            type="button"
            onClick={() => selectedResult && handleApplyQuickReplyResult(selectedResult.id)}
            disabled={!selectedResult}
            className={`
              flex items-center justify-center gap-1.5 h-11 w-11 rounded-full
              bg-[#0b9786] text-white font-medium
              ${!selectedResult ? "opacity-40 cursor-not-allowed" : "hover:bg-[#0a8a7a] active:scale-[0.95]"}
              transition-all duration-75 touch-manipulation flex-shrink-0
            `}
            data-testid="button-apply-quick-reply"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  // Render grammar check result view with scrollable results
  const renderGrammarCheckResult = () => {
    // Show skeleton while checking grammar
    if (isCheckingGrammar) {
      return (
        <div ref={resultsContainerRef} className="p-3 space-y-0 overflow-y-auto">
          <div className="py-4 px-3">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      );
    }

    return (
      <div ref={resultsContainerRef} className="p-3 space-y-0 overflow-y-auto">
        {grammarCheckResults.map((result, index) => {
          const isSelected = selectedGrammarCheckResultId === result.id;
          const isResultCopied = copiedResultId === result.id;
          return (
            <div key={result.id}>
              <div
                onClick={() => setSelectedGrammarCheckResultId(result.id)}
                className={`
                  relative py-4 px-3 cursor-pointer
                  ${isSelected ? "opacity-100" : "opacity-50"}
                  active:scale-[0.99] transition-all duration-75 touch-manipulation
                `}
              >
                <DiffText
                  originalText={result.originalText}
                  modifiedText={result.text}
                  className="pr-8"
                />
                {/* Copy button - only show when selected */}
                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyResult(result.id);
                    }}
                    className={`
                      absolute top-3 right-2
                      flex items-center justify-center h-7 w-7 rounded-md
                      ${isResultCopied
                        ? "bg-green-100 dark:bg-green-950/50"
                        : "bg-background/80 hover:bg-accent/50"}
                      active:scale-[0.95] transition-all duration-75 touch-manipulation
                    `}
                    data-testid={`button-copy-grammar-check-${result.id}`}
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
              {/* Divider between variants */}
              {index < grammarCheckResults.length - 1 && (
                <div className="border-b border-border" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render grammar check result footer with control panel
  const renderGrammarCheckResultFooter = () => {
    const selectedResult = grammarCheckResults.find(r => r.id === selectedGrammarCheckResultId);

    return (
      <div className="flex-shrink-0 border-t border-border bg-white p-3">
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1"></div>

          {/* Apply button */}
          <button
            type="button"
            onClick={() => selectedResult && handleApplyGrammarCheckResult(selectedResult.id)}
            disabled={!selectedResult}
            className={`
              flex items-center justify-center gap-1.5 h-11 w-11 rounded-full
              bg-[#0b9786] text-white font-medium
              ${!selectedResult ? "opacity-40 cursor-not-allowed" : "hover:bg-[#0a8a7a] active:scale-[0.95]"}
              transition-all duration-75 touch-manipulation flex-shrink-0
            `}
            data-testid="button-apply-grammar-check"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  // Render saved text view
  const renderSavedText = () => (
    <div className="flex flex-col gap-3 p-1 flex-1 min-h-0 pt-[8px] pb-[8px]">
      {/* Save from clipboard button */}
      <div className="flex-shrink-0 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSaveFromClipboard}
          className="flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg border bg-transparent text-primary border-primary hover:bg-accent/50 active:scale-[0.98] transition-transform duration-75 touch-manipulation select-none mt-[0px] mb-[0px]"
          data-testid="button-save-from-clipboard"
        >
          <Clipboard className="h-4 w-4" />
          <span className="text-sm font-medium">Add from Clipboard</span>
        </button>
      </div>

      {/* Saved text items list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
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
    <div className="flex flex-col w-full max-h-[75vh]">
      {/* Fixed header with border */}
      <div className="flex-shrink-0 border-b border-border">
        {renderHeader()}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {renderPreviewField()}
        {menuLevel === "main" && (
          <div className="pb-3">
            {/* Preview field area - will scroll if needed */}
          </div>
        )}
        {menuLevel !== "main" && (
          <>
            {menuLevel === "rephrase-empty-preview" && renderRephraseEmptyPreview()}
            {menuLevel === "translate-empty-preview" && renderTranslateEmptyPreview()}
            {menuLevel === "quick-replies-empty-preview" && renderQuickRepliesEmptyPreview()}
            {menuLevel === "grammar-check-empty-preview" && renderGrammarCheckEmptyPreview()}
            {menuLevel === "tone-select" && renderToneSelect()}
            {menuLevel === "result" && renderResult()}
            {menuLevel === "translate-result" && renderTranslateResult()}
            {menuLevel === "quick-replies-select" && renderQuickRepliesSelect()}
            {menuLevel === "quick-replies-result" && renderQuickRepliesResult()}
            {menuLevel === "grammar-check-result" && renderGrammarCheckResult()}
            {menuLevel === "saved-text" && renderSavedText()}
          </>
        )}
      </div>

      {/* Fixed footer with border - for main menu buttons or result controls */}
      {menuLevel === "main" && (
        <div className="flex-shrink-0 border-t border-border bg-white">
          {renderMainMenu()}
        </div>
      )}
      {menuLevel === "result" && renderResultFooter()}
      {menuLevel === "translate-result" && renderTranslateResultFooter()}
      {menuLevel === "quick-replies-result" && renderQuickRepliesResultFooter()}
      {menuLevel === "grammar-check-result" && renderGrammarCheckResultFooter()}
    </div>
  );
}
