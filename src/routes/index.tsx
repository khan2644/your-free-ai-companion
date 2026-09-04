import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Activity,
  ArrowUp,
  Bot,
  Braces,
  ChevronDown,
  CirclePlus,
  Code2,
  FileCode2,
  Folder,
  Globe2,
  LayoutTemplate,
  Menu,
  MessageSquare,
  Paperclip,
  PanelRight,
  Play,
  Plus,
  Rocket,
  Search,
  Settings2,
  Sparkles,
  TerminalSquare,
  X,
  Zap,
} from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Mode = "build" | "chat" | "code";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kova AI — Build ideas into real apps" },
      { name: "description", content: "A free AI workspace for chatting, coding, and building real websites with a live preview." },
      { property: "og:title", content: "Kova AI — Build ideas into real apps" },
      { property: "og:description", content: "Chat with AI, generate code, and see your website come alive in real time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KovaWorkspace,
});

const starterMessages: ChatMessage[] = [
  {
    role: "user",
    content: "Build a focused workspace for my new AI product. I want a clean landing page, a prompt input, and a live product preview.",
  },
  {
    role: "assistant",
    content: "Absolutely. I’ve mapped this into a focused AI workspace with a clear prompt flow, responsive shell, and a live preview surface.\n\n**Ready to build:** landing page, prompt composer, product preview, and responsive layout.",
  },
];

function KovaWorkspace() {
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("build");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [mobileRail, setMobileRail] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || isStreaming) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setError("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, mode }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || "The AI could not answer right now.");
      }
      if (!response.body) throw new Error("The AI response stream was unavailable.");
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
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className={`${mobileRail ? "flex" : "hidden"} fixed inset-y-0 left-0 z-50 w-72 flex-col border-r border-sidebar-border bg-sidebar p-4 shadow-2xl md:relative md:flex md:w-[230px] md:shadow-none`}>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_24px_var(--glow)]"><Sparkles size={16} /></div>
              <div><div className="font-semibold tracking-tight">Kova</div><div className="font-mono text-[10px] text-muted-foreground">AI WORKSPACE</div></div>
            </div>
            <button className="text-muted-foreground md:hidden" onClick={() => setMobileRail(false)} aria-label="Close menu"><X size={18} /></button>
          </div>
          <button className="mt-7 flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110" onClick={() => setMessages([])}><CirclePlus size={17} /> New project</button>
          <div className="mt-7 flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"><span>Projects</span><Plus size={14} /></div>
          <nav className="mt-3 space-y-1">
            <ProjectItem icon={<LayoutTemplate size={15} />} name="Kova landing" active />
            <ProjectItem icon={<Globe2 size={15} />} name="Portfolio v2" />
            <ProjectItem icon={<Code2 size={15} />} name="Taskflow app" />
          </nav>
          <div className="mt-auto space-y-1 border-t border-sidebar-border pt-4">
            <RailItem icon={<Search size={15} />} label="Search projects" />
            <RailItem icon={<Settings2 size={15} />} label="Workspace settings" />
            <div className="mt-4 flex items-center gap-2 rounded-md bg-sidebar-accent p-2.5"><div className="grid size-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">ZK</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">Zaid Khan</div><div className="text-[10px] text-muted-foreground">Free workspace</div></div><ChevronDown size={14} className="text-muted-foreground" /></div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[62px] shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur md:px-6">
            <div className="flex items-center gap-3"><button className="text-muted-foreground md:hidden" onClick={() => setMobileRail(true)} aria-label="Open menu"><Menu size={19} /></button><div className="hidden h-5 w-px bg-border md:block" /><div><div className="flex items-center gap-2 text-sm font-semibold">Kova landing <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">draft</span></div><div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground"><span className="live-pulse size-1.5 rounded-full bg-success" /> Saved just now</div></div></div>
            <div className="flex items-center gap-2"><button className="hidden items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent sm:flex"><Rocket size={14} /> Publish</button><button className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-accent" aria-label="Activity"><Activity size={16} /></button><button className="grid size-9 place-items-center rounded-md bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground" onClick={() => setPreviewVisible(!previewVisible)} aria-label="Toggle preview"><PanelRight size={16} /></button></div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-background px-4 md:px-6"><ModeButton active={mode === "build"} icon={<Zap size={14} />} label="Build" onClick={() => setMode("build")} /><ModeButton active={mode === "chat"} icon={<MessageSquare size={14} />} label="Chat" onClick={() => setMode("chat")} /><ModeButton active={mode === "code"} icon={<Braces size={14} />} label="Code" onClick={() => setMode("code")} /><div className="ml-auto font-mono text-[10px] text-muted-foreground">gemini 3.7 flash</div></div>
              <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
                <div className="mx-auto max-w-2xl space-y-7">
                  {messages.length === 0 && <EmptyState onPick={sendMessage} />}
                  {messages.map((message, index) => <Message key={`${index}-${message.role}`} message={message} />)}
                  {isStreaming && messages.at(-1)?.content === "" && <div className="flex items-center gap-2 pl-1 text-xs text-muted-foreground"><span className="live-pulse size-1.5 rounded-full bg-primary" /> Kova is thinking…</div>}
                  {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
                </div>
              </div>
              <div className="border-t border-border bg-card/70 p-4 md:px-10 md:py-5"><div className="mx-auto max-w-2xl"><div className="overflow-hidden rounded-lg border border-input bg-card shadow-[0_0_0_1px_var(--glow)] focus-within:border-primary"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder={mode === "build" ? "Describe what you want to build…" : mode === "code" ? "Ask for code or a fix…" : "Ask Kova anything…"} rows={2} className="w-full resize-none bg-transparent px-4 pt-3 text-sm text-foreground outline-none placeholder:text-muted-foreground" /><div className="flex items-center justify-between px-3 pb-3 pt-2"><div className="flex items-center gap-1"><button className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent" aria-label="Attach a file"><Paperclip size={16} /></button><button className="hidden rounded-md px-2 py-1 font-mono text-[10px] text-muted-foreground hover:bg-accent sm:block">/ commands</button></div><button disabled={!input.trim() || isStreaming} onClick={() => void sendMessage()} className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><ArrowUp size={17} /></button></div></div><div className="mt-2 flex items-center justify-between px-1 font-mono text-[10px] text-muted-foreground"><span>Free plan · real-time AI</span><span>Shift + Enter for newline</span></div></div></div>
            </div>
            {previewVisible && <PreviewPanel />}
          </div>
        </section>
      </div>
      {mobileRail && <button className="fixed inset-0 z-40 bg-background/70 md:hidden" onClick={() => setMobileRail(false)} aria-label="Close navigation overlay" />}
    </main>
  );
}

function ProjectItem({ icon, name, active = false }: { icon: React.ReactNode; name: string; active?: boolean }) { return <button className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition ${active ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"}`}><span className={active ? "text-primary" : ""}>{icon}</span>{name}<span className="ml-auto text-[10px] text-muted-foreground">•••</span></button>; }
function RailItem({ icon, label }: { icon: React.ReactNode; label: string }) { return <button className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">{icon}{label}</button>; }
function ModeButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) { return <button onClick={onClick} className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60"}`}>{icon}{label}</button>; }
function Message({ message }: { message: ChatMessage }) { const isUser = message.role === "user"; return <div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}><div className={`grid size-7 shrink-0 place-items-center rounded-md ${isUser ? "order-2 bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}>{isUser ? <span className="text-[10px] font-bold">ZK</span> : <Bot size={15} />}</div><div className={`max-w-[min(100%,590px)] ${isUser ? "order-1" : ""}`}><div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] text-muted-foreground"><span>{isUser ? "You" : "Kova AI"}</span><span>·</span><span>{isUser ? "now" : "assistant"}</span></div><div className={`rounded-lg px-4 py-3 text-sm leading-6 ${isUser ? "bg-primary text-primary-foreground" : "border border-border bg-card text-card-foreground"}`}><ReactMarkdown components={{ p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>, strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>, code: ({ children }) => <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">{children}</code>, ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul> }}>{message.content || " "}</ReactMarkdown></div>{!isUser && message.content && <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-muted-foreground"><span className="flex items-center gap-1 text-success"><span className="size-1.5 rounded-full bg-success" /> complete</span><button className="hover:text-foreground">Copy</button><button className="hover:text-foreground">Regenerate</button></div>}</div></div>; }
function EmptyState({ onPick }: { onPick: (text: string) => void }) { return <div className="flex min-h-[280px] flex-col items-center justify-center text-center"><div className="mb-4 grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_30px_var(--glow)]"><Sparkles size={21} /></div><h1 className="text-2xl font-semibold tracking-tight">What will you build today?</h1><p className="mt-2 max-w-sm text-sm text-muted-foreground">Describe an idea, ask a question, or drop in a bug. Kova turns it into momentum.</p><div className="mt-7 flex flex-wrap justify-center gap-2"><QuickPrompt text="Build a portfolio site" onClick={onPick} /><QuickPrompt text="Explain a React hook" onClick={onPick} /><QuickPrompt text="Create a SaaS dashboard" onClick={onPick} /></div></div>; }
function QuickPrompt({ text, onClick }: { text: string; onClick: (text: string) => void }) { return <button onClick={() => onClick(text)} className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground">{text}</button>; }
function PreviewPanel() { return <aside className="flex w-full shrink-0 flex-col border-t border-border bg-sidebar/50 xl:w-[43%] xl:border-l xl:border-t-0"><div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4"><div className="flex items-center gap-2 text-xs font-semibold"><span className="live-pulse size-1.5 rounded-full bg-success" /> Live preview</div><div className="flex items-center gap-1"><button className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-accent" aria-label="Run preview"><Play size={13} /></button><button className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-accent" aria-label="Open preview"><Globe2 size={14} /></button></div></div><div className="flex items-center gap-2 border-b border-border px-4 py-2 font-mono text-[10px] text-muted-foreground"><span className="size-2 rounded-full bg-destructive/70" /><span className="size-2 rounded-full bg-warning/80" /><span className="size-2 rounded-full bg-success/80" /><div className="ml-2 flex-1 truncate rounded bg-background px-2 py-1">kova-preview.local</div></div><div className="min-h-[370px] flex-1 overflow-hidden p-4 md:p-7"><div className="h-full min-h-[370px] overflow-hidden rounded-lg border border-border bg-background shadow-2xl"><div className="flex items-center justify-between border-b border-border px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold"><div className="grid size-6 place-items-center rounded bg-primary text-primary-foreground"><Sparkles size={12} /></div>Kova</div><div className="hidden items-center gap-4 text-[10px] text-muted-foreground sm:flex"><span>Product</span><span>Workflows</span><span>Pricing</span><span className="rounded bg-primary px-2 py-1 text-primary-foreground">Start free</span></div><Menu size={15} className="text-muted-foreground sm:hidden" /></div><div className="relative overflow-hidden px-6 pb-8 pt-10 md:px-10 md:pt-16"><div className="pointer-events-none absolute right-[-50px] top-[-40px] size-56 rounded-full border border-primary/20 bg-primary/5 blur-2xl" /><div className="relative max-w-md"><div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary"><span className="size-1.5 rounded-full bg-primary" /> Build without limits</div><h2 className="text-3xl font-semibold leading-[1.08] tracking-tight md:text-5xl">Ideas into <span className="text-primary">interfaces.</span></h2><p className="mt-4 max-w-sm text-xs leading-5 text-muted-foreground md:text-sm">A calm, capable workspace for the moments when your best product ideas arrive faster than your code.</p><div className="mt-6 flex items-center gap-3"><button className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Start building <ArrowUp size={13} className="ml-1 inline rotate-45" /></button><span className="font-mono text-[10px] text-muted-foreground">No card required</span></div></div><div className="mt-10 grid grid-cols-2 gap-2 md:mt-14 md:grid-cols-3"><PreviewMetric icon={<TerminalSquare size={14} />} value="24/7" label="Available" /><PreviewMetric icon={<FileCode2 size={14} />} value="∞" label="Iterations" /><PreviewMetric icon={<Zap size={14} />} value="Live" label="Preview" /></div></div></div></div><div className="hidden items-center justify-between border-t border-border px-4 py-2 font-mono text-[10px] text-muted-foreground md:flex"><span className="flex items-center gap-1.5"><Folder size={12} /> src / pages / landing</span><span>3 files changed</span></div></aside>; }
function PreviewMetric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="rounded-md border border-border bg-card p-3"><div className="mb-4 text-primary">{icon}</div><div className="text-lg font-semibold">{value}</div><div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div></div>; }