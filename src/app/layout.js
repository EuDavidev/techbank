import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "TechBank | Sistema de Gerenciamento Bancário",
  description: "Plataforma moderna de gestão de contas bancárias com validação integral das regras de negócio RN01 a RN10.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${sora.className} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
