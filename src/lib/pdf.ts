import type { CountItem } from "@/lib/types";
import { dateText } from "@/lib/stock";

interface Payload {
  code: string;
  createdAt: string;
  items: CountItem[];
}

function pdfEscape(v: string): string {
  return String(v)
    .replace(/[\\()]/g, "\\$&")
    .replace(/[^\x20-\x7e]/g, "?");
}

// Gera um PDF simples (comprovante de contagem) sem dependencias externas.
export function createCountPdf(payload: Payload): Blob {
  const lines = [
    "CONTAGEM DE ESTOQUE - LOJA NITEROI",
    `Codigo: ${payload.code}`,
    `Emitido em: ${dateText(payload.createdAt)}`,
    "",
    ...payload.items.map(
      (x) =>
        `${x.sku} | ${x.location} | Qtd: ${x.quantity}${
          x.expiry ? " | Val: " + x.expiry : ""
        }`
    ),
  ];

  let stream = "BT\n/F1 16 Tf\n50 790 Td\n";
  lines.forEach((line, i) => {
    stream += `(${pdfEscape(line)}) Tj\n${i === 0 ? "/F1 10 Tf\n" : ""}0 -18 Td\n`;
  });
  stream += "ET";

  let body = "%PDF-1.4\n";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  const offsets = [0];
  objects.forEach((o, i) => {
    offsets[i + 1] = body.length;
    body += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const start = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new Blob([body], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
