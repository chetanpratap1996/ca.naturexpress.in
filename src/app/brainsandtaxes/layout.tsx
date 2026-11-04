import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brains & Taxes | GPA & Co., Chartered Accountants | Indore & Pan-India Practice",
  description: "ICAI Regulated Chartered Accountancy Practice (FRN: 022998C) • Peer-Review Board Certified. Precision corporate statutory audits, Income Tax faceless appeals, GST defense, Section 43B(h) compliance, and Virtual CFO advisory in Indore & Pan-India.",
  keywords: [
    "Chartered Accountant Indore",
    "CA Gunjan Jain",
    "GPA & Co Chartered Accountants",
    "Brains and Taxes",
    "Corporate Audit Indore",
    "Tax Audit Form 3CD",
    "Income Tax Scrutiny Section 148",
    "GST DRC-01 Notice Reply",
    "Section 43Bh MSME Audit",
    "Best CA Firm YN Road Indore",
    "Peer Reviewed CA Firm India"
  ],
  openGraph: {
    title: "Brains & Taxes | GPA & Co., Chartered Accountants",
    description: "Corporate Statutory Audit, Income Tax Litigation, GST Defense & Virtual CFO Advisory. ICAI FRN: 022998C.",
    url: "https://ca.naturexpress.in/brainsandtaxes",
    siteName: "Brains & Taxes CA Practice",
    locale: "en_IN",
    type: "website",
  },
};

export default function BrainsAndTaxesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
