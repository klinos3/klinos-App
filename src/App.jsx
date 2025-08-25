import React, { useState } from "react";
import * as XLSX from "xlsx";
import { pdfjsLib } from "pdfjs-dist/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
          } catch (err) {
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
              const rows = parsed.map((o) => headers.map((h) => (o[h] === undefined ? "" : String(o[h]))));
              setPreviews((prev) => ({ ...prev, [file.name]: [headers, ...rows] }));
              return;
            }
          } catch (_) {}
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-200 p-6">
      <header className="text-center my-4">
        <a href="https://www.klinosinsight.com" target="_blank" rel="noopener noreferrer" className="text-4xl font-bold text-blue-800 hover:underline">
          Klinos Insight
        </a>
        <p className="mt-2 text-gray-700">
          Automação inteligente: menos tempo em tarefas, mais tempo em resultados.
        </p>
      </header>

      <section className="flex flex-col md:flex-row justify-center gap-6 mb-8">
        {["⚡ Rápido", "🧩 Simples", "🔒 Seguro"].map((text, idx) => (
          <div key={idx} className="bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl p-6 flex-1 text-white text-center shadow-md hover:scale-105 transition transform">
            <p className="text-2xl font-bold">{text}</p>
          </div>
        ))}
      </section>

      <section className="bg-white p-6 rounded-xl max-w-5xl mx-auto mb-10 shadow-sm">
        <div className="p-4 border rounded bg-blue-50 mb-4">
          <label className="text-gray-800 font-semibold mb-2 block">Carregar ficheiro</label>
          <input type="file" multiple accept=".csv,.txt,.json,.xlsx,.pdf" onChange={handleFileUpload} />
        </div>

        {files.map((f, idx) => (
          <div key={idx} className="mb-4 border rounded p-3 bg-white">
            <div className="flex justify-between items-center border-b pb-2 mb-2">
              <p className="font-semibold text-gray-800">{f.name}</p>
              <button onClick={() => removeFile(f.name)} className="text-red-600 hover:text-red-800">🗑️</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <tbody>
                  {(previews[f.name] || []).slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {row.map((cell, cIdx) => <td key={cIdx} className="px-2 py-1 border text-sm">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
