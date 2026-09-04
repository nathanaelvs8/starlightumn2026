import { GerdaFlow } from "@/components/site/GerdaFlow";

export const metadata = { title: "Mini Gerda · Starlight UMN 2026" };

export default function MiniGerdaPage() {
  return (
    <div style={{ marginTop: "-72px" }}>
      <GerdaFlow />
      <div
        aria-hidden
        className="h-64"
        style={{ background: "rgba(10,20,48,0.97)" }}
      />
    </div>
  );
}