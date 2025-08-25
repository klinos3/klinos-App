import { useState } from "react";
import XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const cards = [
  {
    icon: "⚡",
    title: "Rápido",
    description: "Carregue e processe os seus ficheiros em segundos. Analise os dados sem esperas e ganhe tempo para decisões importantes."
  },
  {
    icon: "🧩",
    title: "Simples",
    description: "Tudo num só lugar: carregamento, pré-visualização e exportação. Automatize tarefas complexas com um clique."
  },
  {
    icon: "🔒",
    title: "Seguro",
    description: "Os seus dados permanecem privados e protegidos. Toda a automação cumpre as melhores práticas de segurança."
  }
];

export default function App() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState({});
  const [relations, setRelations] = useState({});
  const [jsonInput, setJsonInput] = useState("");

  const handleFileUpload = (event) => {
    const uploaded = Array.from(event.target.files || []);
    if (!uploaded.length) return;
    setFiles(prev => [...prev, ...uploaded]);

    uploaded.forEach(file => {
      const reader = new FileReader();

      if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target.result, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const ws = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
            setPreviews(prev => ({ ...prev, [file.name]: rows }));
          } catch (err) {
            setPreviews(prev => ({ ...prev, [file.name]: [["(erro ao ler xlsx)"]] }));
          }
        };
        reader.readAsBinaryString(file);
        return;
      }

      if (file.name.toLowerCase().endsWith(".pdf")) {
        reader.onload = async (e) => {
          try {
            const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
            const allRows = [];
            const pagesToRead = Math.min(pdf.numPages, 5);
            for (let p = 1; p <= pagesToRead; p++) {
              const page = await pdf.getPage(p);
              const txt = await page.getTextContent();
              const pageText = txt.items.map(it => it.str).join(" ");
              const candidateRows = pageText.split(/\r\n|\n/).map(r => r.trim()).filter(Boolean).slice(0, 200);
              candidateRows.forEach(r => allRows.push(r.split(/\s{2,}/).map(c => c.trim())));
            }
            setPreviews(prev => ({ ...prev, [file.name]: allRows }));
          } catch (err) {
            setPreviews(prev => ({ ...prev, [file.name]: [["(erro ao ler PDF)"]] }));
          }
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      reader.onload = (e) => {
        const txt = e.target.result;
        if (file.name.toLowerCase().endsWith(".csv")) {
          const lines = txt.split(/\r\n|\n/).filter(Boolean);
          const rows = lines.map(line => line.split(","));
          setPreviews(prev => ({ ...prev, [file.name]: rows }));
          return;
        }
        if (file.name.toLowerCase().endsWith(".json")) {
          try {
            const parsed = JSON.parse(txt);
            if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === "object") {
              const headers = Object.keys(parsed[0]);
              const rows = parsed.map(o => headers.map(h => (o[h] === undefined ? "" : String(o[h]))));
              setPreviews(prev => ({ ...prev, [file.name]: [headers, ...rows] }));
              return;
            }
          } catch (_) {}
        }
        const lines = txt.split(/\r\n|\n/).slice(0, 200).map(l => [l]);
        setPreviews(prev => ({ ...prev, [file.name]: lines }));
      };
      reader.readAsText(file);
    });
  };

  const removeFile = (fileName) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
    setPreviews(prev => {
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
    setRelations(prev => ({ ...prev, [fileName]: col }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-200 font-inter p-6 text-gray-900">
      <div className="flex justify-end p-3 mb-2">
        <div className="flex gap-4 text-sm">
          <span className="hover:underline cursor-pointer">Início</span>
          <span className="hover:underline cursor-pointer">Serviços</span>
          <span className="hover:underline cursor-pointer">Pagamento</span>
          <span className="hover:underline cursor-pointer">Resultado</span>
        </div>
      </div>

      <header className="text-center my-4">
        <a href="https://www.klinosinsight.com" target="_blank" rel="noopener noreferrer"
           className="text-4xl font-bold text-blue-800 hover:underline">Klinos Insight</a>
        <p className="mt-2 text-gray-700">
          Automação inteligente: menos tempo em tarefas, mais tempo em resultados.
        </p>
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

      <section className="bg-white p-6 rounded-xl max-w-5xl mx-auto mb-10 shadow-sm">
        <div className="p-3 border rounded mb-4 bg-purple-50">
          <label className="text-gray-800 font-medium">Colar ou editar JSON</label>
          <textarea
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
            placeholder="Cole aqui o JSON"
            className="w-full p-2 mt-2 rounded h-16 text-gray-800"
          />
        </div>

        <div className="p-4 border rounded bg-blue-50 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-gray-800 font-semibold text-lg">
                Carregar ficheiro <span className="text-sm font-normal">- .csv, .txt, .json, .xlsx, .pdf</span>
              </div>
              <input type="file" multiple accept=".csv,.txt,.json,.xlsx,.pdf" onChange={handleFileUpload} className="mt-2"/>
            </div>
            <div>
              <button onClick={removeAll} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition">Apagar todos</button>
            </div>
          </div>
          {files.length === 0 && <p className="text-gray-800 italic mt-3">Nenhum ficheiro selecionado</p>}
        </div>

        {files.map((f, index) => (
          <div key={index} className="mb-4 border rounded bg-white p-3">
            <div className="flex justify-between items-center border-b pb-2 mb-2">
              <p className="font-semibold text-gray-800">Ficheiro {index + 1}: {f.name}</p>
              <button onClick={() => removeFile(f.name)} className="text-red-600 hover:text-red-800">🗑️</button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    {(previews[f.name] && previews[f.name][0]) ? previews[f.name][0].map((h, i) => (
                      <th key={i} className="px-2 py-1 border text-left text-sm">{h}</th>
                    )) : <th className="px-2 py-1">Conteúdo</th>}
                  </tr>
                </thead>
                <tbody>
                  {(previews[f.name] || []).slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {Array.isArray(row) ? row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-2 py-1 border text-sm">{String(cell ?? "")}</td>
                      )) : <td className="px-2 py-1 border text-sm">{String(row)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className="flex justify-end mt-4">
          <a href="/servicos" className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition">Serviços</a>
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl max-w-5xl mx-auto mb-10 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Relacionar colunas</h3>
        {files.length > 1 ? (
          <>
            {files.map(file => (
              <div key={file.name} className="mb-3">
                <label className="block font-medium mb-1">{file.name}</label>
                <select className="border p-2 rounded w-full" onChange={e => setRelationForFile(file.name, e.target.value)}>
                  <option value="">-- escolher coluna chave --</option>
                  {previews[file.name] && previews[file.name][0] && previews[file.name][0].map((col, i) => (
                    <option key={i} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
            <div className="mt-4">
              <p className="text-sm text-gray-700">Relações guardadas (por ficheiro):</p>
              <pre className="bg-gray-50 p-2 rounded mt-2 text-sm">{JSON.stringify(relations, null, 2)}</pre>
            </div>
          </>
        ) : (
          <p className="text-gray-600 italic">Carregue pelo menos 2 ficheiros para relacionar colunas.</p>
        )}
      </section>
    </div>
  );
}
