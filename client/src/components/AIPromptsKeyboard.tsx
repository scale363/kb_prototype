import { RefreshCw, Languages, FileText, Clipboard, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIPromptsKeyboardProps {
  text: string;
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

export function AIPromptsKeyboard({ text, onTextChange, onSwitchKeyboard }: AIPromptsKeyboardProps) {
  const { toast } = useToast();

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
