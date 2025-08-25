import React, { useState } from "react";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const cards = [
  { icon: "⚡", title: "Rápido", description: "Carregue e processe os seus ficheiros em segundos. Analise os dados sem esperas e ganhe tempo para decisões importantes." },
  { icon: "🧩", title: "Simples", description: "Tudo num só lugar: carregamento, pré-visualização e exportação. Automatize tarefas complexas com um clique." },
  { icon: "🔒", title: "Seguro", description: "Os seus dados permanecem privados e protegidos. Toda a automação cumpre as melhores práticas de segurança." },
];

export default function App() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState({});
  const [relations, setRelations] = useState({});

  const handleFileUpload = (event) => {
    const uploaded = Array.from(event.target.files || []);
    if (!uploaded.length) return;
    setFiles((prev) => [...prev, ...uploaded]);

    uploaded.forEach((file) => {
      const reader = new FileReader();

      // XLSX
      if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target.result, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const ws = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
            setPreviews((prev) => ({ ...prev, [file.name]: rows }));
          } catch {
            setPreviews((prev) => ({ ...prev, [file.name]: [["(erro ao ler xlsx)"]] }));
          }
        };
        reader.readAsBinaryString(file);
        return;
      }

      // PDF
      if (file.name.toLowerCase().endsWith(".pdf")) {
        reader.onload = async (e) => {
          try {
            const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
            const allRows = [];
            const pagesToRead = Math.min(pdf.numPages, 5);
            for (let p = 1; p <= pagesToRead; p++) {
              const page = await pdf.getPage(p);
              const txt = await page.getTextContent();
              const pageText = txt.items.map((it) => it.str).join(" ");
              const candidateRows = pageText.split(/\r\n|\n/).map((r) => r.trim()).filter(Boolean).slice(0, 200);
              candidateRows.forEach((r) => {
                const cols = r.split(/\s{2,}/).map((c) => c.trim());
                allRows.push(cols.length ? cols : [r]);
              });
            }
            setPreviews((prev) => ({ ...prev, [file.name]: allRows }));
          } catch {
            setPreviews((prev) => ({ ...prev, [file.name]: [["(erro ao ler PDF)"]] }));
          }
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      // CSV/JSON/TXT
      reader.onload = (e) => {
        const txt = e.target.result;
        if (file.name.toLowerCase().endsWith(".csv")) {
          const lines = txt.split(/\r\n|\n/).filter(Boolean);
          const rows = lines.map((line) => line.split(","));
          setPreviews((prev) => ({ ...prev, [file.name]: rows }));
          return;
        }
        if (file.name.toLowerCase().endsWith(".json")) {
          try {
            const parsed = JSON.parse(txt);
            if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === "object") {
              const headers = Object.keys(parsed[0]);
              const rows = parsed.map((o) => headers.map((h) => (o[h] ?? "")));
              setPreviews((prev) => ({ ...prev, [file.name]: [headers, ...rows] }));
              return;
            }
          } catch {}
          const lines = txt.split(/\r\n|\n/).slice(0, 200).map((l) => [l]);
          setPreviews((prev) => ({ ...prev, [file.name]: lines }));
          return;
        }
        const lines = txt.split(/\r\n|\n/).slice(0, 200).map((l) => [l]);
        setPreviews((prev) => ({ ...prev, [file.name]: lines }));
      };
      reader.readAsText(file);
    });
  };

  const removeFile = (fileName) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    setPreviews((prev) => {
      const copy = { ...prev };
      delete copy[fileName];
      return copy;
    });
  };

  const removeAll = () => {
    setFiles([]);
    setPreviews({});
    setRelations({});
  };

  const setRelationForFile = (fileName, col) => {
    setRelations((prev) => ({ ...prev, [fileName]: col }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-200 font-inter p-6 text-gray-900">
      <header className="text-center my-4">
        <a href="https://www.klinosinsight.com" target="_blank" rel="noopener noreferrer" className="text-4xl font-bold text-blue-800 hover:underline">
          Klinos Insight
        </a>
        <p className="mt-2 text-gray-700">Automação inteligente: menos tempo em tarefas, mais tempo em resultados.</p>
      </header>

      <section className="flex flex-col md:flex-row justify-center gap-6 mb-8">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl p-6 flex-1 text-white hover:scale-105 transition transform text-center shadow-md">
            <div className="text-4xl mb-3 font-bold">{card.icon}</div>
            <h2 className="text-xl font-bold mb-2">{card.title}</h2>
            <p className="text-sm font-bold">{card.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
