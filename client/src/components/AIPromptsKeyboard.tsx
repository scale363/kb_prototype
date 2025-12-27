import { RefreshCw, Languages, FileText, Clipboard, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  // Определяем текст для предпросмотра: приоритет за полем ввода кроме одного случая:
  // мы кликаем в поле пустое поле ввода, при этом поле предпросмотра заполнено (previewText)
  const displayPreviewText = (previewText && !text) ? previewText : (selectedText || text);
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

  const handlePromptClick = async (promptId: string) => {
    switch (promptId) {
      case "rephrase":
        if (!text.trim()) {
          toast({
            title: "No text to rephrase",
            description: "Please enter some text first",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Rephrase",
          description: "AI rephrasing will be available soon",
        });
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

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Поле предпросмотра */}
      <div className="px-1">
        <div className="flex flex-col gap-2 p-3 bg-accent/30 border-2 border-accent rounded-lg relative">
          {displayPreviewText.trim() ? (
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
          {/* Минималистичная кнопка вставки */}
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-accent/50 active:scale-95 transition-all duration-75 touch-manipulation"
            data-testid="button-paste-empty"
            aria-label="Paste from clipboard"
          >
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

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
    </div>
  );
}
