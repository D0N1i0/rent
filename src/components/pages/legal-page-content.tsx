// src/components/pages/legal-page-content.tsx
import type { LegalPage } from "@prisma/client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface LegalPageContentProps {
  page: LegalPage;
  whatsappNumber?: string;
  supportEmail?: string;
  locale?: "en" | "al";
}

// Simple markdown-to-HTML renderer for legal content
function renderMarkdown(content: string): string {
  let result = content
    // Headers
    .replace(/^# (.+)$/gm, '<h1 class="font-display text-3xl font-bold text-navy-900 mt-8 mb-4 first:mt-0">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-xl text-navy-900 mt-8 mb-3 border-b border-gray-100 pb-2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-lg text-navy-900 mt-5 mb-2">$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-navy-900">$1</strong>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="flex items-start gap-2 text-gray-600 mb-1"><span class="text-crimson-500 mt-1.5 shrink-0">•</span><span>$1</span></li>')
    // Table rows — mark separator rows (---|---) to skip them
    .replace(/^\|[\s\-:|]+\|$/gm, '')
    // Table rows (data)
    .replace(/^\|(.+)\|$/gm, (_match, cells) => {
      const cols = cells.split('|').map((c: string) => c.trim());
      return `<tr class="border-b border-gray-100">${cols.map((c: string) => `<td class="py-2 px-3 text-sm text-gray-700">${c}</td>`).join('')}</tr>`;
    })
    // Paragraphs (skip lines that are already HTML tags)
    .replace(/^(?!<[h1-6|li|tr|td|ul|$])(.+)$/gm, '<p class="text-gray-600 leading-relaxed mb-3">$1</p>')
    // List wrapper
    .replace(/(<li .+?<\/li>\n?)+/g, '<ul class="my-3 space-y-1 ml-2">$&</ul>');

  // Wrap consecutive <tr> blocks in a <table>
  result = result.replace(/(<tr[\s\S]*?<\/tr>\n?)+/g, (tableRows) =>
    `<div class="overflow-x-auto my-4"><table class="w-full border border-gray-200 rounded-lg overflow-hidden">${tableRows}</table></div>`
  );

  return result;
}

export function LegalPageContent({ page, whatsappNumber = "38344123456", supportEmail = "info@autokos.com", locale = "en" }: LegalPageContentProps) {
  const isAl = locale === "al";

  // Strip any "Last updated" lines from content to avoid duplicate dates (date shown in header).
  // Handles plain text, bold (**Last updated: ...**), and Albanian equivalents.
  const cleanedContent = page.content
    .replace(/^\*{0,2}(Last updated|Përditësuar)[:\s].+\*{0,2}$/gim, "")
    .trim();
  const htmlContent = renderMarkdown(cleanedContent);

  const lastUpdatedLabel = isAl ? "Përditësuar më:" : "Last updated:";
  const homeLabel = isAl ? "Kryefaqja" : "Home";
  const questionsLabel = isAl ? "Keni pyetje rreth kësaj politike?" : "Questions about this policy?";
  const contactDesc = isAl
    ? "Kontaktoni ekipin tonë — jemi të lumtur t'ju shpjegojmë gjithçka në gjuhë të thjeshtë."
    : "Contact our team — we're happy to explain anything in plain language.";
  const emailLabel = isAl ? "Na Shkruani" : "Email Us";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy-900 py-12">
        <div className="page-container">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <Link href="/" className="hover:text-white transition-colors">{homeLabel}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">{page.title}</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white">{page.title}</h1>
          <p className="text-gray-400 text-sm mt-2">
            {lastUpdatedLabel} {new Date(page.updatedAt).toLocaleDateString(isAl ? "sq-AL" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className="page-container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12">
            <div
              className="prose-custom"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>

          <div className="mt-8 p-6 bg-navy-900 rounded-2xl text-white text-center">
            <p className="font-bold mb-2">{questionsLabel}</p>
            <p className="text-gray-300 text-sm mb-4">{contactDesc}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href={`mailto:${supportEmail}`} className="btn-primary text-sm px-5 py-2.5">{emailLabel}</a>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-white/30 text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-white/10 transition-colors">WhatsApp</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
