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
      // ✅ guardamos no state

  const parsed = await Promise.all(readers);
  setFilesData((prev) => [...prev, ...parsed]);
  e.target.value = "";
};


  // Funções de parse CSV / JSON / TXT
  const parseCSV = (text) => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.length);
    if (!lines.length) return { headers: [], rows: [] };
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));
    return { headers, rows };
  };

  const parseJSON = (text) => {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data) && data.length && typeof data[0] === "object") {
        const headers = Object.keys(data[0]);
        const rows = data.map((row) => headers.map((h) => String(row[h] ?? "")));
        return { headers, rows };
      }
      const lines = text.split(/\r\n|\n/).slice(0, 200);
      return { headers: ["Conteúdo"], rows: lines.map((l) => [l]) };
    } catch {
      const lines = text.split(/\r\n|\n/).slice(0, 200);
      return { headers: ["Conteúdo"], rows: lines.map((l) => [l]) };
    }
  };

  const parseTXT = (text) => {
    const lines = text.split(/\r\n|\n/).slice(0, 200);
    return { headers: ["Conteúdo"], rows: lines.map((l) => [l]) };
  };

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
              if (Array.isArray(data) && data.length && typeof data[0] === "object") {
                const headers = Object.keys(data[0]);
                const rows = data.map((row) => headers.map((h) => String(row[h] ?? "")));
                resolve({ name, headers, rows });
              } else {
                resolve({ name, headers: ["Conteúdo"], rows: text.split(/\r\n|\n/).map((l) => [l]) });
              }
            } catch {
              resolve({ name, headers: ["Conteúdo"], rows: text.split(/\r\n|\n/).map((l) => [l]) });
            }
            return;
          }

          if (name.toLowerCase().endsWith(".txt")) {
            resolve({ name, headers: ["Conteúdo"], rows: text.split(/\r\n|\n/).map((l) => [l]) });
            return;
          }

          // XLSX e PDF - placeholder
          resolve({ name, headers: ["Aviso"], rows: [["Pré-visualização será ativada na próxima etapa."]] });
        };

        reader.readAsText(file);
      })
  );

  const parsed = await Promise.all(readers);
  setFilesData((prev) => [...prev, ...parsed]);
  e.target.value = "";
};

  reader.onload = (event) => {
  const text = event.target.result;
  const rows = text.split("\n").map((r) => r.split(","));
  const headers = rows.shift();

  // ✅ agora criamos o objeto completo já com o nome do ficheiro
  const parsed = [{
    name: file.name,   // inclui o nome do ficheiro (ex: vendas.csv)
    headers,
    rows,
  }];

  // ✅ e usamos o parsed no state
  setFilesData((prev) => [...prev, ...parsed]);

  e.target.value = "";
};

  const removeAll = () => {
    setFilesData([]);
    setRelations({});
  };

  const setRelationForFile = (fileName, col) => {
    setRelations((prev) => ({ ...prev, [fileName]: col }));
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-blue-100 to-purple-100">
      {/* Top bar: menus à direita */}
      <div className="flex justify-end p-3 mb-4 bg-white rounded-xl shadow-md">
        <nav className="flex gap-4 text-sm">
          <a className="hover:underline cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition">Início</a>
          <a className="hover:underline cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition">Serviços</a>
          <a className="hover:underline cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition">Pagamento</a>
          <a className="hover:underline cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition">Resultado</a>
        </nav>
      </div>

      {/* Nome + frase */}
      <header className="text-center my-4">
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
      <section className="flex flex-col md:flex-row justify-center gap-6 mb-8">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-blue-500 to-purple-400 rounded-2xl p-6 flex-1 text-white text-center shadow-md transform transition hover:scale-105"
          >
            <div className="text-4xl mb-3 font-bold">{card.icon}</div>
            <h2 className="text-xl font-bold mb-2">{card.title}</h2>
            <p className="text-sm" style={{ fontSize: "16px" }}>{card.description}</p>
          </div>
        ))}
      </section>

      {/* Área principal: pré-visualizar */}
      <section className="bg-white p-6 rounded-xl max-w-5xl mx-auto mb-10 shadow-sm">
        {/* Colar/editar JSON */}
        <div className="p-3 border rounded mb-4 bg-purple-50">
          <label className="text-gray-800 font-semibold">Colar ou editar JSON</label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Cole aqui o JSON"
            className="w-full p-2 mt-2 rounded h-16 text-gray-800"
          />
        </div>

        {/* Upload de ficheiros */}
        <div className="p-4 border rounded bg-blue-50 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-gray-800 font-semibold text-lg">
                Carregar ficheiro{" "}
                <span className="text-sm font-normal">
                  - .csv, .txt, .json, .xlsx, .pdf
                </span>
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
        </div>

        {/* Lista de ficheiros */}
        {filesData.map((f, index) => (
          <div key={f.name + index} className="mb-4 border rounded bg-white shadow-sm">
            <div className="flex justify-between items-center px-3 py-2 border-b">
              <p className="font-semibold text-gray-800">
                {index + 1}. {f.name} - {f.headers.length} colunas, {f.rows.length.toLocaleString()} linhas
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
                      <th key={i} className="px-2 py-1 border text-sm whitespace-nowrap">
                        {h}
                      </th>
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

        {/* Botão Serviços final da seção de pré-visualização */}
        {filesData.length > 0 && (
          <div className="flex justify-end mt-4">
            <a
              href="/servicos"
              className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition"
            >
              Serviços
            </a>
          </div>
        )}
      </section>

      {/* Relacionar colunas */}
      <section className="bg-white p-6 rounded-xl max-w-5xl mx-auto mb-10 shadow-sm">
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
          <p className="text-gray-600 italic">
            Carregue pelo menos 2 ficheiros para relacionar colunas.
          </p>
        )}

        {/* Mostrar relações de colunas */}
        {Object.keys(relations).length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded border">
            <h4 className="font-semibold mb-2">Colunas relacionadas:</h4>
            <ul className="text-sm">
              {Object.entries(relations).map(([file, col], idx) => (
                <li key={idx}>
                  <strong>{file}</strong> → {col || "nenhuma coluna escolhida"}
                </li>
              ))}
            </ul>
          </div>
        )}


        {/* Botão Serviços final da seção Relacionar colunas */}
        {filesData.length > 1 && (
          <div className="flex justify-end mt-4">
            <a
              href="/servicos"
              className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition"
            >
              Serviços
            </a>
          </div>
        )}
      </section>

      {/* Rodapé */}
      <footer className="text-center text-gray-600 py-2 text-[10px]">
        2025 Klinos Insight. Todos os direitos reservados.
      </footer>
    </div>
  );
}
