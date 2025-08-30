import React, { useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export default function App() {
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState(null);
  const [jsonInput, setJsonInput] = useState("");
  const [relations, setRelations] = useState([]);

  // Função que lê qualquer tipo de ficheiro e extrai colunas
  const parseFile = async (file) => {
    let headers = [];
    const name = file.name.toLowerCase();

    // CSV
    if (name.endsWith(".csv")) {
      return new Promise((resolve) => {
        Papa.parse(file, {
          complete: (result) => {
            headers = result.data[0] || [];
            resolve({ name: file.name, headers, rows: result.data.length });
          },
        });
      });
    }

    // XLSX
    if (name.endsWith(".xlsx")) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
      headers = sheet[0] || [];
      return { name: file.name, headers, rows: sheet.length };
    }

    // JSON
    if (name.endsWith(".json")) {
      const text = await file.text();
      const json = JSON.parse(text);
      headers = Object.keys(Array.isArray(json) ? json[0] || {} : json);
      return { name: file.name, headers, rows: Array.isArray(json) ? json.length : 1 };
    }

    // TXT
    if (name.endsWith(".txt")) {
      const text = await file.text();
      const rows = text.split("\n");
      headers = rows[0].split(/\s+/).slice(0, 10);
      return { name: file.name, headers, rows: rows.length };
    }

    // PDF (simplificado)
    if (name.endsWith(".pdf")) {
      headers = ["PDF_Document"];
      return { name: file.name, headers, rows: 1 };
    }

    return { name: file.name, headers: [], rows: 0 };
  };

  // Upload de ficheiros
  const handleFileUpload = async (event) => {
    const newFiles = [];
    for (const file of event.target.files) {
      const parsed = await parseFile(file);
      newFiles.push(parsed);
    }
    setFiles([...files, ...newFiles]);
    setPreview(newFiles[0]); // mostra o primeiro
  };

  // Guardar colunas relacionadas
  const handleAddRelation = () => {
    setRelations([...relations, { left: "", right: "" }]);
  };

  const handleRelationChange = (index, side, value) => {
    const updated = [...relations];
    updated[index][side] = value;
    setRelations(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 rounded-2xl shadow mb-6 flex justify-between">
        <h1 className="text-xl font-bold">📊 Klinos App</h1>
        <a href="https://klinosinsight.com" target="_blank" rel="noopener noreferrer" className="underline">
          Klinos Insight
        </a>
      </header>

      {/* Dashboards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow">Dashboard 1 (Resumo)</div>
        <div className="bg-white p-4 rounded-2xl shadow">Dashboard 2 (Vendas)</div>
        <div className="bg-white p-4 rounded-2xl shadow">Dashboard 3 (Financeiro)</div>
      </div>

      {/* Upload + JSON */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Upload */}
        <div className="bg-white p-4 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-2">Carregar Ficheiros</h2>
          <input
            type="file"
            accept=".csv,.xlsx,.txt,.json,.pdf"
            multiple
            onChange={handleFileUpload}
            className="mb-4"
          />

          {preview && (
            <div className="mt-4">
              <h3 className="font-semibold">Pré-visualização</h3>
              <p><strong>Nome:</strong> {preview.name}</p>
              <p><strong>Linhas:</strong> {preview.rows}</p>
              <p><strong>Colunas:</strong> {preview.headers.join(", ")}</p>
            </div>
          )}
        </div>

        {/* JSON Editor */}
        <div className="bg-white p-4 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-2">Colar/Editar JSON</h2>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Cole aqui JSON válido..."
            className="w-full h-40 border rounded p-2"
          />
        </div>
      </div>

      {/* Relacionar Colunas */}
      <div className="bg-white p-4 rounded-2xl shadow">
        <h2 className="text-lg font-semibold mb-2">Relacionar Colunas</h2>
        {relations.map((rel, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Tabela A"
              value={rel.left}
              onChange={(e) => handleRelationChange(idx, "left", e.target.value)}
              className="border rounded p-1 flex-1"
            />
            <span className="self-center">=</span>
            <input
              type="text"
              placeholder="Tabela B"
              value={rel.right}
              onChange={(e) => handleRelationChange(idx, "right", e.target.value)}
              className="border rounded p-1 flex-1"
            />
          </div>
        ))}
        <button
          onClick={handleAddRelation}
          className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
        >
          + Adicionar Relação
        </button>
      </div>
    </div>
  );
}
