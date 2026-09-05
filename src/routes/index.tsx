import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowUp,
  Bot,
  Check,
  Copy,
  LayoutTemplate,
  Menu,
  MessageSquare,
  Plus,
  Settings2,
  UserRound,
  X,
} from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Section = "chat" | "build" | "profile";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const Route = createFileRoute("/")({
  head: () => ({
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
    ],
    meta: [
      { title: "Kova AI — Free AI chat and website builder" },
      { name: "description", content: "A simple free AI chat for everyday questions and a focused workspace for building websites." },
      { property: "og:title", content: "Kova AI — Free AI chat and website builder" },
      { property: "og:description", content: "Chat with Kova AI or switch to Build when you want to turn an idea into a website." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0f172a" },
    ],
  }),
  component: KovaWorkspace,
});

function KovaWorkspace() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [section, setSection] = useState<Section>("chat");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    inputRef.current?.focus();
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
  }, []);

  function selectSection(nextSection: Section) {
    setSection(nextSection);
    setError("");
    setMobileMenu(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function startNewChat() {
    setMessages([]);
    setError("");
    selectSection("chat");
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || isStreaming) return;
    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setError("");
    setIsStreaming(true);
    inputRef.current?.focus();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, mode: section === "build" ? "build" : "chat" }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || "Kova could not answer right now.");
      }
      if (!response.body) throw new Error("The AI response was unavailable.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages([...nextMessages, { role: "assistant", content: assistantText }]);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Something went wrong.";
      setError(message);
      setMessages(nextMessages);
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  const isProfile = section === "profile";
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className={`${mobileMenu ? "flex" : "hidden"} fixed inset-y-0 left-0 z-50 w-72 flex-col border-r border-sidebar-border bg-sidebar p-4 shadow-2xl md:relative md:flex md:w-[230px] md:shadow-none`}>
          <div className="flex items-center justify-between px-2">
            <button className="flex items-center gap-2.5 text-left" onClick={() => selectSection("chat")} aria-label="Open Kova chat">
              <img src="/favicon.ico" alt="Kova" className="size-8 rounded-lg" />
              <span><span className="block font-semibold tracking-tight">Kova</span><span className="block font-mono text-[10px] text-muted-foreground">FREE AI</span></span>
            </button>
            <button className="text-muted-foreground md:hidden" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={18} /></button>
          </div>
          <button className="mt-8 flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110" onClick={startNewChat}><Plus size={17} /> New chat</button>
          <nav className="mt-8 space-y-1" aria-label="Main menu">
            <NavItem active={section === "chat"} icon={<MessageSquare size={16} />} label="Chat" onClick={() => selectSection("chat")} />
            <NavItem active={section === "build"} icon={<LayoutTemplate size={16} />} label="Build a website" onClick={() => selectSection("build")} />
          </nav>
          <div className="mt-auto border-t border-sidebar-border pt-4">
            <NavItem active={section === "profile"} icon={<UserRound size={16} />} label="Profile" onClick={() => selectSection("profile")} />
            <div className="mt-3 flex items-center gap-2 rounded-md bg-sidebar-accent p-2.5"><div className="grid size-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">ZK</div><div className="min-w-0"><div className="truncate text-xs font-semibold">Zaid Khan</div><div className="text-[10px] text-muted-foreground">Free plan</div></div></div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[62px] shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur md:px-7">
            <div className="flex items-center gap-3"><button className="text-muted-foreground md:hidden" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={19} /></button><div><div className="flex items-center gap-2 text-sm font-semibold">{section === "chat" ? "Chat" : section === "build" ? "Build a website" : "Profile"}</div><div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground"><span className="live-pulse size-1.5 rounded-full bg-success" /> Ready</div></div></div>
            <div className="flex items-center gap-2"><span className="hidden rounded-md border border-border px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground sm:inline">FREE</span><button className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-accent" aria-label="Settings"><Settings2 size={16} /></button></div>
          </header>

          {isProfile ? <ProfilePanel installPrompt={installPrompt} onInstall={installApp} /> : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-7 md:px-10 md:py-10">
                <div className="mx-auto max-w-2xl space-y-7">
                  {messages.length === 0 && <EmptyState section={section} onPick={sendMessage} />}
                  {messages.map((message, index) => <Message key={`${index}-${message.role}`} message={message} />)}
                  {isStreaming && messages.at(-1)?.content === "" && <div className="flex items-center gap-2 pl-1 text-xs text-muted-foreground"><span className="live-pulse size-1.5 rounded-full bg-primary" /> Kova is thinking…</div>}
                  {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
                </div>
              </div>
              <Composer input={input} setInput={setInput} onSend={() => void sendMessage()} isStreaming={isStreaming} section={section} inputRef={inputRef} />
            </div>
          )}
        </section>
      </div>
      {mobileMenu && <button className="fixed inset-0 z-40 bg-background/70 md:hidden" onClick={() => setMobileMenu(false)} aria-label="Close navigation overlay" />}
    </main>
  );
}

function NavItem({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left text-sm transition ${active ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"}`}><span className={active ? "text-primary" : ""}>{icon}</span>{label}</button>;
}

function EmptyState({ section, onPick }: { section: Section; onPick: (text: string) => void }) {
  const build = section === "build";
  return <div className="flex min-h-[360px] flex-col items-center justify-center text-center"><img src="/favicon.ico" alt="Kova AI" className="mb-5 size-14 rounded-2xl shadow-[0_0_30px_var(--glow)]" /><h1 className="text-3xl font-semibold tracking-tight">{build ? "What will you build?" : "How can I help?"}</h1><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{build ? "Describe a website or app idea and Kova will help you shape it." : "Ask anything, get a clear answer, or start a conversation."}</p><div className="mt-8 flex flex-wrap justify-center gap-2">{(build ? ["Build a portfolio website", "Create a simple landing page"] : ["Explain something to me", "Help me write something", "Give me an idea"]).map((text) => <button key={text} onClick={() => onPick(text)} className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground">{text}</button>)}</div></div>;
}

function Composer({ input, setInput, onSend, isStreaming, section, inputRef }: { input: string; setInput: (value: string) => void; onSend: () => void; isStreaming: boolean; section: Section; inputRef: React.RefObject<HTMLTextAreaElement | null> }) {
  return <div className="border-t border-border bg-card/70 p-4 md:px-10 md:py-5"><div className="mx-auto max-w-2xl"><div className="overflow-hidden rounded-lg border border-input bg-card shadow-[0_0_0_1px_var(--glow)] focus-within:border-primary"><textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSend(); } }} placeholder={section === "build" ? "Describe what you want to build…" : "Message Kova AI…"} rows={2} className="w-full resize-none bg-transparent px-4 pt-3 text-sm text-foreground outline-none placeholder:text-muted-foreground" /><div className="flex items-center justify-between px-3 pb-3 pt-2"><span className="font-mono text-[10px] text-muted-foreground">Free · real-time AI</span><button disabled={!input.trim() || isStreaming} onClick={onSend} className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><ArrowUp size={17} /></button></div></div><div className="mt-2 text-center font-mono text-[10px] text-muted-foreground">Shift + Enter for a new line</div></div></div>;
}

function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  async function copyMessage() { await navigator.clipboard?.writeText(message.content); setCopied(true); window.setTimeout(() => setCopied(false), 1400); }
  return <div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}><div className={`grid size-8 shrink-0 place-items-center rounded-md ${isUser ? "order-2 bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}>{isUser ? <span className="text-[10px] font-bold">ZK</span> : <Bot size={15} />}</div><div className={`max-w-[min(100%,620px)] ${isUser ? "order-1" : ""}`}><div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] text-muted-foreground"><span>{isUser ? "You" : "Kova AI"}</span><span>·</span><span>{isUser ? "now" : "assistant"}</span></div><div className={`rounded-lg px-4 py-3 text-sm leading-6 ${isUser ? "bg-primary text-primary-foreground" : "border border-border bg-card text-card-foreground"}`}><ReactMarkdown components={{ p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>, strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>, code: ({ children }) => <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">{children}</code>, ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul> }}>{message.content || " "}</ReactMarkdown></div>{!isUser && message.content && <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-muted-foreground"><span className="flex items-center gap-1 text-success"><Check size={11} /> complete</span><button onClick={() => void copyMessage()} className="flex items-center gap-1 hover:text-foreground">{copied ? <Check size={11} /> : <Copy size={11} />}{copied ? "Copied" : "Copy"}</button></div>}</div></div>;
}

function ProfilePanel({ installPrompt, onInstall }: { installPrompt: BeforeInstallPromptEvent | null; onInstall: () => void }) {
  return <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 py-10 md:px-10"><div className="w-full max-w-lg"><div className="border-b border-border pb-7"><div className="flex items-center gap-4"><div className="grid size-16 place-items-center rounded-2xl bg-secondary text-xl font-bold text-secondary-foreground">ZK</div><div><h1 className="text-2xl font-semibold tracking-tight">Zaid Khan</h1><p className="mt-1 text-sm text-muted-foreground">Free Kova AI workspace</p></div></div></div><div className="space-y-3 pt-7"><div className="flex items-center justify-between border-b border-border py-3 text-sm"><span className="text-muted-foreground">Plan</span><span className="font-medium">Free</span></div><div className="flex items-center justify-between border-b border-border py-3 text-sm"><span className="text-muted-foreground">Chat access</span><span className="text-success">Available</span></div><div className="flex items-center justify-between border-b border-border py-3 text-sm"><span className="text-muted-foreground">Website builder</span><span className="text-success">Available</span></div></div>{installPrompt && <button onClick={onInstall} className="mt-8 flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110">Install Kova on this device</button>}<p className="mt-5 text-center text-xs leading-5 text-muted-foreground">Kova is free to use. Install support appears when your browser allows adding it to your home screen.</p></div></div>;
}