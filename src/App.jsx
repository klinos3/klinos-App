import React, { useState } from "react";

// Cards de dashboards
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
  // Estados principais
  const [jsonInput, setJsonInput] = useState("");
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [filesData, setFilesData] = useState([]);
  const [relations, setRelations] = useState({});
  const [autoRelations, setAutoRelations] = useState({}); // <-- esta linha
  const [uploadMessage, setUploadMessage] = useState("Nenhum ficheiro selecionado");

  const validExtensions = [".csv", ".txt", ".json", ".xlsx", ".pdf"];

  // Função de upload
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = async (evt) => {
    let parsedData = [];

    // CSV ou TXT
    if (file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
      parsedData = Papa.parse(evt.target.result, { header: true }).data;
    }
    // JSON
    else if (file.name.endsWith(".json")) {
      parsedData = JSON.parse(evt.target.result);
    }
    // XLSX
    else if (file.name.endsWith(".xlsx")) {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    // 👉 Garante que SEMPRE tens columns e rows
    const newFile = {
      fileName: file.name,
      columns: parsedData.length > 0 ? Object.keys(parsedData[0]) : [],
      rows: parsedData
    };

    // 👉 Adiciona ao state
    setFilesData((prev) => [...prev, newFile]);
  };

  if (file.name.endsWith(".xlsx")) {
    reader.readAsBinaryString(file);
  } else {
    reader.readAsText(file);
  }
};


  // Remover ficheiro
  const removeFile = (name) => {
    setFilesData((prev) => prev.filter((f) => f.name !== name));
    setRelations((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  // Remover todos
  const removeAll = () => {
    setFilesData([]);
    setRelations({});
    setUploadMessage("Nenhum ficheiro selecionado");
  };

// Relacionar colunas manualmente
const setRelationForFile = (fileName, col, tableName = null) => {
  setRelations((prev) => {
    const prevCols = prev[fileName]?.columns || [];
    const newCols = col ? [...prevCols, col] : prevCols;
    return {
      ...prev,
      [fileName]: { columns: newCols, table: tableName || prev[fileName]?.table || "" },
    };
  });
};

// Relacionamento automático (primeira coluna comum)
const autoRelateFiles = () => {
  if (filesData.length < 2) {
    alert("Carregue pelo menos 2 ficheiros para relacionar.");
    return;
  }

  let foundRelations = {};
  let related = false;

  for (let i = 0; i < filesData.length; i++) {
    for (let j = i + 1; j < filesData.length; j++) {
      const commonCols = filesData[i].columns.filter(col =>
        filesData[j].columns.includes(col)
      );
      if (commonCols.length > 0) {
        foundRelations[filesData[i].fileName] = commonCols[0];
        foundRelations[filesData[j].fileName] = commonCols[0];
        related = true;
      }
    }
  }

  if (!related) {
    alert("Nenhuma coluna em comum encontrada entre os ficheiros.");
  }

  setAutoRelations(foundRelations);
  setRelations(foundRelations);
};





  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 via-green-100 to-purple-200 p-6">
      {/* Top bar */}
      <div className="flex justify-between items-center p-3 shadow-md bg-white rounded-b-xl mb-6">
        <a
          href="https://www.klinosinsight.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xl font-bold text-brandBlue hover:underline"
        >
          Klinos Insight
        </a>
        <nav className="flex gap-4 text-sm">
          <a className="hover:underline cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition">Início</a>
          <a className="hover:underline cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition">Serviços</a>
          <a className="hover:underline cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition">Pagamento</a>
          <a className="hover:underline cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition">Resultados</a>
        </nav>
      </div>

      {/* Header central */}
      <header className="text-center my-4">
        <a
          href="https://www.klinosinsight.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-4xl font-bold text-brandBlue hover:underline"
        >
          Klinos Insight - App
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
            className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl p-6 flex-1 text-white text-center shadow-md transform transition hover:scale-105"
          >
            <div className="text-4xl mb-3 font-bold">{card.icon}</div>
            <h2 className="text-2xl font-bold mb-2">{card.title}</h2>
            <p className="text-sm">{card.description}</p>
          </div>
        ))}
      </section>

      {/* Área JSON + Upload */}
      <section className="bg-white p-6 rounded-xl max-w-5xl mx-auto mb-10 shadow-sm">
        {/* JSON expansível */}
        <div className="mb-4 flex gap-2">
          <div className="flex-1 bg-purple-50 p-3 rounded-xl">
            <label className="font-semibold text-gray-800">Colar ou editar JSON</label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Cole aqui o JSON"
              className="w-full p-2 mt-2 rounded text-gray-800 transition-all duration-300"
              style={{ height: jsonExpanded ? "300px" : "100px" }}
            />
          </div>
          <button
            onClick={() => setJsonExpanded(!jsonExpanded)}
            className="self-start bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
          >
            {jsonExpanded ? "Reduzir" : "Expandir"}
          </button>
        </div>

        {/* Upload de ficheiros */}
        <div className="p-4 border rounded bg-blue-50 mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <div className="text-gray-800 font-semibold text-lg">
                Carregar ficheiro - .csv, .txt, .json, .xlsx, .pdf
              </div>
              <input
                type="file"
                multiple
                accept=".csv,.txt,.json,.xlsx,.pdf"
                onChange={handleFileUpload}
                className="mt-2"
              />
              <p className="text-gray-800 italic mt-2">{uploadMessage}</p>
            </div>
            <div className="flex gap-2 mt-2 md:mt-0">
              <button
                onClick={removeAll}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
              >
                Apagar todos
              </button>
            </div>
          </div>
        </div>

        {/* Lista de ficheiros carregados */}
        {filesData.map((f, idx) => (
          <div key={f.name + idx} className="mb-4 border rounded bg-white shadow-sm">
            <div className="flex justify-between items-center px-3 py-2 border-b">
              <p className="font-semibold text-gray-800">
                {idx + 1}. {f.name} - {f.headers.length} colunas, {f.rows.length.toLocaleString()} linhas
              </p>
              <button
                onClick={() => removeFile(f.name)}
                className="text-red-600 hover:text-red-800"
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

      <section className="bg-white p-6 rounded-xl max-w-5xl mx-auto mb-10 shadow-sm">
  <h3 className="text-xl font-semibold mb-4">Relacionar colunas</h3>

  {/* --- Relacionar manualmente --- */}
  <div className="mb-4">
    <h4 className="font-semibold mb-2">Relacionar manualmente</h4>
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
  </div>

  {/* --- Relacionar automaticamente --- */}
{filesData.length > 1 && (
  <div className="p-4 border rounded mb-4 relative">
    <h2 className="text-lg font-semibold mb-2">Relacionar colunas</h2>

    {/* Botão de apagar tudo */}
    <button
      onClick={() => {
        setRelations({});
        setAutoRelations({});
      }}
      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
      title="Apagar todas as relações"
    >
      🗑️
    </button>

    {/* Botão de relação automática */}
    <div className="flex justify-start mt-2 mb-4">
      <button
        onClick={autoRelateFiles}
        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
      >
        Relacionar automaticamente
      </button>
    </div>

    {/* Seleção manual */}
    {filesData.map((file) => (
      <div key={file.fileName} className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {file.fileName}
        </label>
        <select
          value={relations[file.fileName] || ""}
          onChange={(e) =>
            setRelationForFile(file.fileName, e.target.value)
          }
          className="mt-1 p-2 border rounded w-full"
        >
          <option value="">-- Selecione coluna para relacionar --</option>
          {file.columns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>
    ))}

    {/* Mostrar relações */}
    <div className="mt-4">
      <h3 className="font-medium">Colunas relacionadas:</h3>
      <ul className="list-disc ml-6">
        {Object.keys(relations).map((file) => (
          <li key={file}>
            {file} → {relations[file] || "nenhuma coluna escolhida"} (Tabela:{" "}
            {autoRelations[file] || Object.keys(relations).find((f) => f !== file) || "Sem relação"})
          </li>
        ))}
      </ul>
    </div>
  </div>
)}


</section>



      {/* Botão Serviços sempre visível no canto inferior direito */}
      <a
        href="/servicos"
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition shadow-lg"
      >
        Serviços
      </a>

      {/* Rodapé */}
      <footer className="text-center text-gray-600 py-2 text-[10px] mt-20">
        2025 Klinos Insight. Todos os direitos reservados.
      </footer>
    </div>
  );
}
