import { Band } from "@/components/ui/Band";
import { Container } from "@/components/ui/Container";
import { asset } from "@/lib/assets";

export const metadata = { title: "Frequently Asked Questions · Starlight UMN 2026" };

/**
 * Halaman ini sengaja masih kosong. Yang ada baru background bersama,
 * navbar, dan footer. Isinya dibangun setelah aset halaman ini dikirim.
 */
export default function Page() {
  return (
    <Band bg={asset.shared.pageBg}>
      <Container className="flex min-h-[60svh] flex-col items-center justify-center py-24 text-center">
        <h1 className="text-3xl sm:text-4xl">Frequently Asked Questions</h1>
        <p className="mt-4 max-w-sm text-sm text-muted">
          Halaman ini belum dibangun. Nunggu aset dari tim visual.
        </p>
      </Container>
    </Band>
  );
}
