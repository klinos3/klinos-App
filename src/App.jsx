import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const App = () => {
  const [filesData, setFilesData] = useState([]);
  const [uploadMessage, setUploadMessage] = useState("Nenhum ficheiro selecionado");
  const [jsonData, setJsonData] = useState("");
  const [previewJson, setPreviewJson] = useState([]);
  const [relations, setRelations] = useState({});
  const [expandedJson, setExpandedJson] = useState(false);

  const validExtensions = [".csv", ".txt", ".json", ".xlsx", ".pdf"];

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
            const reader = new FileReader();
            reader.onload = async (ev) => {
              const typedarray = new Uint8Array(ev.target.result);
              const pdf = await pdfjsLib.getDocument(typedarray).promise;
              const page = await pdf.getPage(1);
              const textContent = await page.getTextContent();
              const lines = [];
              let lastY = null;
              let currentLine = [];

              textContent.items.forEach((item) => {
                if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                  lines.push(currentLine.join(" | "));
                  currentLine = [];
                }
                currentLine.push(item.str);
                lastY = item.transform[5];
              });
              if (currentLine.length) lines.push(currentLine.join(" | "));

              const splitLines = lines.map((l) => l.split("|").map((c) => c.trim()));
              const headers = splitLines[0]?.length > 1 ? splitLines[0] : ["Conteúdo"];
              const rows = headers[0] === "Conteúdo" ? splitLines.map((l) => [l.join(" ")]) : splitLines.slice(1);
              resolve({ name, headers, rows });
            };
            reader.readAsArrayBuffer(file);
            return;
          }

          const reader = new FileReader();
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
          };
          if (!name.toLowerCase().endsWith(".xlsx") && !name.toLowerCase().endsWith(".pdf")) {
            reader.readAsText(file);
          }
        })
    );

    const parsed = await Promise.all(readers);
    setFilesData((prev) => [...prev, ...parsed]);
    e.target.value = "";
  };

  // JSON preview
  const handleJsonPreview = () => {
    try {
      const data = JSON.parse(jsonData);
      const headers = Object.keys(data[0] || {});
      const rows = data.map((row) => headers.map((h) => String(row[h] ?? "")));
      setPreviewJson([{ name: "JSON Colado", headers, rows }]);
    } catch {
      setPreviewJson([{ name: "JSON Inválido", headers: ["Conteúdo"], rows: [[jsonData]] }]);
    }
  };

  // Relacionamentos
  const clearAllRelations = () => setRelations({});

  const autoRelateFiles = () => {
    const newRelations = {};
    filesData.forEach((f1) => {
      const relatedCols = {};
      filesData.forEach((f2) => {
        if (f1.name !== f2.name) {
          const common = f1.headers.filter((h) => f2.headers.includes(h));
          if (common.length) relatedCols[f2.name] = common;
        }
      });
      if (Object.keys(relatedCols).length) newRelations[f1.name] = relatedCols;
    });
    setRelations(newRelations);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 via-green-100 to-purple-200 p-6">
      {/* Topo */}
      <div className="flex justify-between items-center p-4 bg-white shadow-xl rounded-full mb-6">
        <a href="https://www.klinosinsight.com" className="font-bold text-xl">Klinos Insight</a>
        <div className="flex space-x-4">
          <a href="/inicio" className="hover:underline">Início</a>
          <a href="/servicos" className="hover:underline">Serviços</a>
          <a href="/pagamento" className="hover:underline">Pagamento</a>
          <a href="/resultados" className="hover:underline">Resultados</a>
        </div>
      </div>

      {/* Título */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-6">Klinos Insight - App</h1>
        <p className="text-lg mb-6">Automação inteligente: menos tempo em tarefas, mais tempo em resultados.</p>
      </div>

      {/* Dashboards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: "⚡", title: "Rápido", text: "Carregue e processe os seus ficheiros em segundos. Analise os dados sem esperas e ganhe tempo para decisões importantes." },
          { icon: "🧩", title: "Simples", text: "Tudo num só lugar: carregamento, pré-visualização e exportação. Automatize tarefas complexas com um clique." },
          { icon: "🔒", title: "Seguro", text: "Os seus dados permanecem privados e protegidos. Toda a automação cumpre as melhores práticas de segurança." },
        ].map((d, idx) => (
          <div key={idx} className="p-4 rounded-xl text-white font-semibold text-base bg-gradient-to-br from-blue-400 to-purple-500 transform transition hover:scale-105 hover:brightness-110 cursor-pointer text-center">
            <div className="text-4xl mb-2">{d.icon}</div>
            <h2 className="text-xl font-bold mb-1">{d.title}</h2>
            <p className="text-base">{d.text}</p>
          </div>
        ))}
      </div>

      {/* JSON */}
      <div className="mb-6 p-4 bg-white rounded-xl shadow">
        <textarea value={jsonData} onChange={(e) => setJsonData(e.target.value)} placeholder="Cole ou edite JSON aqui..." className={`
