import "leaflet/dist/leaflet.css";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata = {
  title: "USA Attractions",
  description: "Explore attractions across the United States",
  manifest: "/manifest.webmanifest",
  themeColor: "#244f30"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><ServiceWorkerRegister />{children}</body>
    </html>
  );
}
