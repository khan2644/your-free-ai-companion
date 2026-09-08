import { useState } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = { title: string; note: string; command: string };

const steps: Step[] = [
  {
    title: "1. Decode the APK",
    note: "Unpacks resources, AndroidManifest.xml and smali code into an editable project folder.",
    command: "apktool d original.apk -o decoded_project",
  },
  {
    title: "2. Edit smali / XML / resources",
    note: "Change values in res/values/*.xml, tweak the manifest, or patch logic in the smali/ folder. Keep a backup of every file you touch.",
    command: "code decoded_project   # edit smali/, res/, AndroidManifest.xml",
  },
  {
    title: "3. Rebuild",
    note: "Builds the edited project back into an unsigned APK.",
    command: "apktool b decoded_project -o unsigned.apk",
  },
  {
    title: "4. Zipalign",
    note: "Aligns uncompressed data on 4-byte boundaries — required before signing for Play Store uploads.",
    command: "zipalign -p -f -v 4 unsigned.apk aligned.apk",
  },
  {
    title: "5. Create a keystore (once)",
    note: "Your own signing key. Store the keystore and passwords safely; losing it means you can no longer update the app.",
    command:
      'keytool -genkeypair -v -keystore my-release.jks -alias myalias \\\n  -keyalg RSA -keysize 2048 -validity 10000',
  },
  {
    title: "6. Sign the APK",
    note: "Signs the aligned APK with your keystore.",
    command:
      "apksigner sign --ks my-release.jks --ks-key-alias myalias \\\n  --out signed.apk aligned.apk",
  },
  {
    title: "7. Verify the signature",
    note: "Confirms the signature is valid and shows which signature schemes are used.",
    command: "apksigner verify --verbose --print-certs signed.apk",
  },
  {
    title: "8. Install on a device",
    note: "Installs the signed build over ADB for testing.",
    command: "adb install -r signed.apk",
  },
];

const pipeline = [
  "original.apk",
  "apktool d",
  "decoded project",
  "edit smali / XML / res",
  "apktool b",
  "unsigned.apk",
  "zipalign",
  "aligned.apk",
  "apksigner sign",
  "signed.apk",
  "apksigner verify",
];

export function ApkToolkit() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-10">
      <div className="mx-auto w-full max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">Game dev toolkit</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">APK build &amp; signing pipeline</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The full decode → modify → rebuild → align → sign → verify flow for Android game builds, with copy-ready
          commands. These commands run on your own computer (Java 17+, Android build-tools and apktool installed).
        </p>

        <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
          <span>
            Use this on builds you own or are licensed to modify — your own game, a test build, or an open-source APK.
            Repacking someone else&apos;s app to bypass payments or licensing is illegal and not supported here.
          </span>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {pipeline.map((node, index) => (
            <span key={node} className="flex items-center gap-2">
              <span className="rounded-md border border-border bg-secondary px-2.5 py-1.5 font-mono text-[10px] text-secondary-foreground">
                {node}
              </span>
              {index < pipeline.length - 1 && <span className="text-muted-foreground">→</span>}
            </span>
          ))}
        </div>

        <div className="mt-8 space-y-4 pb-10">
          {steps.map((step) => (
            <StepCard key={step.title} step={step} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepCard({ step }: { step: Step }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(step.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="rounded-xl border border-border bg-card p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{step.title}</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.note}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={copy} aria-label={`Copy command for ${step.title}`}>
          {copied ? <Check className="text-success" /> : <Copy />}
        </Button>
      </div>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-secondary p-3 font-mono text-[11px] leading-relaxed text-secondary-foreground">
        <code>{step.command}</code>
      </pre>
    </article>
  );
}
