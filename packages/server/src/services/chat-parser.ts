type MessageCallback = (content: string) => void;
type WaitingCallback = (content: string) => void;

const QUESTION_PATTERNS: RegExp[] = [
  /\?\s*$/m,
  /(y\/n)/i,
  /(yes\/no)/i,
  /would you like/i,
  /should I/i,
  /do you want/i,
];

export class ChatParser {
  private buffer: string;
  private messageCallbacks: MessageCallback[];
  private waitingCallbacks: WaitingCallback[];

  constructor() {
    this.buffer = "";
    this.messageCallbacks = [];
    this.waitingCallbacks = [];
  }

  onMessage(cb: MessageCallback): void {
    this.messageCallbacks.push(cb);
  }

  onWaiting(cb: WaitingCallback): void {
    this.waitingCallbacks.push(cb);
  }

  feed(chunk: string): void {
    this.buffer += chunk;
  }

  flush(): void {
    const content = this.buffer.trim();
    this.buffer = "";

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
}
