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
          const name = file.name;
          const reader = new FileReader();

          if (name.toLowerCase().endsWith(".csv")) {
            reader.onload = (ev) => resolve(parseCSV(ev.target.result));
            reader.readAsText(file);
            return;
          }

          if (name.toLowerCase().endsWith(".json")) {
            reader.onload = (ev) => resolve(parseJSON(ev.target.result));
            reader.readAsText(file);
            return;
          }

          if (name.toLowerCase().endsWith(".txt")) {
            reader.onload = (ev) => resolve(parseTXT(ev.target.result));
            reader.readAsText(file);
            return;
          }

          // XLSX e PDF - placeholder
          resolve({
            name,
            headers: ["Aviso"],
            rows: [["Pré-visualização será ativada na próxima etapa."]],
          });
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
    <div className="min-h-screen p-6 bg-gradient-to-b from-blue-100 to-purple-100">
      {/* Top bar */}
      <div className="flex justify-end p-3 mb-4 text-sm bg-white rounded-xl shadow-md">
        <nav className="flex gap-4">
          <a className="hover:underline cursor-pointer">Início</a>
          <a className="hover:underline cursor-pointer">Serviços</a>
          <a className="hover:underline cursor-pointer">Pagamento</a>
          <a className="hover:underline cursor-pointer">Resultado</a>
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
      <section className="bg-white p-6 rounded-xl max-w-5xl mx-auto mb-10 shadow-sm relative">
        {/* JSON / Upload */}
        {/* Mantém todo o código existente */}

        {/* Botão Serviços no fundo direito do retângulo */}
        <div className="absolute bottom-4 right-4">
          <a
            href="/servicos"
            className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition"
          >
            Serviços
          </a>
        </div>
      </section>

      {/* Relacionar colunas */}
      <section className="bg-white p-6 rounded-xl max-w-5xl mx-auto mb-10 shadow-sm relative">
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

        {/* Botão Serviços no fundo direito do retângulo */}
        <div className="absolute bottom-4 right-4">
          <a
            href="/servicos"
            className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition"
          >
            Serviços
          </a>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="text-center text-gray-600 py-6">
        2025 Klinos Insight. Todos os direitos reservados.
      </footer>
    </div>
  );
}
