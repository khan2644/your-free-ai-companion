import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowUp,
  Bot,
  Check,
  Code2,
  Copy,
  FileCode2,
  FileText,
  ImagePlus,
  LayoutTemplate,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import {
  Message as ElementMessage,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Section = "chat" | "build" | "profile";
type AttachmentMeta = { name: string; type: string; size: number };
type ChatThread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
  attachments: AttachmentMeta[];
};

const THREADS_KEY = "kova-chat-threads-v2";
const FILE_LIMIT = 100 * 1024 * 1024;
const VIDEO_LIMIT = 200 * 1024 * 1024;
const PHOTO_LIMIT = 20;
const starterCode = `<!doctype html>
<html>
  <body>
    <main class="hero">
      <p class="eyebrow">KOVA STUDIO</p>
      <h1>Build something people remember.</h1>
      <p>A clean, responsive starting point for your next idea.</p>
      <button>Start building</button>
    </main>
  </body>
</html>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font: 16px system-ui; color: #f4f7fb; background: #101923; }
  .hero { min-height: 100vh; display: grid; place-content: center; gap: 16px; padding: 32px; max-width: 720px; margin: auto; }
  .eyebrow { color: #65e5d1; letter-spacing: .18em; font-size: 12px; }
  h1 { font-size: clamp(40px, 7vw, 76px); line-height: .98; margin: 0; }
  p { color: #9eb0bd; line-height: 1.6; }
  button { width: fit-content; border: 0; border-radius: 8px; padding: 13px 18px; background: #65e5d1; color: #101923; font-weight: 700; }
</style>`;

export const Route = createFileRoute("/")({
  head: () => ({
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
    ],
    meta: [
      { title: "Kova AI — Free AI chat and website builder" },
      { name: "description", content: "A focused free AI chat and website building workspace." },
      { property: "og:title", content: "Kova AI — Free AI chat and website builder" },
      { property: "og:description", content: "Chat with Kova AI, upload files, or build a website with live preview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0f172a" },
    ],
  }),
  component: () => <KovaWorkspace />,
});

export function KovaWorkspace({ initialThreadId }: { initialThreadId?: string }) {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[]>(() => loadThreads());
  const [activeThreadId, setActiveThreadId] = useState(initialThreadId ?? "");
  const [section, setSection] = useState<Section>("chat");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [code, setCode] = useState(starterCode);
  const [previewOpen, setPreviewOpen] = useState(true);

  useEffect(() => {
    if (threads.length === 0) {
      const thread = createThread();
      setThreads([thread]);
      setActiveThreadId(initialThreadId ?? thread.id);
      if (initialThreadId) {
        setThreads([{ ...thread, id: initialThreadId }]);
      }
      return;
    }
    const wanted = initialThreadId ?? activeThreadId;
    const nextId = threads.some((thread) => thread.id === wanted) ? wanted : threads[0].id;
    if (nextId !== activeThreadId) setActiveThreadId(nextId);
  }, [activeThreadId, initialThreadId, threads]);

  useEffect(() => {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  }, [threads]);

  const activeThread = threads.find((thread) => thread.id === activeThreadId) ?? threads[0];
  const messages = activeThread?.messages ?? [];

  function selectThread(id: string) {
    setActiveThreadId(id);
    void navigate({ to: "/chat/$threadId", params: { threadId: id } });
    setSection("chat");
    setMobileMenu(false);
  }

  function startNewChat() {
    const thread = createThread();
    setThreads((current) => [thread, ...current]);
    setActiveThreadId(thread.id);
    void navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
    setSection("chat");
    setMobileMenu(false);
  }

  function deleteAllChats() {
    const thread = createThread();
    setThreads([thread]);
    setActiveThreadId(thread.id);
    void navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
  }

  function updateThread(update: (thread: ChatThread) => ChatThread) {
    setThreads((current) => current.map((thread) => (thread.id === activeThreadId ? update(thread) : thread)));
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className={`${mobileMenu ? "flex" : "hidden"} fixed inset-y-0 left-0 z-50 w-80 flex-col border-r border-sidebar-border bg-sidebar p-4 shadow-2xl md:relative md:flex md:w-[270px] md:shadow-none`}>
          <div className="flex items-center justify-between px-2">
            <button className="flex items-center gap-2.5 text-left" onClick={() => selectThread(activeThreadId)} aria-label="Open Kova chat">
              <img src="/favicon.ico" alt="Kova" className="size-8 rounded-lg" />
              <span><span className="block font-semibold tracking-tight">Kova</span><span className="block font-mono text-[10px] text-muted-foreground">FREE AI WORKSPACE</span></span>
            </button>
            <Button className="md:hidden" onClick={() => setMobileMenu(false)} aria-label="Close menu" size="icon" variant="ghost"><X /></Button>
          </div>
          <Button className="mt-8 w-full justify-start" onClick={startNewChat}><Plus /> New chat</Button>
          <nav className="mt-6 space-y-1" aria-label="Main menu">
            <NavItem active={section === "chat"} icon={<MessageSquare />} label="Chat" onClick={() => { setSection("chat"); setMobileMenu(false); }} />
            <NavItem active={section === "build"} icon={<LayoutTemplate />} label="Build a website" onClick={() => { setSection("build"); setMobileMenu(false); }} />
          </nav>
          <div className="mt-7 flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground"><span>Recent chats</span><button onClick={deleteAllChats} aria-label="Delete all chats" title="Delete all chats" className="rounded p-1 hover:bg-sidebar-accent hover:text-destructive"><Trash2 size={13} /></button></div>
          <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {threads.map((thread) => <ChatRow key={thread.id} thread={thread} active={thread.id === activeThreadId} onClick={() => selectThread(thread.id)} />)}
          </div>
          <div className="border-t border-sidebar-border pt-4"><NavItem active={section === "profile"} icon={<UserRound />} label="Profile" onClick={() => { setSection("profile"); setMobileMenu(false); }} /><div className="mt-3 flex items-center gap-2 rounded-md bg-sidebar-accent p-2.5"><div className="grid size-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">ZK</div><div><div className="text-xs font-semibold">Zaid Khan</div><div className="text-[10px] text-muted-foreground">Free plan</div></div></div></div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[62px] shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur md:px-7">
            <div className="flex min-w-0 items-center gap-3"><Button className="md:hidden" onClick={() => setMobileMenu(true)} aria-label="Open menu" size="icon" variant="ghost"><Menu /></Button><div className="min-w-0"><div className="truncate text-sm font-semibold">{section === "build" ? "Build a website" : section === "profile" ? "Profile" : activeThread?.title ?? "New chat"}</div><div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground"><span className="live-pulse size-1.5 rounded-full bg-success" /> Ready</div></div></div>
            <div className="flex items-center gap-2"><span className="hidden rounded-md border border-border px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground sm:inline">FREE</span><Button aria-label="More options" size="icon" variant="ghost"><MoreHorizontal /></Button></div>
          </header>
          {section === "profile" ? <ProfilePanel /> : section === "build" ? <BuildWorkspace code={code} setCode={setCode} previewOpen={previewOpen} setPreviewOpen={setPreviewOpen} /> : <ChatWorkspace thread={activeThread} onUpdate={updateThread} />}
        </section>
      </div>
      {mobileMenu && <button className="fixed inset-0 z-40 bg-background/70 md:hidden" onClick={() => setMobileMenu(false)} aria-label="Close navigation overlay" />}
    </main>
  );
}

function ChatWorkspace({ thread, onUpdate }: { thread: ChatThread | undefined; onUpdate: (update: (thread: ChatThread) => ChatThread) => void }) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const messages = thread?.messages ?? [];

  useEffect(() => { inputRef.current?.focus(); }, [thread?.id]);

  async function sendMessage(text: string, files: AttachmentMeta[]) {
    const content = text.trim();
    if ((!content && files.length === 0) || isStreaming || !thread) return;
    const attachmentContext = files.length ? `\n\nAttached files: ${files.map((file) => `${file.name} (${formatBytes(file.size)})`).join(", ")}` : "";
    const userContent = `${content || "Please review these attachments."}${attachmentContext}`;
    const nextMessages = [...messages, { role: "user" as const, content: userContent }];
    onUpdate((current) => ({ ...current, messages: [...nextMessages, { role: "assistant", content: "" }], attachments: [...current.attachments, ...files], title: current.messages.length === 0 ? titleFrom(content || files[0]?.name || "New chat") : current.title, updatedAt: Date.now() }));
    setIsStreaming(true); setError(""); setNotice(files.length ? "Attachment details added without sending the original files to the AI." : "");
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: nextMessages, mode: "chat" }) });
      if (!response.ok) { const body = await response.json().catch(() => null) as { error?: string } | null; throw new Error(body?.error || "Kova could not answer right now."); }
      if (!response.body) throw new Error("The AI response was unavailable.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let assistantText = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; assistantText += decoder.decode(value, { stream: true }); onUpdate((current) => ({ ...current, messages: [...nextMessages, { role: "assistant", content: assistantText }], updatedAt: Date.now() })); }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Something went wrong."); onUpdate((current) => ({ ...current, messages: nextMessages })); }
    finally { setIsStreaming(false); inputRef.current?.focus(); }
  }

  return <div className="flex min-h-0 flex-1 flex-col"><Conversation className="min-h-0 flex-1 overflow-y-auto"><ConversationContent className="mx-auto w-full max-w-3xl px-4 py-8 md:px-10 md:py-10">{messages.length === 0 ? <ConversationEmptyState className="min-h-[380px]" icon={<img src="/favicon.ico" alt="Kova AI" className="size-14 rounded-2xl shadow-[0_0_30px_var(--glow)]" />} title="How can I help?" description="Ask anything, upload files, or start a focused conversation." /> : messages.map((message, index) => <ElementMessage key={`${index}-${message.role}`} from={message.role}><MessageContent>{message.role === "assistant" ? <MessageResponse>{message.content || " "}</MessageResponse> : <p className="whitespace-pre-wrap">{message.content}</p>}</MessageContent></ElementMessage>)}{isStreaming && messages.at(-1)?.content === "" && <Shimmer className="pl-1 text-sm">Thinking…</Shimmer>}{error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}{notice && <div className="rounded-md border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground">{notice}</div>}</ConversationContent></Conversation><Composer onSubmit={sendMessage} isStreaming={isStreaming} inputRef={inputRef} /></div>;
}

function Composer({ onSubmit, isStreaming, inputRef }: { onSubmit: (text: string, files: AttachmentMeta[]) => Promise<void>; isStreaming: boolean; inputRef: React.RefObject<HTMLTextAreaElement | null> }) {
  const attachments = usePromptInputAttachments();
  const [uploadError, setUploadError] = useState("");
  const photoCount = attachments.files.filter((file) => file.mediaType?.startsWith("image/")).length;
  function validateFile(file: File) { if (file.type.startsWith("video/") && file.size > VIDEO_LIMIT) return "Videos must be 200 MB or smaller."; if (!file.type.startsWith("video/") && file.size > FILE_LIMIT) return "Files must be 100 MB or smaller."; return null; }
  return <div className="border-t border-border bg-card/70 p-4 md:px-10 md:py-5"><div className="mx-auto max-w-3xl"><PromptInput accept="image/*,video/*,audio/*,.pdf,.txt,.md,.doc,.docx,.js,.jsx,.ts,.tsx,.html,.css,.json" multiple maxFiles={20} validateFile={validateFile} convertFiles={false} onError={({ message }) => setUploadError(message)} onSubmit={async ({ text, files }) => { if (photoCount > PHOTO_LIMIT) { setUploadError("You can add up to 20 photos in one message."); return; } await onSubmit(text, files.map((file) => ({ name: file.filename ?? "attachment", type: file.mediaType ?? "application/octet-stream", size: file.size ?? 0 }))); }}><PromptInputTextarea ref={inputRef} placeholder="Message Kova AI…" /><PromptInputFooter><div className="flex min-w-0 items-center gap-1"><PromptInputButton tooltip="Upload files" onClick={() => attachments.openFileDialog()}><Paperclip /></PromptInputButton><span className="hidden truncate text-[10px] text-muted-foreground sm:inline">100 MB files · 200 MB video · 20 photos</span></div><PromptInputSubmit status={isStreaming ? "submitted" : undefined} disabled={isStreaming} /></PromptInputFooter></PromptInput>{uploadError && <p className="mt-2 text-center text-xs text-destructive">{uploadError}</p>}<p className="mt-2 text-center font-mono text-[10px] text-muted-foreground">Shift + Enter for a new line · files stay on this device</p></div></div>;
}

function BuildWorkspace({ code, setCode, previewOpen, setPreviewOpen }: { code: string; setCode: (value: string) => void; previewOpen: boolean; setPreviewOpen: (value: boolean) => void }) {
  return <div className="flex min-h-0 flex-1 flex-col"><div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-7"><div><h1 className="text-sm font-semibold">Studio</h1><p className="text-xs text-muted-foreground">Edit code and see changes instantly.</p></div><Button variant="outline" size="sm" onClick={() => setPreviewOpen(!previewOpen)}>{previewOpen ? "Hide preview" : "Show preview"}</Button></div><div className={`grid min-h-0 flex-1 ${previewOpen ? "lg:grid-cols-2" : "grid-cols-1"}`}><div className="flex min-h-[420px] flex-col border-b border-border lg:border-b-0 lg:border-r"><div className="flex items-center gap-2 border-b border-border px-4 py-2 font-mono text-[10px] text-muted-foreground"><FileCode2 size={14} /> index.html</div><textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} className="min-h-0 flex-1 resize-none bg-background p-4 font-mono text-xs leading-6 text-foreground outline-none" aria-label="Website code editor" /></div>{previewOpen && <div className="flex min-h-[420px] flex-col bg-muted/20"><div className="flex items-center gap-2 border-b border-border px-4 py-2 font-mono text-[10px] text-muted-foreground"><LayoutTemplate size={14} /> live preview</div><iframe title="Live website preview" srcDoc={code} sandbox="allow-scripts" className="min-h-0 flex-1 bg-white" /></div>}</div></div>;
}

function ChatRow({ thread, active, onClick }: { thread: ChatThread; active: boolean; onClick: () => void }) { return <button onClick={onClick} className={`group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"}`}><MessageSquare size={14} className={active ? "text-primary" : "shrink-0"} /><span className="min-w-0 flex-1 truncate">{thread.title}</span><span className="hidden font-mono text-[9px] group-hover:inline">{thread.messages.length}</span></button>; }
function NavItem({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) { return <button onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left text-sm transition ${active ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"}`}><span className={active ? "text-primary" : ""}>{icon}</span>{label}</button>; }
function ProfilePanel() { return <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 py-10 md:px-10"><div className="w-full max-w-lg"><div className="flex items-center gap-4 border-b border-border pb-7"><div className="grid size-16 place-items-center rounded-2xl bg-secondary text-xl font-bold text-secondary-foreground">ZK</div><div><h1 className="text-2xl font-semibold">Zaid Khan</h1><p className="mt-1 text-sm text-muted-foreground">Free Kova AI workspace</p></div></div><div className="space-y-3 pt-7"><div className="flex items-center justify-between border-b border-border py-3 text-sm"><span className="text-muted-foreground">Chat access</span><span className="text-success">Available</span></div><div className="flex items-center justify-between border-b border-border py-3 text-sm"><span className="text-muted-foreground">Website studio</span><span className="text-success">Available</span></div><div className="flex items-center justify-between border-b border-border py-3 text-sm"><span className="text-muted-foreground">Local chat history</span><span className="text-success">On</span></div></div></div></div>; }
function createThread(): ChatThread { return { id: crypto.randomUUID(), title: "New chat", updatedAt: Date.now(), messages: [], attachments: [] }; }
function loadThreads(): ChatThread[] { if (typeof window === "undefined") return []; try { const parsed = JSON.parse(localStorage.getItem(THREADS_KEY) ?? "[]") as ChatThread[]; return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function titleFrom(value: string) { return value.replace(/\s+/g, " ").trim().slice(0, 34) || "New chat"; }
function formatBytes(bytes: number) { if (!bytes) return "0 B"; const units = ["B", "KB", "MB", "GB"]; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`; }