import React, { useState } from "react";
import { FaTrash, FaBolt, FaPuzzlePiece, FaLock } from "react-icons/fa";
import * as XLSX from "xlsx";
import * as pdfjs from "pdfjs-dist/webpack";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const validExtensions = [".csv", ".txt", ".json", ".xlsx", ".pdf"];

function App() {
  const [filesData, setFilesData] = useState([]);
  const [uploadMessage, setUploadMessage] = useState("Nenhum ficheiro selecionado");
  const [relations, setRelations] = useState({});
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [jsonContent, setJsonContent] = useState("");

  // Upload e parsing de ficheiros
  const handleFileUpload = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const invalidFile = selected.find(
      (f) => !validExtensions.some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    if (invalidFile) {
      setUploadMessage("Ficheiro não suportado");
      return;
    }

    setUploadMessage(""); 

    const readers = selected.map(
      (file) =>
        new Promise(async (resolve) => {
          const name = file.name;
          if (name.toLowerCase().endsWith(".csv") || name.toLowerCase().endsWith(".txt")) {
            const text = await file.text();
            const lines = text.split(/\r\n|\n/).filter((l) => l.length);
            const headers = lines[0].split(",").map((h) => h.trim());
            const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));
            resolve({ name, headers, rows });
            return;
          }

          if (name.toLowerCase().endsWith(".json")) {
            const text = await file.text();
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

          if (name.toLowerCase().endsWith(".xlsx")) {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
            const headers = sheet[0] || [];
            const rows = sheet.slice(1);
            resolve({ name, headers, rows });
            return;
          }

          if (name.toLowerCase().endsWith(".pdf")) {
            const data = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument({ data }).promise;
            const page = await pdf.getPage(1);
            const content = await page.getTextContent();
            const text = content.items.map((item) => item.str).join("\n");
            const lines = text.split("\n");
            resolve({ name, headers: ["Conteúdo"], rows: lines.map((l) => [l]) });
            return;
          }

          resolve({ name, headers: ["Aviso"], rows: [["Pré-visualização será ativada na próxima etapa."]] });
        })
    );

    const parsed = await Promise.all(readers);
    setFilesData((prev) => [...prev, ...parsed]);
    e.target.value = "";
  };

  // Apagar todos ficheiros
  const clearFiles = () => {
    setFilesData([]);
    setUploadMessage("Nenhum ficheiro selecionado");
    setRelations({});
  };

  // JSON expandir/reduzir
  const toggleJsonExpand = () => setJsonExpanded(!jsonExpanded);

  // Relacionamento automático: mesma coluna
  const autoRelateFiles = () => {
    const newRelations = {};
    filesData.forEach((f1) => {
      const rel = {};
      filesData.forEach((f2) => {
        if (f1.name === f2.name) return;
        const commonCols = f1.headers.filter((h) => f2.headers.includes(h));
        rel[f2.name] = commonCols;
      });
      newRelations[f1.name] = rel;
    });
    setRelations(newRelations);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 via-green-100 to-purple-200 p-6">
      {/* Topo */}
      <div className="flex justify-between items-center p-3 shadow-md bg-white rounded-b-xl mb-6">
        <a href="https://www.klinosinsight.com" className="font-bold text-lg">Klinos Insight</a>
        <div className="flex gap-6 font-medium">
          <span>Início</span>
          <span>Serviços</span>
          <span>Pagamento</span>
          <span>Resultados</span>
        </div>
      </div>

      {/* Logo e frase */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Klinos Insight - App</h1>
        <p className="text-lg">Automação inteligente: menos tempo em tarefas, mais tempo em resultados.</p>
      </div>

      {/* Dashboards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 rounded-lg shadow-lg bg-gradient-to-br from-blue-400 to-purple-500 text-white text-center">
          <FaBolt className="mx-auto mb-2 text-4xl" />
          <h3 className="text-xl font-bold mb-2">⚡ Rápido</h3>
          <p className="text-base">Carregue e processe os seus ficheiros em segundos. Analise os dados sem esperas e ganhe tempo para decisões importantes.</p>
        </div>
        <div className="p-6 rounded-lg shadow-lg bg-gradient-to-br from-blue-400 to-purple-500 text-white text-center">
          <FaPuzzlePiece className="mx-auto mb-2 text-4xl" />
          <h3 className="text-xl font-bold mb-2">🧩 Simples</h3>
          <p className="text-base">Tudo num só lugar: carregamento, pré-visualização e exportação. Automatize tarefas complexas com um clique.</p>
        </div>
        <div className="p-6 rounded-lg shadow-lg bg-gradient-to-br from-blue-400 to-purple-500 text-white text-center">
          <FaLock className="mx-auto mb-2 text-4xl" />
          <h3 className="text-xl font-bold mb-2">🔒 Seguro</h3>
          <p className="text-base">Os seus dados permanecem privados e protegidos. Toda a automação cumpre as melhores práticas de segurança.</p>
        </div>
      </div>

      {/* JSON expansível */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">Colar ou editar JSON</span>
          <button
            onClick={toggleJsonExpand}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            {jsonExpanded ? "Reduzir" : "Expandir"}
          </button>
        </div>
        <textarea
          value={jsonContent}
          onChange={(e) => setJsonContent(e.target.value)}
          rows={jsonExpanded ? 10 : 3}
          className="w-full border rounded p-2"
        />
      </div>

      {/* Upload ficheiros */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-md flex flex-col gap-4">
        <span className="font-semibold">Carregar ficheiro - .csv, .txt, .json, .xlsx, .pdf</span>
        <input type="file" multiple onChange={handleFileUpload} />
        <div className="flex justify-between items-center">
          <span>{uploadMessage}</span>
          <button
            onClick={clearFiles}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Apagar todos
          </button>
        </div>
      </div>

      {/* Pré-visualização ficheiros (6 linhas) */}
      {filesData.map((file, idx) => (
        <div key={idx} className="mb-6 p-4 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">{file.name} ({file.headers.length} colunas, {file.rows.length} linhas)</span>
            <FaTrash
              className="cursor-pointer text-red-500"
              onClick={() => setFilesData((prev) => prev.filter((_, i) => i !== idx))}
            />
          </div>
          <table className="w-full border-collapse">
            <tbody>
              {file.rows.slice(0, 6).map((row, ridx) => (
                <tr key={ridx} className={ridx % 2 === 0 ? "bg-gray-100" : ""}>
                  {row.map((col, cidx) => (
                    <td key={cidx} className="border px-2 py-1">{col}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Relacionar colunas manual e automático */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
        <h3 className="font-bold mb-2">Relacionar colunas</h3>
        <button
          onClick={autoRelateFiles}
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mb-4"
        >
          Relacionar automaticamente
        </button>
        {filesData.map((file, idx) => (
          <div key={idx} className="mb-4 border-b pb-2">
            <div className="flex justify-between items-center mb-2">
              <strong>{file.name}:</strong>
              <FaTrash
                className="cursor-pointer text-red-500"
                onClick={() => {
                  setRelations((prev) => {
                    const copy = { ...prev };
                    delete copy[file.name];
                    return copy;
                  });
                }}
              />
            </div>
            {/* Manual */}
            <div className="grid grid-cols-2 gap-4">
              {filesData
                .filter((f) => f.name !== file.name)
                .map((otherFile) => (
                  <div key={otherFile.name}>
                    <p className="font-semibold mb-1">Relacionar com {otherFile.name}:</p>
                    <div className="flex flex-wrap gap-2">
                      {otherFile.headers.map((col) => {
                        const selectedCols =
                          relations[file.name]?.[otherFile.name] || [];
                        const isSelected = selectedCols.includes(col);
                        return (
                          <button
                            key={col}
                            className={`px-2 py-1 border rounded ${
                              isSelected ? "bg-blue-500 text-white" : "bg-gray-100"
                            }`}
                            onClick={() => {
                              setRelations((prev) => {
                                const prevFile = prev[file.name] || {};
                                const cols = prevFile[otherFile.name] || [];
                                const newCols = cols.includes(col)
                                  ? cols.filter((c) => c !== col)
                                  : [...cols, col];
                                return {
                                  ...prev,
                                  [file.name]: { ...prevFile, [otherFile.name]: newCols },
                                };
                              });
                            }}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>

            {/* Mostrar colunas relacionadas */}
            <div className="mt-2">
              {Object.entries(relations[file.name] || {}).map(
                ([otherFile, cols]) => (
                  <p key={otherFile} className="text-sm">
                    {cols.length
                      ? `Colunas relacionadas com ${otherFile}: ${cols.join(", ")}`
                      : `Nenhuma coluna relacionada com ${otherFile}`}
                  </p>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botão Serviços fixo no canto inferior direito */}
      <div className="fixed bottom-4 right-4">
        <a
          href="#servicos"
          className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
        >
          Serviços
        </a>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs mt-12">
        2025 Klinos Insight
      </footer>
    </div>
  );
}

export default App;
