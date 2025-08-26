import React, { useState } from "react";

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
  const [jsonInput, setJsonInput] = useState("");
  const [filesData, setFilesData] = useState([]);
  const [relations, setRelations] = useState({});

  // Função de upload de ficheiros
  const handleFileUpload = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const readers = selected.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          const name = file.name;

          reader.onload = (ev) => {
            const text = ev.target.result;

            if (name.toLowerCase().endsWith(".csv")) {
              const lines = text.split(/\r\n|\n/).filter((l) => l.length);
              const headers = lines[0].split(",").map((h) => h.trim());
              const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));
              resolve({ name, headers, rows });
              return;
            }

            if (name.toLowerCase().endsWith(".json")) {
              try {
                const data = JSON.parse(text);
                const headers = Object.keys(data[0] || {});
                const rows = data.map((row) => headers.map((h) => String(row[h] ?? "")));
                resolve({ name, headers, rows });
              } catch {
                resolve({ name, headers: ["Conteúdo"], rows: text.split(/\r\n|\n/).map((l) => [l]) });
              }
              return;
            }

            if (name.toLowerCase().endsWith(".txt")) {
              resolve({ name, headers: ["Conteúdo"], rows: text.split(/\r\n|\n/).map((l) => [l]) });
              return;
            }

            // Placeholder para XLSX/PDF
            resolve({ name, headers: ["Aviso"], rows: [["Pré-visualização será ativada na próxima etapa."]] });
          };

          reader.readAsText(file);
        })
    );

    const parsed = await Promise.all(readers);
    setFilesData((prev) => [...prev, ...parsed]);
    e.target.value = "";
  };

  const removeFile = (name) => {
    setFilesData((prev) => prev.filter((f) => f.name !== name));
    setRelations((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const removeAll = () => {
    setFilesData([]);
    setRelations({});
  };

  const setRelationForFile = (fileName, col) => {
    setRelations((prev) => ({ ...prev, [fileName]: col }));
  };

  return (
    <div className="min-h-screen relative" style={{ 
      background: "linear-gradient(to bottom, #ADD8FF, #A3E4B2, #C9A0FF)" 
    }}>
      {/* Top bar */}
      <div className="flex justify-end p-3 shadow-md bg-white rounded-b-xl">
        <nav className="flex gap-4 text-sm">
          <a className="hover:underline cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition">Início</a>
          <a className="hover:underline cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition">Serviços</a>
          <a className="hover:underline cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition">Pagamento</a>
          <a className="hover:underline cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition">Resultados</a>
        </nav>
      </div>

      {/* Logo e frase */}
      <header className="text-center my-6">
        <a
          href="https://www.klinosinsight.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-4xl font-bold text-brandBlue hover:underline"
        >
          Klinos Insight
        </a>
        <p className="mt-2 text-gray-700 text-base">
          <strong>Automação inteligente:</strong> menos tempo em tarefas, mais tempo em resultados.
        </p>
      </header>

      {/* Dashboards */}
      <section className="flex flex-col md:flex-row justify-center gap-6 mb-8 px-4">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="rounded-2xl p-6 flex-1 text-white text-center shadow-md transform transition hover:scale-105"
            style={{ background: "linear-gradient(to bottom left, #3B82F6, #9333EA)" }}
          >
            <div className="text-4xl mb-3 font-bold">{card.icon}</div>
            <h2 className="text-2xl font-bold mb-2">{card.title}</h2>
            <p className="text-base">{card.description}</p>
          </div>
        ))}
      </section>

      {/* JSON e upload */}
      <section className="max-w-5xl mx-auto mb-10 px-4">
        <div className="mb-4 bg-purple-50 rounded-xl p-4">
          <label className="text-gray-800 font-semibold">Colar ou editar JSON</label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Cole aqui o JSON"
            className="w-full p-2 mt-2 rounded h-24 text-gray-800"
          />
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1 bg-blue-50 rounded-xl p-4">
            <label className="text-gray-800 font-semibold text-lg">Carregar ficheiro - .csv, .txt, .json, .xlsx, .pdf</label>
            <input
              type="file"
              multiple
              accept=".csv,.txt,.json,.xlsx,.pdf"
              onChange={handleFileUpload}
              className="mt-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={removeAll}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
            >
              Apagar todos
            </button>
          </div>
        </div>

        {filesData.length === 0 && (
          <p className="text-gray-800 italic mt-3">Nenhum ficheiro selecionado</p>
        )}

        {/* Pré-visualização */}
        {filesData.map((f, idx) => (
          <div key={f.name + idx} className="mb-4 border rounded-xl bg-white shadow-sm">
            <div className="flex justify-between items-center px-3 py-2 border-b">
              <p className="font-semibold text-gray-800">
                {idx + 1}. {f.name} - {f.headers.length} colunas, {f.rows.length.toLocaleString()} linhas
              </p>
              <button
                onClick={() => removeFile(f.name)}
                className="text-red-600 hover:text-red-800"
                title="Apagar este ficheiro"
              >
                🗑️
              </button>
            </div>
            <div className="overflow-x-auto p-3">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    {f.headers.map((h, i) => (
                      <th key={i} className="px-2 py-1 border text-sm whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {f.rows.slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-2 py-1 border text-sm whitespace-nowrap">
                          {String(cell ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      {/* Relacionar colunas */}
      <section className="max-w-5xl mx-auto mb-20 px-4">
        <h3 className="text-xl font-semibold mb-4">Relacionar colunas</h3>
        {filesData.length > 1 ? (
          filesData.map((file) => (
            <div key={file.name} className="mb-3">
              <label className="block font-medium mb-1">{file.name}</label>
              <select
                className="border p-2 rounded w-full"
                onChange={(e) => setRelationForFile(file.name, e.target.value)}
                value={relations[file.name] || ""}
              >
                <option value="">-- escolher coluna chave --</option>
                {file.headers.map((col, i) => (
                  <option key={i} value={col}>{col}</option>
                ))}
              </select>
            </div>
          ))
        ) : (
          <p className="text-gray-600 italic">Carregue pelo menos 2 ficheiros para relacionar colunas.</p>
        )}
        {Object.keys(relations).length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded border">
            <h4 className="font-semibold mb-2">Colunas relacionadas:</h4>
            <ul className="text-sm">
              {Object.entries(relations).map(([file, col], idx) => (
                <li key={idx}><strong>{file}</strong> → {col || "nenhuma coluna escolhida"}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Botão Serviços sempre visível no fundo direito */}
      <a
        href="/servicos"
        className="fixed bottom-4 right-4 bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition z-50"
      >
        Serviços
      </a>

      {/* Footer */}
      <footer className="text-center text-gray-600 py-2 text-[10px]">
        2025 Klinos Insight. Todos os direitos reservados.
      </footer>
    </div>
  );
}
