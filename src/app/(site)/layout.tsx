import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

/**
 * Navbar + Footer sama di semua halaman.
 *
 * Nanti halaman auth (login/register/lengkapi profil) dipindah ke route
 * group sendiri "(auth)" yang nggak pakai layout ini, karena tiga layar
 * itu nggak punya navbar & footer.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
