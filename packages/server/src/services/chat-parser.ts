export type MessageCallback = (content: string) => void;
export type WaitingCallback = (content: string) => void;

const QUESTION_PATTERNS: RegExp[] = [
  /\?\s*$/m,
  /(y\/n)/i,
  /(yes\/no)/i,
  /would you like/i,
  /should I/i,
  /do you want/i,
];

const FLUSH_DEBOUNCE_MS = 500;

// Matches ANSI escape sequences (colors, cursor moves, etc.)
// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\].*?\x07|\x1b\[[\d;]*m/g;

/**
 * Strips ANSI escape codes from a string.
 */
export function stripAnsi(input: string): string {
  return input.replace(ANSI_REGEX, "");
}

export class ChatParser {
  private buffer: string;
  private messageCallbacks: MessageCallback[];
  private waitingCallbacks: WaitingCallback[];
  private flushTimer: ReturnType<typeof setTimeout> | null;

  constructor() {
    this.buffer = "";
    this.messageCallbacks = [];
    this.waitingCallbacks = [];
    this.flushTimer = null;
  }

  onMessage(cb: MessageCallback): void {
    this.messageCallbacks.push(cb);
  }

  onWaiting(cb: WaitingCallback): void {
    this.waitingCallbacks.push(cb);
  }

  /**
   * Appends a chunk to the buffer and schedules a debounced flush.
   * The timer resets on each new chunk so output is batched.
   */
  feed(chunk: string): void {
    this.buffer += chunk;

    // Reset debounce timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, FLUSH_DEBOUNCE_MS);
  }

  flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const raw = this.buffer.trim();
    this.buffer = "";

    if (!raw) {
      return;
    }

    // Strip ANSI codes before emitting to chat consumers
    const content = stripAnsi(raw);
    if (!content) {
      return;
    }

    const isQuestion = QUESTION_PATTERNS.some((pattern) => pattern.test(content));

    for (const cb of this.messageCallbacks) {
      cb(content);
    }

    if (isQuestion) {
      for (const cb of this.waitingCallbacks) {
        cb(content);
      }
    }
  }

  getBuffer(): string {
    return this.buffer;
  }

  /**
   * Clears internal timers. Call when discarding the parser.
   */
  destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.buffer = "";
    this.messageCallbacks = [];
    this.waitingCallbacks = [];
  }
}
