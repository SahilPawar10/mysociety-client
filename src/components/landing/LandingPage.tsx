"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// ponytail: set this before sharing the page; the demo buttons open WhatsApp with this number (country code, no +).
const WHATSAPP_NUMBER = "919764804327";

export type Lang = "en" | "mr";

const T = {
  en: {
    nav: { features: "Features", how: "How it works", faq: "FAQ", signin: "Sign in" },
    badge: "Made for Indian housing societies",
    title: "Your society's maintenance, accounts and people — all in one place",
    subtitle:
      "Set maintenance your way and change it anytime. See who has paid and who hasn't. Keep every credit and debit transparent. Manage owners, tenants, families, staff and vendors — no more manual calculation.",
    demo: "Book a free demo",
    signin: "Sign in",
    demoMessage: "Hi, I would like a demo of MySociety for our society.",
    trust: ["No manual calculation", "Secure email & Google login", "Mobile app coming soon"],
    mock: {
      title: "Maintenance · October",
      collected: "Collected",
      paid: "Paid",
      pending: "Pending",
      receipt: "Receipt ready",
      tabs: ["Maintenance setup", "Collection", "Accounts"],
      setupTitle: "Maintenance structure",
      edit: "Edit",
      heads: ["Service charges", "Sinking fund", "Repair fund", "Water charges"],
      total: "Total per flat",
      balance: "Society balance",
      credits: "Credits",
      debits: "Debits",
      thisMonth: "This month",
      entries: ["Maintenance · A-101", "Security salary", "Waste management", "Water tanker"],
    },
    painTitle: "Sound familiar?",
    pains: [
      "Hours spent calculating maintenance on paper and Excel",
      "No clear list of who has paid and who hasn't",
      "Members asking “where did our money go?”",
      "Staff details and salaries scattered across diaries",
    ],
    painAnswer: "MySociety fixes all of it — in one place.",
    featuresTitle: "Everything your society needs",
    featuresSubtitle: "Built around how committees in Maharashtra actually work.",
    features: [
      ["Maintenance, your way", "Create your own maintenance heads — sinking fund, repairs, water, parking, anything — and edit them anytime."],
      ["Who paid, who didn't", "Paid and pending for every flat at a glance. Totals are calculated for you, so nothing is missed."],
      ["Instant PDF receipts", "Professional receipts with names in Marathi or English, ready to download and share."],
      ["Transparent accounts", "Society balance, every credit and every debit, and the balance sheet — always up to date and easy to show members."],
      ["Owners, tenants & families", "Complete records for every flat — owner, tenant and family members. Import from Excel in minutes."],
      ["Staff & salaries", "Security, housekeeping and other staff with personal details and salary. When someone leaves and a new person joins, the history stays."],
      ["Vendors & services", "Waste management, water supply, lift, electricity and more — vendor details, payments and printable vouchers."],
      ["Complaint help desk", "Residents raise complaints from their phone; the committee tracks each one till it is resolved."],
      ["Asset register", "Keep track of society assets — pumps, generators, CCTV, furniture and more."],
    ],
    howTitle: "Live in 3 simple steps",
    steps: [
      ["Set up your society", "Wings, flats and your own maintenance structure."],
      ["Import your members", "Upload your existing Excel list of owners and tenants — no retyping."],
      ["Start collecting", "Generate bills, record payments, share receipts. Residents log in with their email."],
    ],
    rolesTitle: "One platform, two views",
    roles: [
      ["For the committee", ["Set and edit maintenance anytime", "See who paid and who is pending", "Society balance, credits and debits", "Staff salaries and vendor records", "Owner, tenant and family details"]],
      ["For residents", ["See your maintenance bills and dues", "Download receipts anytime", "Raise complaints from your phone", "Society staff contacts"]],
    ],
    whyTitle: "Why societies choose MySociety",
    why: [
      ["Saves hours", "Bills, totals and dues are calculated automatically. No more month-end calculation."],
      ["Full transparency", "Every rupee in and out is recorded, so the committee can answer any member with facts."],
      ["Marathi & English", "Names, receipts and vouchers in the language your members read."],
      ["Safe & private", "Secure sign-in. Each society sees only its own data, each resident only their own."],
    ],
    faqTitle: "Frequently asked questions",
    faqs: [
      ["Can we set maintenance the way our society calculates it?", "Yes. You create your own maintenance heads and amounts, and you can edit them anytime."],
      ["What happens when a security guard or staff member changes?", "Add the new person and mark the old one as left. Their details and salary history stay on record."],
      ["Can we see who hasn't paid maintenance?", "Yes. Paid and pending are shown flat by flat, with totals calculated for you."],
      ["Is there a mobile app?", "A mobile app is on the way. Meanwhile MySociety works in any phone or computer browser."],
      ["We already have our data in Excel. Can we move it?", "Yes. Flats and members can be imported directly from Excel, so you don't have to type everything again."],
      ["Is our society's data safe?", "Yes. Sign-in is secure, every society's data is kept separate, and residents can only see what is meant for them."],
    ],
    ctaTitle: "Ready to stop calculating and start managing?",
    ctaSubtitle: "See MySociety with your own society's flow. Free demo, no obligation.",
    footer: "Smart housing society management",
  },
  mr: {
    nav: { features: "वैशिष्ट्ये", how: "कसे काम करते", faq: "प्रश्नोत्तरे", signin: "लॉगिन" },
    badge: "भारतीय गृहनिर्माण सोसायट्यांसाठी खास",
    title: "सोसायटीचा मेंटेनन्स, हिशोब आणि माणसं — सर्व एकाच ठिकाणी",
    subtitle:
      "तुमच्या पद्धतीने मेंटेनन्स ठरवा आणि कधीही बदला. कोणी भरले, कोणी नाही ते लगेच पाहा. प्रत्येक जमा-खर्च पारदर्शक ठेवा. मालक, भाडेकरू, कुटुंबीय, कर्मचारी आणि व्हेंडर सांभाळा — हाताने हिशोब करण्याची गरज नाही.",
    demo: "मोफत डेमो बुक करा",
    signin: "लॉगिन करा",
    demoMessage: "नमस्कार, आमच्या सोसायटीसाठी MySociety चा डेमो हवा आहे.",
    trust: ["हाताने हिशोब नको", "ईमेल व Google ने सुरक्षित लॉगिन", "मोबाईल ॲप लवकरच"],
    mock: {
      title: "मेंटेनन्स · ऑक्टोबर",
      collected: "जमा",
      paid: "भरले",
      pending: "बाकी",
      receipt: "पावती तयार",
      tabs: ["मेंटेनन्स रचना", "वसुली", "हिशोब"],
      setupTitle: "मेंटेनन्स रचना",
      edit: "बदला",
      heads: ["सेवा शुल्क", "सिंकिंग फंड", "दुरुस्ती निधी", "पाणी शुल्क"],
      total: "प्रति फ्लॅट एकूण",
      balance: "सोसायटी शिल्लक",
      credits: "जमा",
      debits: "खर्च",
      thisMonth: "या महिन्यात",
      entries: ["मेंटेनन्स · A-101", "सिक्युरिटी पगार", "कचरा व्यवस्थापन", "पाण्याचा टँकर"],
    },
    painTitle: "हे तुमच्या सोसायटीतही होतं का?",
    pains: [
      "कागद आणि Excel वर मेंटेनन्सचा हिशोब करण्यात तासन्तास जातात",
      "कोणी मेंटेनन्स भरला आणि कोणी नाही, याची स्पष्ट यादी नाही",
      "सदस्य विचारतात — “आमचे पैसे कुठे गेले?”",
      "कर्मचाऱ्यांची माहिती आणि पगार वेगवेगळ्या डायऱ्यांमध्ये",
    ],
    painAnswer: "MySociety हे सगळे प्रश्न एकाच ठिकाणी सोडवते.",
    featuresTitle: "सोसायटीला लागणारे सर्व काही",
    featuresSubtitle: "महाराष्ट्रातील सोसायटी कमिटी प्रत्यक्षात जसे काम करतात, तसेच बनवलेले.",
    features: [
      ["तुमच्या पद्धतीने मेंटेनन्स", "सिंकिंग फंड, दुरुस्ती, पाणी, पार्किंग — तुम्हाला हवे ते मेंटेनन्स घटक ठरवा आणि कधीही बदला."],
      ["कोणी भरले, कोणी नाही", "प्रत्येक फ्लॅटचे भरलेले आणि बाकी एका नजरेत. एकूण रक्कम आपोआप मोजली जाते, काहीही सुटत नाही."],
      ["तात्काळ PDF पावत्या", "मराठी किंवा इंग्रजी नावांसह व्यावसायिक पावत्या, डाउनलोड आणि शेअर करण्यासाठी तयार."],
      ["पारदर्शक हिशोब", "सोसायटीची शिल्लक, प्रत्येक जमा आणि खर्च, आणि ताळेबंद — नेहमी अद्ययावत आणि सदस्यांना दाखवायला सोपे."],
      ["मालक, भाडेकरू आणि कुटुंबीय", "प्रत्येक फ्लॅटची संपूर्ण माहिती — मालक, भाडेकरू आणि कुटुंबातील सदस्य. Excel मधून काही मिनिटांत आयात करा."],
      ["कर्मचारी आणि पगार", "सिक्युरिटी, हाउसकीपिंग आणि इतर कर्मचाऱ्यांची वैयक्तिक माहिती आणि पगार. जुना कर्मचारी गेला आणि नवीन आला तरी इतिहास जपला जातो."],
      ["व्हेंडर आणि सेवा", "कचरा व्यवस्थापन, पाणीपुरवठा, लिफ्ट, वीज आणि इतर — व्हेंडरची माहिती, पेमेंट आणि छापण्यायोग्य व्हाउचर."],
      ["तक्रार निवारण", "रहिवासी फोनवरून तक्रार नोंदवतात; कमिटी ती सुटेपर्यंत पाठपुरावा करते."],
      ["मालमत्ता नोंदवही", "पंप, जनरेटर, CCTV, फर्निचर अशा सोसायटीच्या मालमत्तेची नोंद ठेवा."],
    ],
    howTitle: "फक्त 3 सोप्या पायऱ्यांमध्ये सुरू करा",
    steps: [
      ["सोसायटी सेट करा", "विंग, फ्लॅट आणि तुमची स्वतःची मेंटेनन्स रचना."],
      ["सदस्य आयात करा", "मालक आणि भाडेकरूंची सध्याची Excel यादी अपलोड करा — पुन्हा टाइप करण्याची गरज नाही."],
      ["वसुली सुरू करा", "बिल तयार करा, पेमेंट नोंदवा, पावत्या शेअर करा. रहिवासी त्यांच्या ईमेलने लॉगिन करतात."],
    ],
    rolesTitle: "एक प्लॅटफॉर्म, दोन दृष्टिकोन",
    roles: [
      ["कमिटीसाठी", ["मेंटेनन्स ठरवा आणि कधीही बदला", "कोणी भरले, कोणाचे बाकी ते पाहा", "सोसायटीची शिल्लक, जमा आणि खर्च", "कर्मचारी पगार आणि व्हेंडर नोंदी", "मालक, भाडेकरू आणि कुटुंबीयांची माहिती"]],
      ["रहिवाशांसाठी", ["तुमची मेंटेनन्स बिले आणि बाकी पाहा", "कधीही पावती डाउनलोड करा", "फोनवरून तक्रार नोंदवा", "सोसायटी कर्मचाऱ्यांचे संपर्क"]],
    ],
    whyTitle: "सोसायट्या MySociety का निवडतात",
    why: [
      ["वेळेची बचत", "बिल, एकूण रक्कम आणि बाकी आपोआप मोजली जाते. महिनाअखेरचा हिशोब संपला."],
      ["पूर्ण पारदर्शकता", "येणाऱ्या-जाणाऱ्या प्रत्येक रुपयाची नोंद, त्यामुळे कमिटी कोणत्याही सदस्याला पुराव्यासह उत्तर देऊ शकते."],
      ["मराठी आणि इंग्रजी", "सदस्यांना वाचता येईल त्या भाषेत नावे, पावत्या आणि व्हाउचर."],
      ["सुरक्षित आणि खाजगी", "सुरक्षित लॉगिन. प्रत्येक सोसायटीला फक्त स्वतःचा आणि प्रत्येक रहिवाशाला फक्त स्वतःचा डेटा दिसतो."],
    ],
    faqTitle: "नेहमी विचारले जाणारे प्रश्न",
    faqs: [
      ["आमची सोसायटी जसा मेंटेनन्स मोजते, तसाच ठरवता येईल का?", "हो. तुम्ही स्वतःचे मेंटेनन्स घटक आणि रक्कम ठरवता, आणि ते कधीही बदलू शकता."],
      ["सिक्युरिटी गार्ड किंवा कर्मचारी बदलला तर काय?", "नवीन व्यक्ती जोडा आणि जुन्याला 'सोडून गेले' म्हणून नोंदवा. त्यांची माहिती आणि पगाराचा इतिहास जपला जातो."],
      ["कोणी मेंटेनन्स भरला नाही ते पाहता येईल का?", "हो. प्रत्येक फ्लॅटनुसार भरलेले आणि बाकी दिसते, एकूण रक्कम आपोआप मोजली जाते."],
      ["मोबाईल ॲप आहे का?", "मोबाईल ॲप लवकरच येत आहे. तोपर्यंत MySociety कोणत्याही फोन किंवा कॉम्प्युटरच्या ब्राउझरमध्ये चालते."],
      ["आमचा डेटा Excel मध्ये आहे. तो आणता येईल का?", "हो. फ्लॅट आणि सदस्य थेट Excel मधून आयात करता येतात, त्यामुळे सर्व पुन्हा टाइप करावे लागत नाही."],
      ["आमच्या सोसायटीचा डेटा सुरक्षित आहे का?", "हो. लॉगिन सुरक्षित आहे, प्रत्येक सोसायटीचा डेटा वेगळा ठेवला जातो आणि रहिवाशांना फक्त त्यांच्यासाठीची माहिती दिसते."],
    ],
    ctaTitle: "हिशोब थांबवा, व्यवस्थापन सुरू करा",
    ctaSubtitle: "तुमच्या सोसायटीच्या कामकाजानुसार MySociety पाहा. मोफत डेमो, कोणतेही बंधन नाही.",
    footer: "स्मार्ट गृहनिर्माण सोसायटी व्यवस्थापन",
  },
} as const;

const FEATURE_ICONS = ["⚙️", "✅", "🧾", "📊", "👨‍👩‍👧", "👮", "🚛", "🛠️", "📦"];
const WHY_ICONS = ["⏱️", "📖", "अ", "🔒"];

const MOCK_ROWS: [string, boolean][] = [
  ["A-101", true],
  ["A-102", true],
  ["B-204", false],
  ["B-301", true],
];
const HEAD_AMOUNTS = ["700", "200", "150", "150"];
const ENTRY_AMOUNTS = ["+₹1,200", "−₹12,000", "−₹2,500", "−₹1,800"];

export default function LandingPage({ initialLang }: { initialLang: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const t = T[lang];
  const [tab, setTab] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  // Cycle the hero mock through setup → collection → accounts until the visitor picks a tab.
  useEffect(() => {
    if (!autoplay) return;
    const id = setInterval(() => setTab((n) => (n + 1) % 3), 4000);
    return () => clearInterval(id);
  }, [autoplay]);

  const switchLang = (next: Lang) => {
    setLang(next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url);
  };

  const demoHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.demoMessage)}`;

  return (
    <div
      lang={lang}
      className="min-h-screen bg-white text-slate-800"
      style={lang === "mr" ? { fontFamily: "var(--font-mukta), ui-sans-serif, sans-serif" } : undefined}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">M</span>
            <span className="font-semibold text-slate-900">MySociety</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">{t.nav.features}</a>
            <a href="#how" className="hover:text-slate-900">{t.nav.how}</a>
            <a href="#faq" className="hover:text-slate-900">{t.nav.faq}</a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-slate-200 p-0.5 text-xs font-medium" role="group" aria-label="Language">
              {(["en", "mr"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => switchLang(l)}
                  aria-pressed={lang === l}
                  className={`rounded-full px-3 py-1 transition ${
                    lang === l ? "bg-brand-600 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {l === "en" ? "EN" : "मराठी"}
                </button>
              ))}
            </div>
            <Link href="/signin" className="btn-secondary btn-sm hidden sm:inline-flex">{t.nav.signin}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-sm ring-1 ring-brand-100">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              {t.badge}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">{t.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={demoHref} target="_blank" rel="noopener noreferrer" className="btn-primary px-6 py-3 text-base">
                {t.demo} →
              </a>
              <Link href="/signin" className="btn-secondary px-6 py-3 text-base">{t.signin}</Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              {t.trust.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-100 text-xs text-brand-700">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Product mock */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-brand-200/40 blur-2xl" />
            <div className="card relative p-6">
              <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium sm:text-sm" role="tablist">
                {t.mock.tabs.map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={tab === i}
                    onClick={() => {
                      setTab(i);
                      setAutoplay(false);
                    }}
                    className={`flex-1 rounded-lg px-2 py-1.5 transition ${
                      tab === i ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="min-h-[19rem]">
                {tab === 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">{t.mock.setupTitle}</p>
                      <span className="badge bg-brand-50 text-brand-700">✎ {t.mock.edit}</span>
                    </div>
                    <ul className="mt-4 divide-y divide-slate-100">
                      {t.mock.heads.map((head, i) => (
                        <li key={head} className="flex items-center justify-between py-3 text-sm">
                          <span className="text-slate-700">{head}</span>
                          <span className="font-medium text-slate-900">₹{HEAD_AMOUNTS[i]}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-3 text-sm">
                      <span className="font-medium text-brand-800">{t.mock.total}</span>
                      <span className="font-bold text-brand-800">₹1,200</span>
                    </div>
                  </>
                )}

                {tab === 1 && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">{t.mock.title}</p>
                      <span className="badge bg-brand-50 text-brand-700">{t.mock.collected} 82%</span>
                    </div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-[82%] rounded-full bg-brand-500" />
                    </div>
                    <ul className="mt-4 divide-y divide-slate-100">
                      {MOCK_ROWS.map(([flat, paid]) => (
                        <li key={flat} className="flex items-center justify-between py-3 text-sm">
                          <span className="font-medium text-slate-700">{flat}</span>
                          <span className="text-slate-500">₹1,200</span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {paid ? t.mock.paid : t.mock.pending}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {tab === 2 && (
                  <>
                    <p className="text-sm text-slate-500">{t.mock.balance}</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">₹85,400</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-emerald-50 px-3 py-2">
                        <p className="text-emerald-700">{t.mock.credits} · {t.mock.thisMonth}</p>
                        <p className="font-semibold text-emerald-800">+₹38,400</p>
                      </div>
                      <div className="rounded-lg bg-red-50 px-3 py-2">
                        <p className="text-red-700">{t.mock.debits} · {t.mock.thisMonth}</p>
                        <p className="font-semibold text-red-800">−₹21,500</p>
                      </div>
                    </div>
                    <ul className="mt-3 divide-y divide-slate-100">
                      {t.mock.entries.map((entry, i) => (
                        <li key={entry} className="flex items-center justify-between py-2.5 text-sm">
                          <span className="text-slate-700">{entry}</span>
                          <span
                            className={`font-medium ${ENTRY_AMOUNTS[i].startsWith("+") ? "text-emerald-700" : "text-red-700"}`}
                          >
                            {ENTRY_AMOUNTS[i]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
            <div className="card absolute -bottom-6 -left-4 flex items-center gap-3 px-4 py-3 md:-left-8">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">🧾</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{t.mock.receipt}</p>
                <p className="text-xs text-slate-500">A-101 · PDF</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-900 md:text-3xl">{t.painTitle}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.pains.map((pain) => (
            <div key={pain} className="rounded-2xl border border-red-100 bg-red-50/50 p-5 text-slate-700">
              <span className="text-lg">😩</span>
              <p className="mt-2 leading-relaxed">{pain}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-lg font-semibold text-brand-700">{t.painAnswer}</p>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 bg-canvas py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">{t.featuresTitle}</h2>
            <p className="mt-3 text-slate-600">{t.featuresSubtitle}</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.features.map(([title, body], i) => (
              <div key={title} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-xl text-brand-700">
                  {FEATURE_ICONS[i]}
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-16 mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">{t.howTitle}</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {t.steps.map(([title, body], i) => (
            <div key={title} className="relative rounded-2xl border border-slate-200 p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-600 font-bold text-white">{i + 1}</span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="bg-brand-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">{t.rolesTitle}</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {t.roles.map(([title, items]) => (
              <div key={title} className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
                <h3 className="text-xl font-semibold">{title}</h3>
                <ul className="mt-5 space-y-3">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-brand-100">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500 text-xs text-white">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">{t.whyTitle}</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.why.map(([title, body], i) => (
            <div key={title} className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-2xl font-bold text-brand-700">
                {WHY_ICONS[i]}
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 bg-canvas py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">{t.faqTitle}</h2>
          <div className="mt-10 space-y-3">
            {t.faqs.map(([q, a]) => (
              <details key={q} className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-slate-900">
                  {q}
                  <span className="text-xl text-brand-600 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-14 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold md:text-4xl">{t.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100">{t.ctaSubtitle}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={demoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-white px-6 py-3 text-base text-brand-800 shadow-sm hover:bg-brand-50"
            >
              {t.demo} →
            </a>
            <Link href="/signin" className="btn px-6 py-3 text-base text-white ring-1 ring-white/40 hover:bg-white/10">
              {t.signin}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-600 text-xs font-bold text-white">M</span>
            <span className="font-medium text-slate-700">MySociety</span>
            <span>· {t.footer}</span>
          </div>
          <span>© {new Date().getFullYear()} MySociety</span>
        </div>
      </footer>
    </div>
  );
}
