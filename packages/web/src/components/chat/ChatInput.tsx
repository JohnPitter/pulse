import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { Mic, MicOff, Paperclip, Send, X } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string, imageBase64?: string) => void;
  disabled?: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [listening, setListening] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const send = useCallback(() => {
    const content = text.trim();
    if (!content && !imageBase64) return;
    onSend(content || "(image)", imageBase64);
    setText("");
    setImageBase64(undefined);
    setImagePreview(undefined);
  }, [text, imageBase64, onSend]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      send();
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImageBase64(result.split(",")[1]);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognitionClass =
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition
      ?? (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "pt-PT";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setText(transcript);
    };
    recognition.onerror = () => { setListening(false); };
    recognition.onend = () => { setListening(false); };
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  return (
    <div className="border-t border-border bg-surface px-3 py-3 shrink-0">
      {imagePreview && (
        <div className="relative inline-block mb-2">
          <img src={imagePreview} alt="attachment" className="h-14 w-14 rounded-lg object-cover border border-border" />
          <button
            onClick={() => { setImageBase64(undefined); setImagePreview(undefined); }}
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-text-primary flex items-center justify-center"
            type="button"
          >
            <X className="h-2.5 w-2.5 text-white" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-1.5">
        <button
          onClick={toggleVoice}
          type="button"
          title={listening ? "Stop recording" : "Voice input"}
          className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
            listening ? "bg-danger-light text-danger" : "text-text-disabled hover:text-text-primary hover:bg-surface-muted"
          }`}
        >
          {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          type="button"
          title="Attach image"
          className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-text-disabled hover:text-text-primary hover:bg-surface-muted transition-colors"
        >
          <Paperclip className="h-3.5 w-3.5" />
        </button>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Message… (Ctrl+Enter)"
          disabled={disabled}
          className="flex-1 resize-none rounded-lg border border-border bg-surface-muted px-3 py-2 text-[13px] text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-all max-h-32 overflow-auto"
          style={{ minHeight: "34px" }}
        />

        <button
          onClick={send}
          disabled={disabled || (!text.trim() && !imageBase64)}
          type="button"
          className="shrink-0 h-8 w-8 rounded-lg bg-orange hover:bg-orange-hover disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          <Send className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}
