export type Division = {
  name: string;
  theme: string;
  role: string;
  desc: string;
};

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

export const divisions: Division[] = [
  { theme: "Auradon", role: "BPH", name: "Auradon", desc: LOREM },
  { theme: "Treasury", role: "Fresh Money", name: "Treasury", desc: LOREM },
  { theme: "Herald", role: "Media Partner", name: "Herald", desc: LOREM },
  { theme: "Wonderland", role: "Sponsorship", name: "Wonderland", desc: LOREM },
  { theme: "Wicked", role: "Acara", name: "Wicked", desc: LOREM },
  { theme: "Dizzy", role: "Visual", name: "Dizzy", desc: LOREM },
  { theme: "Lumiere", role: "Dekorasi", name: "Lumiere", desc: LOREM },
  { theme: "Mirror", role: "Dokumentasi", name: "Mirror", desc: LOREM },
  { theme: "Raven", role: "Medsos", name: "Raven", desc: LOREM },
  { theme: "Relic", role: "Perlengkapan", name: "Relic", desc: LOREM },
  { theme: "Fairies", role: "Liaison Officer", name: "Fairies", desc: LOREM },
  { theme: "Knights", role: "Keamanan", name: "Knights", desc: LOREM },
  { theme: "Enchanted", role: "Website", name: "Enchanted", desc: LOREM },
];