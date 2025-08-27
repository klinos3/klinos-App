import React, { useState } from "react";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";

export default function App() {
  const [files, setFiles] = useState([]);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [relations, setRelations] = useState([]);
  const [autoRelations, setAutoRelations] = useState([]);

  // ---- FILE HANDLER ----
  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files);
    const newFiles = [];

    for (const file of uploadedFiles) {
      const ext = file.name.split(".").pop().toLowerCase();
      if (!["csv", "txt", "json", "xlsx", "pdf"].includes(ext)) {
        newFiles.push({
          name: file.name,
          type: "unsupported",
          tables: [],
          message: "Ficheiro não suportado",
        });
        continue;
      }

      let content = "";
      let tables = [];

      if (ext === "csv" || ext === "txt") {
        content = await file.text();
        tables = parseCSV(content);
      } else if (ext === "json") {
        content = await file.text();
        try {
          const parsed = JSON.parse(content);
          tables = Array.isArray(parsed) ? [parsed] : [Object.values(parsed)];
        } catch {
          tables = [];
        }
      } else if (ext === "xlsx") {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        tables = workbook.SheetNames.map((name) => ({
          name,
          rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], {
            header: 1,
          }),
        }));
      } else if (ext === "pdf") {
        const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item) => item.str).join(" ") + "\n";
        }
        tables = [{ name: "PDF Content", rows: text.split("\n") }];
      }

      newFiles.push({
        name: file.name,
        type: ext,
        tables,
        message: "",
      });
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const parseCSV = (str) => {
    const rows = str.split("\n").map((r) => r.split(","));
    return [{ name: "CSV", rows }];
  };

  const handleClearFiles = () => setFiles([]);

  // ---- AUTO RELATIONS ----
  const handleAutoRelations = () => {
    const relationsFound = [];
    if (files.length < 2) return;

    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const fileA = files[i];
        const fileB = files[j];

        const colsA =
          fileA.tables?.[0]?.rows?.[0]?.map((c) => c.toString()) || [];
        const colsB =
          fileB.tables?.[0]?.rows?.[0]?.map((c) => c.toString()) || [];

        const common = colsA.filter((c) => colsB.includes(c));
        if (common.length > 0) {
          relationsFound.push({
            files: [fileA.name, fileB.name],
            columns: common,
          });
        }
      }
    }
    setAutoRelations(relationsFound);
  };

  // ---- JSON EXPAND ----
  const toggleJsonExpand = () => setJsonExpanded(!jsonExpanded);

  return (
    <div
      className="min-h-screen text-gray-900 flex flex-col"
      style={{
        background: "linear-gradient(to bottom, #a7d8ff, #a7ffd8, #e0b3ff)",
      }}
    >
      {/* ---- HEADER ---- */}
      <header className="flex justify-between items-center p-4 shadow-md bg-white rounded-b-lg">
        <a href="https://www.klinosinsight.com" className="font-bold text-lg">
          Klinos Insight
        </a>
        <nav className="space-x-4">
          <a href="#">Início</a>
          <a href="#">Serviços</a>
          <a href="#">Pagamento</a>
          <a href="#">Resultados</a>
        </nav>
      </header>

      {/* ---- HERO ---- */}
      <div className="text-center mt-8">
        <h1 className="text-3xl font-bold">Klinos Insight - App</h1>
        <p className="text-lg mt-2">
          Automação inteligente: menos tempo em tarefas, mais tempo em
          resultados.
        </p>
      </div>

      {/* ---- DASHBOARDS ---- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 m-8">
        <div className="p-4 rounded-2xl shadow-md bg-gradient-to-br from-blue-400 to-purple-400">
          <h2 className="font-bold">⚡ Rápido</h2>
          <p>
            Carregue e processe os seus ficheiros em segundos. Analise os dados
            sem esperas e ganhe tempo para decisões importantes.
          </p>
        </div>
        <div className="p-4 rounded-2xl shadow-md bg-gradient-to-br from-blue-400 to-purple-400">
          <h2 className="font-bold">🧩 Simples</h2>
          <p>
            Tudo num só lugar: carregamento, pré-visualização e exportação.
            Automatize tarefas complexas com um clique.
          </p>
        </div>
        <div className="p-4 rounded-2xl shadow-md bg-gradient-to-br from-blue-400 to-purple-400">
          <h2 className="font-bold">🔒 Seguro</h2>
          <p>
            Os seus dados permanecem privados e protegidos. Toda a automação
            cumpre as melhores práticas de segurança.
          </p>
        </div>
      </div>

      {/* ---- JSON ---- */}
      <div className="p-4 m-4 bg-white rounded-2xl shadow-md">
        <div className="flex justify-between">
          <label>Colar ou editar JSON</label>
          <button
            onClick={toggleJsonExpand}
            className="px-2 py-1 bg-blue-500 text-white rounded"
          >
            {jsonExpanded ? "Reduzir" : "Expandir"}
          </button>
        </div>
        <textarea
          className="w-full border p-2 mt-2 rounded"
          rows={jsonExpanded ? 10 : 4}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
      </div>

      {/* ---- FILE UPLOAD ---- */}
      <div className="p-4 m-4 bg-white rounded-2xl shadow-md">
        <p>
          Carregar ficheiro - .csv, .txt, .json, .xlsx, .pdf
        </p>
        <input type="file" multiple onChange={handleFileUpload} />
        <button
          onClick={handleClearFiles}
          className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
        >
          Apagar todos
        </button>
        <p className="mt-2">
          {files.length === 0 ? "Nenhum ficheiro selecionado" : ""}
        </p>
      </div>

      {/* ---- FILE PREVIEW ---- */}
      {files.map((file, idx) => (
        <div key={idx} className="p-4 m-4 bg-white rounded-2xl shadow-md">
          <div className="flex justify-between">
            <p>
              {file.name} ({file.type}) - {file.tables?.length || 0} tabelas
            </p>
            <span className="cursor-pointer">🗑</span>
          </div>
          {file.message && <p className="text-red-500">{file.message}</p>}
          {file.tables?.map((table, tIdx) => (
            <table
              key={tIdx}
              className="w-full border-collapse border mt-2 text-sm"
            >
              <tbody>
                {table.rows?.slice(0, 5)?.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={rIdx % 2 === 0 ? "bg-gray-100" : "bg-white"}
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="border px-2 py-1">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      ))}

      {/* ---- RELATIONS ---- */}
      <div className="p-4 m-4 bg-white rounded-2xl shadow-md">
        <h3 className="font-bold mb-2">Relacionar ficheiros</h3>
        <button
          onClick={handleAutoRelations}
          className="px-2 py-1 bg-green-500 text-white rounded"
        >
          Relacionar automaticamente
        </button>
        <div className="mt-2">
          {autoRelations?.map((rel, idx) => (
            <p key={idx}>
              {rel.files[0]} ↔ {rel.files[1]} | Colunas:{" "}
              {rel.columns.join(", ")}
            </p>
          ))}
        </div>
      </div>

      {/* ---- FIXED BUTTON ---- */}
      <a
        href="#"
        className="fixed bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-2xl shadow-md"
      >
        Serviços
      </a>

      {/* ---- FOOTER ---- */}
      <footer className="text-center text-xs p-4">2025 Klinos Insight</footer>
    </div>
  );
}
