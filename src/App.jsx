import React, { useState } from "react";

/* ------------------------------------------------------------------
  App.jsx
  - Mantém o layout que combinámos.
  - Nota: para já não trazemos xlsx/pdf libs para evitar erros de build.
------------------------------------------------------------------ */

const cards = [
  {
    icon: "⚡",
    title: "Rápido",
    description:
      "Carregue e processe os seus ficheiros em segundos. Analise os dados sem esperas e ganhe tempo para decisões importantes.",
  },
  {
    icon: "🧩",
    title: "Simples",
    description:
      "Tudo num só lugar: carregamento, pré-visualização e exportação. Automatize tarefas complexas com um clique.",
  },
  {
    icon: "🔒",
    title: "Seguro",
    description:
      "Os seus dados permanecem privados e protegidos. Toda a automação cumpre as melhores práticas de segurança.",
  },
];

export default function App() {
  // ficheiros carregados (cada objecto: { name, headers: [], rows: [] })
  const [filesData, setFilesData] = useState([]);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [relations, setRelations] = useState({}); // { filename: selectedColumn }

  const parseCSV = (text) => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.length);
    const headers = lines.length ? lines[0].split(",").map(h => h.trim()) : [];
    const rows = lines.slice(1).map((r) => r.split(",").map(c => c.trim()));
    return { headers, rows };
  };

  const parseJSONText = (text) => {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === "object") {
        const headers = Object.keys(parsed[0]);
        const rows = parsed.map((o) => headers.map((h) => (o[h] === undefined ? "" : String(o[h]))));
        return { headers, rows };
      }
    } catch (_) {}
    const lines = text.split(/\r\n|\n/).slice(0, 200);
    return { headers: ["Conteúdo"], rows: lines.map(l => [l]) };
  };

  const parseTXT = (text) => {
    const lines = text.split(/\r\n|\n/).slice(0, 200);
    return { headers: ["Conteúdo"], rows: lines.map(l => [l]) };
  };

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files || []);
    if (!uploadedFiles.length) return;

    const parsed = await Promise.all(
      uploadedFiles.map((file) =>
        new Promise((resolve) => {
          const name = file.name;
          const lower = name.toLowerCase();
          const reader = new FileReader();

          if (lower.endsWith(".csv")) {
            reader.onload = (ev) => resolve({ name, ...parseCSV(ev.target.result) });
            reader.readAsText(file);
            return;
          }

          if (lower.endsWith(".json")) {
            reader.onload = (ev) => resolve({ name, ...parseJSONText(ev.target.result) });
            reader.readAsText(file);
            return;
          }

          if (lower.endsWith(".txt")) {
            reader.onload = (ev) => resolve({ name, ...parseTXT(ev.target.result) });
            reader.readAsText(file);
            return;
          }

          // XLSX / PDF: por agora devolve aviso (integraremos depois)
          if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
            resolve({
              name,
              headers: ["Aviso"],
              rows: [["Pré-visualização XLSX será ativada na próxima etapa."]],
            });
            return;
          }
          if (lower.endsWith(".pdf")) {
            resolve({
              name,
              headers: ["Aviso"],
              rows: [["Pré-visualização PDF será ativada na próxima etapa."]],
            });
            return;
          }

          // fallback -> ler como texto
          reader.onload = (ev) => resolve({ name, ...parseTXT(ev.target.result) });
          reader.readAsText(file);
        })
      )
    );

    setFilesData((prev) => [...prev, ...parsed]);
    e.target.value = ""; // permite re-upload do mesmo ficheiro
  };

  const removeFile = (name) => {
    setFilesData((prev) => prev.filter((f) => f.name !== name));
    setRelations((prev) => { const c = { ...prev }; delete c[name]; return c; });
  };

  const removeAll = () => {
    setFilesData([]);
    setRelations({});
  };

  const setRelationForFile = (fileName, col) => {
    setRelations((prev) => ({ ...prev, [fileName]: col }));
  };

  return (
    <div className="min-h-screen p-6 bg-white">
      {/* Top bar */}
      <div className="bg-white/80 flex justify-between items-center p-3 rounded-xl mb-6 shadow-sm">
        <div /> {/* placeholder left to keep logo centered */}
        <div className="text-sm flex gap-6">
          <a className="font-medium hover:underline cursor-pointer">Início</a>
          <a className="font-medium hover:underline cursor-pointer">Serviços</a>
          <a className="font-medium hover:underline cursor-pointer">Pagamento</a>
          <a className="font-medium hover:underline cursor-pointer">Resultado</a>
        </div>
      </div>

      {/* Header centralizado */}
      <header className="text-center mb-6">
        <a
          href="https://www.klinosinsight.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-4xl font-extrabold text-klinosBlue"
        >
          Klinos Insight
        </a>
        <p className="mt-2 text-gray-700 text-lg">
          <strong>Automação inteligente:</strong> menos tempo em tarefas, mais tempo em resultados.
        </p>
      </header>

      {/* Dashboards (texto bold, maior) */}
      <section className="flex flex-col md:flex-row gap-6 mb-8">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-blue-400 to-klinosPurple rounded-2xl p-6 flex-1 text-white text-center shadow-md transform transition hover:scale-105"
          >
            <div className="text-5xl mb-3 font-extrabold">{card.icon}</div>
            <h2 className="text-2xl font-extrabold mb-2">{card.title}</h2>
            <p className="text-base font-semibold">{card.description}</p>
          </div>
        ))}
      </section>

      {/* Área principal: JSON acima, upload e previews */}
      <section className="bg-white p-6 rounded-xl max-w-5xl mx-auto mb-10 shadow">
        {/* Colar/editar JSON (altura ~2 linhas por omissão) */}
        <div className="p-3 border-2 border-gray-300 rounded-lg bg-purple-50 mb-4">
          <div className="flex justify-between items-center">
            <label className="text-gray-800 font-medium">Colar ou editar JSON</label>
            <button
              onClick={() => setJsonExpanded(!jsonExpanded)}
              className="text-sm text-blue-700 underline"
            >
              {jsonExpanded ? "Reduzir" : "Expandir"}
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Cole aqui o JSON"
            className={`w-full p-2 mt-2 rounded text-gray-800 ${jsonExpanded ? "h-40" : "h-16"}`}
          />
        </div>

        {/* Upload */}
        <div className="p-4 border-2 border-gray-300 rounded-lg bg-blue-50 mb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="w-full md:w-2/3">
              <div className="text-gray-800 font-semibold text-lg">
                Carregar ficheiro <span className="text-sm font-normal">- .csv, .txt, .json, .xlsx, .pdf</span>
              </div>
              <input
                type="file"
                multiple
                accept=".csv,.txt,.json,.xlsx,.pdf"
                onChange={handleFileUpload}
                className="mt-2"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={removeAll} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition">
                Apagar todos
              </button>
            </div>
          </div>

          {filesData.length === 0 && <p className="text-gray-700 italic mt-3">Nenhum ficheiro selecionado</p>}
        </div>

        {/* Lista de ficheiros com preview (máx 5 linhas por ficheiro) */}
        {filesData.map((f, index) => (
          <div key={f.name + index} className="mb-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200">
              <p className="font-semibold text-gray-800">
                Ficheiro {index + 1}: {f.name} — {f.headers.length} colunas, {f.rows.length} linhas
              </p>
              <button onClick={() => removeFile(f.name)} className="text-red-600 hover:text-red-800">🗑️</button>
            </div>

            <div className="overflow-x-auto max-w-full p-3">
              <table className="min-w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-gray-100">
                    { (f.headers.length ? f.headers : ["Conteúdo"]).map((h, i) => (
                      <th key={i} className="px-2 py-1 border border-gray-200 text-gray-800 whitespace-nowrap text-sm">{h}</th>
                    )) }
                  </tr>
                </thead>
                <tbody>
                  {f.rows.slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-2 py-1 border border-gray-200 text-gray-800 text-sm whitespace-nowrap">{String(cell ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Botão Serviços */}
        <div className="flex justify-end mt-4">
          <a href="/servicos" className="bg-klinosBlue text-white rounded px-4 py-2 hover:opacity-90 transition">Serviços</a>
        </div>
      </section>

      {/* Relacionar colunas */}
      <section className="bg-white p-6 rounded-xl max-w-5xl mx-auto mb-16 shadow">
        <h3 className="text-2xl font-semibold mb-4">Relacionar colunas</h3>
        {filesData.length > 1 ? (
          <>
            {filesData.map((file) => (
              <div key={file.name} className="mb-3">
                <label className="block font-medium mb-1 text-gray-800">{file.name}</label>
                <select
                  className="border p-2 rounded w-full"
                  onChange={(e) => setRelationForFile(file.name, e.target.value)}
                  value={relations[file.name] || ""}
                >
                  <option value="">-- escolher coluna chave --</option>
                  {file.headers.map((col, i) => <option key={i} value={col}>{col}</option>)}
                </select>
              </div>
            ))}

            <div className="mt-4">
              <p className="text-sm text-gray-700">Relações guardadas (por ficheiro):</p>
              <pre className="bg-gray-50 p-2 rounded mt-2 text-sm text-gray-800">{JSON.stringify(relations, null, 2)}</pre>
            </div>
          </>
        ) : (
          <p className="text-gray-600 italic">Carregue pelo menos 2 ficheiros para relacionar colunas.</p>
        )}
      </section>
    </div>
  );
}
