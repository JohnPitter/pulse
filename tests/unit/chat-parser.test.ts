import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatParser } from "../../packages/server/src/services/chat-parser.js";

describe("ChatParser", () => {
  let parser: ChatParser;

  beforeEach(() => {
    parser = new ChatParser();
  });

  describe("feed()", () => {
    it("accumulates multiple chunks into buffer", () => {
      parser.feed("Hello ");
      parser.feed("world");
      expect(parser.getBuffer()).toBe("Hello world");
    });
  });

  describe("flush()", () => {
    it("emits accumulated content to message callbacks", () => {
      const callback = vi.fn();
      parser.onMessage(callback);

      parser.feed("Hello world");
      parser.flush();

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith("Hello world");
    });

    it("resets buffer after emitting", () => {
      const callback = vi.fn();
      parser.onMessage(callback);

      parser.feed("Hello world");
      parser.flush();

      expect(parser.getBuffer()).toBe("");
    });

    it("does not emit on empty buffer", () => {
      const callback = vi.fn();
      parser.onMessage(callback);

      parser.flush();

      expect(callback).not.toHaveBeenCalled();
    });

    it("does not emit on whitespace-only buffer", () => {
      const callback = vi.fn();
      parser.onMessage(callback);

      parser.feed("   \n  \t  ");
      parser.flush();

      expect(callback).not.toHaveBeenCalled();
    });

    it("trims buffer content before emitting", () => {
      const callback = vi.fn();
      parser.onMessage(callback);

      parser.feed("  Hello world  \n");
      parser.flush();

      expect(callback).toHaveBeenCalledWith("Hello world");
    });

    it("supports multiple message callbacks", () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      parser.onMessage(cb1);
      parser.onMessage(cb2);

      parser.feed("Hello");
      parser.flush();

      expect(cb1).toHaveBeenCalledWith("Hello");
      expect(cb2).toHaveBeenCalledWith("Hello");
    });
  });

  describe("waiting detection", () => {
    it("detects question ending with ?", () => {
      const messageCb = vi.fn();
      const waitingCb = vi.fn();
      parser.onMessage(messageCb);
      parser.onWaiting(waitingCb);

      parser.feed("What file should I edit?");
      parser.flush();

      expect(messageCb).toHaveBeenCalledOnce();
      expect(waitingCb).toHaveBeenCalledWith("What file should I edit?");
    });

    it("detects question ending with ? followed by whitespace", () => {
      const waitingCb = vi.fn();
      parser.onWaiting(waitingCb);
      parser.onMessage(vi.fn());

      parser.feed("What file should I edit?  \n");
      parser.flush();

      expect(waitingCb).toHaveBeenCalledOnce();
    });

    it("detects (y/n) pattern", () => {
      const waitingCb = vi.fn();
      parser.onWaiting(waitingCb);
      parser.onMessage(vi.fn());

      parser.feed("Do you want to continue (y/n)");
      parser.flush();

      expect(waitingCb).toHaveBeenCalledWith("Do you want to continue (y/n)");
    });

    it("detects (yes/no) pattern", () => {
      const waitingCb = vi.fn();
      parser.onWaiting(waitingCb);
      parser.onMessage(vi.fn());

      parser.feed("Proceed with changes (yes/no)");
      parser.flush();

      expect(waitingCb).toHaveBeenCalledOnce();
    });

    it("detects 'would you like' pattern", () => {
      const waitingCb = vi.fn();
      parser.onWaiting(waitingCb);
      parser.onMessage(vi.fn());

      parser.feed("Would you like me to fix that");
      parser.flush();

      expect(waitingCb).toHaveBeenCalledOnce();
    });

    it("detects 'should I' pattern", () => {
      const waitingCb = vi.fn();
      parser.onWaiting(waitingCb);
      parser.onMessage(vi.fn());

      parser.feed("Should I create the file");
      parser.flush();

      expect(waitingCb).toHaveBeenCalledOnce();
    });

    it("detects 'do you want' pattern", () => {
      const waitingCb = vi.fn();
      parser.onWaiting(waitingCb);
      parser.onMessage(vi.fn());

      parser.feed("Do you want me to proceed");
      parser.flush();

      expect(waitingCb).toHaveBeenCalledOnce();
    });

    it("does not trigger waiting for normal messages", () => {
      const waitingCb = vi.fn();
      parser.onWaiting(waitingCb);
      parser.onMessage(vi.fn());

      parser.feed("I have completed the task successfully.");
      parser.flush();

      expect(waitingCb).not.toHaveBeenCalled();
    });

    it("supports multiple waiting callbacks", () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      parser.onWaiting(cb1);
      parser.onWaiting(cb2);
      parser.onMessage(vi.fn());

      parser.feed("Should I continue?");
      parser.flush();

      expect(cb1).toHaveBeenCalledOnce();
      expect(cb2).toHaveBeenCalledOnce();
    });
  });

  describe("getBuffer()", () => {
    it("returns empty string initially", () => {
      expect(parser.getBuffer()).toBe("");
    });

    it("returns current buffer content", () => {
      parser.feed("partial");
      expect(parser.getBuffer()).toBe("partial");
    });
  });
});
