import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "MySociety — Smart housing society management | सोसायटी व्यवस्थापन",
  description:
    "Maintenance bills, receipts, accounts, complaints, staff and vendors for your housing society in one place. In English and Marathi.",
};

// ?lang=mr opens straight in Marathi, so a Marathi link can be shared.
export default async function Home({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  return <LandingPage initialLang={lang === "mr" ? "mr" : "en"} />;
}
