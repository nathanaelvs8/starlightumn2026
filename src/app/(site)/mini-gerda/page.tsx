import { GerdaFlow } from "@/components/site/GerdaFlow";

export const metadata = { title: "Mini Gerda · Starlight UMN 2026" };

/*
  Dulu di bawah GerdaFlow ada satu kotak navy lagi setinggi 256px
  (`h-64`). Dua kotak setengah-tembus ditumpuk begitu bikin GARIS tipis
  di sambungannya (posisinya jatuh di piksel pecahan, jadi tepinya
  sama-sama tembus dikit), dan area gelapnya jadi panjang banget.
  Sekarang nggak ada kotak tambahan — ruang di bawah daftar anggota
  diambil dari kotak yang udah ada di GerdaFlow.
*/
export default function MiniGerdaPage() {
  return (
    <div style={{ marginTop: "-72px" }}>
      <GerdaFlow />
    </div>
  );
}
