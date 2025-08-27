import React, { useState } from "react";
import * as XLSX from "xlsx";
import { FaTrash, FaBolt, FaPuzzlePiece, FaLock } from "react-icons/fa";
import { pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const dashboards = [
  { icon: <FaBolt size={32} />, title: "Rápido", description: "Carregue e processe os seus ficheiros em segundos. Analise os dados sem esperas e ganhe tempo para decisões importantes." },
  { icon: <FaPuzzlePiece size={32} />, title: "Simples", description: "Tudo num só lugar: carregamento, pré-visualização e exportação. Automatize tarefas complexas com um clique." },
  { icon: <FaLock size={32} />, title: "Seguro", description: "Os seus dados permanecem privados e protegidos. Toda a automação cumpre as melhores práticas de segurança." }
];

const validExtensions = [".csv", ".txt", ".json", ".xlsx", ".pdf"];

export default function App() {
  const [jsonInput, setJsonInput] = useState("");
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [filesData, setFilesData] = useState([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [relations, setRelations] = useState({});
  const [autoRelations, setAutoRelations] = useState({});

  // Funções de parse
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
      const lines = text.split(/\r\n|\n/);
      return { headers: ["Conteúdo"], rows: lines.map((l) => [l]) };
    } catch {
      const lines = text.split(/\r\n|\n/);
      return { headers: ["Conteúdo"], rows: lines.map((l) => [l]) };
    }
  };

  const parseTXT = (text) => {
    const lines = text.split(/\r\n|\n/);
    return { headers: ["Conteúdo"], rows: lines.map((l) => [l]) };
  };

  const parseXLSX = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = json[0] || [];
    const rows = json.slice(1);
    return { name: file.name, headers, rows };
  };

  const parsePDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    let textItems = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      textItems.push(content.items.map((item) => item.str).join(" "));
    }
    return { name: file.name, headers: ["Conteúdo"], rows: textItems.map((t) => [t]) };
  };

  const handleFileUpload = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    // Verificar ficheiros não suportados
    const invalidFile = selected.find(f => !validExtensions.some(ext => f.name.toLowerCase().endsWith(ext)));
    if (invalidFile) {
      setUploadMessage("Ficheiro não suportado");
      return;
    }
    setUploadMessage("");

    const parsedFiles = await Promise.all(selected.map(async (file) => {
      const ext = file.name.split(".").pop().toLowerCase();
      if (ext === "csv") return { ...parseCSV(await file.text()), name: file.name };
      if (ext === "txt") return { ...parseTXT(await file.text()), name: file.name };
      if (ext === "json") return { ...parseJSON(await file.text()), name: file.name };
      if (ext === "xlsx") return await parseXLSX(file);
      if (ext === "pdf") return await parsePDF(file);
      return { name: file.name, headers: ["Aviso"], rows: [["Formato não suportado"]] };
    }));

    setFilesData(prev => [...prev, ...parsedFiles]);
    e.target.value = "";
  };

  const removeFile = (name) => setFilesData(prev => prev.filter(f => f.name !== name));
  const removeAll = () => { setFilesData([]); setRelations({}); setAutoRelations({}); };

  const setRelationForFile = (fileName, col) => {
    setRelations(prev => ({ ...prev, [fileName]: col }));
  };

  const autoRelateFiles = () => {
    let newAutoRelations = {};
    filesData.forEach(fileA => {
      const others = filesData.filter(f => f.name !== fileA.name);
      others.forEach(fileB => {
        const commonCols = fileA.headers?.filter(h => fileB.headers?.includes(h)) || [];
        if (commonCols.length) {
          newAutoRelations[fileA.name] = { columns: commonCols, table: fileB.name };
        } else {
          newAutoRelations[fileA.name] = { columns: [], table: fileB.name };
        }
      });
    });
    setAutoRelations(newAutoRelations);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 via-green-100 to-purple-200 p-6">
      {/* Top bar */}
      <div className="flex justify-between items-center p-3 shadow-md bg-white rounded-b-xl mb-6">
        <a href="https://www.klinosinsight.com" target="_blank" rel="noopener noreferrer" className="font-bold text-xl">Klinos Insight</a>
        <nav className="flex gap-4">
          <span className="cursor-pointer hover:underline">Início</span>
          <span className="cursor-pointer hover:underline">Serviços</span>
          <span className="cursor-pointer hover:underline">Pagamento</span>
          <span className="cursor-pointer hover:underline">Resultado</span>
        </nav>
      </div>

      {/* Central logo */}
      <header className="text-center my-4">
        <h1 className="text-4xl font-bold">Klinos Insight - App</h1>
        <p className="mt-2 text-gray-700 text-base">Automação inteligente: menos tempo em tarefas, mais tempo em resultados.</p>
      </header>

      {/* Dashboards */}
      <section className="flex flex-col md:flex-row justify-center gap-6 mb-8">
        {dashboards.map((d, i) => (
          <div key={i} className="flex-1 bg-gradient-to-br from-blue-500 to-purple-400 rounded-2xl p-6 text-white text-center shadow-md hover:scale-105 transition">
            <div className="mb-3">{d.icon}</div>
            <h2 className="text-xl font-bold mb-2">{d.title}</h2>
            <p className="text-base">{d.description}</p>
          </div>
        ))}
      </section>

      {/* JSON editor */}
      <div className={`bg-white p-4 rounded-xl mb-4 ${jsonExpanded ? "h-64" : "h-24"} transition-all`}>
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">Colar ou editar JSON</span>
          <button onClick={() => setJsonExpanded(!jsonExpanded)} className="bg-blue-500 text-white px-2 py-1 rounded">{jsonExpanded ? "Reduzir" : "Expandir"}</button>
        </div>
        <textarea
          className="w-full h-full p-2 border rounded"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
      </div>

      {/* Upload files */}
      <div className="bg-white p-4 rounded-xl mb-4">
        <label className="font-semibold block mb-2">Carregar ficheiro - .csv, .txt, .json, .xlsx, .pdf</label>
        <input type="file" multiple onChange={handleFileUpload} className="mb-2" />
        <div className="flex justify-between items-center">
          <span>{filesData.length ? `${filesData.length} ficheiro(s) selecionado(s)` : uploadMessage || "Nenhum ficheiro selecionado"}</span>
          <button onClick={removeAll} className="bg-red-500 text-white px-2 py-1 rounded">Apagar todos</button>
        </div>
      </div>

      {/* Pre-visualização */}
      <div className="bg-white p-4 rounded-xl mb-4">
        {filesData?.map((file, idx) => (
          <div key={idx} className="border-b border-gray-200 mb-2 pb-2">
            <div className="flex justify-between items-center mb-1">
              <span>{file.name} ({file.headers?.length} colunas, {file.rows?.length} linhas)</span>
              <FaTrash className="cursor-pointer" onClick={() => removeFile(file.name)} />
            </div>
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="bg-gray-200">
                  {file.headers?.map((h, i) => <th key={i} className="border px-1">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {file.rows?.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    {row.map((c, j) => <td key={j} className="border px-1">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Relacionar colunas */}
      <div className="bg-white p-4 rounded-xl mb-4">
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Relacionar colunas</span>
          {filesData.length > 1 && (
            <button onClick={autoRelateFiles} className="bg-green-500 text-white px-2 py-1 rounded">Relacionar automaticamente</button>
          )}
        </div>
        {filesData?.map((file, idx) => (
          <div key={idx} className="mb-2 border-b border-gray-200 pb-1">
            <div>{file.name}</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {(relations[file.name] || autoRelations[file.name]?.columns || []).map((col, i) => (
                <span key={i} className="bg-blue-200 px-2 py-0.5 rounded">{col}</span>
              ))}
              {autoRelations[file.name]?.table && (
                <span className="text-gray-500 ml-2">(Tabela: {autoRelations[file.name].table})</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botão Serviços fixo */}
      <a href="#servicos" className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">Serviços</a>

      {/* Footer */}
      <footer className="text-center mt-6 text-xs text-gray-500">2025 Klinos Insight</footer>
    </div>
  );
}
