import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const App = () => {
  const [relations, setRelations] = useState([]);
  const [showManual, setShowManual] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [selectedFileA, setSelectedFileA] = useState("");
  const [selectedFileB, setSelectedFileB] = useState("");
  const [selectedColA, setSelectedColA] = useState("");
  const [selectedColB, setSelectedColB] = useState("");
  const [relationType, setRelationType] = useState("");

  const [filesData, setFilesData] = useState([]);
  const [uploadMessage, setUploadMessage] = useState("Nenhum ficheiro selecionado");
  const [jsonData, setJsonData] = useState("");
  const [previewJson, setPreviewJson] = useState([]);

  const [expandedJson, setExpandedJson] = useState(false);

  const validExtensions = [".csv", ".txt", ".json", ".xlsx", ".pdf"];

  const handleFileUpload = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    // validação de extensão
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

          // XLSX
          if (name.toLowerCase().endsWith(".xlsx")) {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
            const headers = sheet[0] || [];
            const rows = (sheet.slice(1) || []).map((r) => r.map((c) => (c == null ? "" : String(c))));
            resolve({ name, headers, rows });
            return;
          }

          // PDF
          if (name.toLowerCase().endsWith(".pdf")) {
            const reader = new FileReader();
            reader.onload = async (ev) => {
              try {
                const typedarray = new Uint8Array(ev.target.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                const page = await pdf.getPage(1);
                const textContent = await page.getTextContent();
                const lines = [];
                let lastY = null;
                let currentLine = [];

                textContent.items.forEach((item) => {
                  // quebra de linha por Y
                  if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                    lines.push(currentLine.join(" | "));
                    currentLine = [];
                  }
                  currentLine.push(item.str);
                  lastY = item.transform[5];
                });
                if (currentLine.length) lines.push(currentLine.join(" | "));

                // tenta “split” por pipe como colunas
                const splitLines = lines.map((l) =>
                  l.split("|").map((c) => c.trim()).filter(Boolean)
                );

                const looksTabular =
                  splitLines.length > 1 && splitLines.every((row) => row.length === splitLines[0].length);

                const headers =
                  looksTabular && splitLines[0].length > 1 ? splitLines[0] : ["Conteúdo"];

                const rows =
                  headers[0] === "Conteúdo"
                    ? splitLines.map((l) => [l.join(" ")])
                    : splitLines.slice(1);

                resolve({ name, headers, rows });
              } catch (err) {
                // fallback
                resolve({
                  name,
                  headers: ["Conteúdo"],
                  rows: [["Não foi possível extrair o texto do PDF."]],
                });
              }
            };
            reader.readAsArrayBuffer(file);
            return;
          }

          // CSV / JSON / TXT
          const reader = new FileReader();
          reader.onload = (ev) => {
            const text = ev.target.result;
            if (name.toLowerCase().endsWith(".csv")) {
              const lines = text.split(/\r\n|\n/).filter((l) => l.length);
              const headers = (lines[0] || "").split(",").map((h) => h.trim());
              const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));
              resolve({ name, headers, rows });
              return;
            }
            if (name.toLowerCase().endsWith(".json")) {
              try {
                const data = JSON.parse(text);
                const headers = Object.keys(data[0] || {});
                const rows = Array.isArray(data)
                  ? data.map((row) => headers.map((h) => String(row?.[h] ?? "")))
                  : [["Conteúdo não tabular"]];
                resolve({ name, headers: headers.length ? headers : ["Conteúdo"], rows });
              } catch {
                resolve({
                  name,
                  headers: ["Conteúdo"],
                  rows: text.split(/\r\n|\n/).map((l) => [l]),
                });
              }
              return;
            }
            if (name.toLowerCase().endsWith(".txt")) {
              resolve({
                name,
                headers: ["Conteúdo"],
                rows: text.split(/\r\n|\n/).map((l) => [l]),
              });
              return;
            }
          };
          // TXT/CSV/JSON
          reader.readAsText(file);
        })
    );

    const parsed = await Promise.all(readers);
    setFilesData((prev) => [...prev, ...parsed]);
    e.target.value = "";
  };

  const handleJsonPreview = () => {
    try {
      const data = JSON.parse(jsonData);
      const headers = Object.keys(data[0] || {});
      const rows = Array.isArray(data)
        ? data.map((row) => headers.map((h) => String(row?.[h] ?? "")))
        : [["Conteúdo não tabular"]];
      setPreviewJson([{ name: "JSON Colado", headers: headers.length ? headers : ["Conteúdo"], rows }]);
    } catch {
      setPreviewJson([{ name: "JSON Inválido", headers: ["Conteúdo"], rows: [[jsonData]] }]);
    }
  };

  const clearAllRelations = () => setRelations({});

  // Sugere relações com base em nomes de coluna iguais
  const autoRelateFiles = () => {
    const newRelations = {};
    filesData.forEach((f1) => {
      const related = {};
      filesData.forEach((f2) => {
        if (f1.name !== f2.name) {
          const common = (f1.headers || []).filter((h) => (f2.headers || []).includes(h));
          if (common.length) related[f2.name] = common;
        }
      });
      if (Object.keys(related).length) newRelations[f1.name] = related;
    });
    setRelations(newRelations);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 via-green-100 to-purple-200 p-6">
      {/* Topo */}
      <div className="flex justify-between items-center p-4 bg-white shadow-xl rounded-full mb-6">
        <a href="https://www.klinosinsight.com" className="font-bold text-xl">
          Klinos Insight
        </a>
        <div className="flex space-x-4">
          <a href="/inicio" className="hover:underline">Início</a>
          <a href="/servicos" className="hover:underline">Serviços</a>
          <a href="/pagamento" className="hover:underline">Pagamento</a>
          <a href="/resultados" className="hover:underline">Resultados</a>
        </div>
      </div>

      {/* Título */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Klinos Insight - App</h1>
        <p className="text-lg">Automação inteligente: menos tempo em tarefas, mais tempo em resultados.</p>
      </div>

      {/* Dashboards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: "⚡", title: "Rápido", text: "Carregue e processe os seus ficheiros em segundos. Analise os dados sem esperas e ganhe tempo para decisões importantes." },
          { icon: "🧩", title: "Simples", text: "Tudo num só lugar: carregamento, pré-visualização e exportação. Automatize tarefas complexas com um clique." },
          { icon: "🔒", title: "Seguro", text: "Os seus dados permanecem privados e protegidos. Toda a automação cumpre as melhores práticas de segurança." },
        ].map((d, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl text-white font-semibold text-base bg-gradient-to-br from-blue-400 to-purple-500 transform transition hover:scale-105 hover:brightness-110 cursor-pointer text-center"
          >
            <div className="text-4xl mb-2">{d.icon}</div>
            <h2 className="text-xl font-bold mb-1">{d.title}</h2>
            <p className="text-base">{d.text}</p>
          </div>
        ))}
      </div>

      {/* JSON */}
      <div className="mb-6 p-4 bg-white rounded-xl shadow">
        <textarea
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          placeholder="Cole ou edite JSON aqui..."
          className={`w-full border p-2 rounded mb-2 ${expandedJson ? "h-64" : "h-24"}`}
        />
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setExpandedJson(!expandedJson)}
            className="px-2 py-1 bg-gray-400 text-white rounded"
          >
            {expandedJson ? "Reduzir" : "Expandir"}
          </button>
          <button
            onClick={handleJsonPreview}
            className="px-2 py-1 bg-green-500 text-white rounded"
          >
            Adicionar Pré-visualização
          </button>
        </div>
      </div>

      {/* Upload */}
      <div className="mb-6 p-4 bg-white rounded-xl shadow flex flex-col md:flex-row items-start md:items-center justify-between">
        <div className="flex flex-col mb-2 md:mb-0">
          <label className="mb-1 font-semibold">
            Carregar ficheiro - .csv, .txt, .json, .xlsx, .pdf
          </label>
          <input type="file" multiple onChange={handleFileUpload} className="border p-1 rounded" />
          <span className="text-sm text-gray-600 mt-1">{uploadMessage}</span>
        </div>
        <button
          onClick={() => setFilesData([])}
          className="px-2 py-1 bg-red-500 text-white rounded mt-2 md:mt-0"
        >
          Apagar todos
        </button>
      </div>

      {/* Pré-visualização */}
      <div className="mb-6 p-4 bg-white rounded-xl shadow">
        {previewJson.concat(filesData).map((f, idx) => (
          <div key={idx} className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">
                {f.name} ({(f.headers || []).length} colunas, {(f.rows || []).length} linhas)
              </span>
              <FaTrash
                className="cursor-pointer text-red-500"
                onClick={() => setFilesData(filesData.filter((_, i) => i !== idx))}
                title="Apagar este ficheiro"
              />
            </div>
            <table className="table-auto w-full text-sm border-collapse">
              <thead>
                <tr>
                  {(f.headers || []).map((h, i) => (
                    <th key={i} className="border px-2 py-1 bg-gray-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(f.rows || []).slice(0, 5).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    {row.map((cell, j) => (
                      <td key={j} className="border px-2 py-1">{String(cell ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

{/* ===================== RELACIONAR COLUNAS ===================== */}
<div className="bg-white p-6 rounded-2xl shadow-md mb-8">
  <h2 className="text-2xl font-bold mb-4">Relacionar Colunas</h2>
  
  {/* Botão para limpar relações */}
  <button 
    onClick={() => setRelations([])} 
    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl mb-6"
  >
    Limpar Relações
  </button>

  {/* ===================== BLOCO 1 – MAPEAMENTO MANUAL ===================== */}
  <div className="mb-8">
    <h3 className="text-xl font-semibold mb-2">Mapear Colunas ao Seu Critério</h3>
    <p className="text-gray-600 mb-4">
      Selecione manualmente as colunas que deseja relacionar entre diferentes ficheiros. 
      Ideal quando procura controlo total sobre as ligações.
    </p>

    <button 
      onClick={() => setShowManual(prev => !prev)} 
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl mb-4"
    >
      Mapear Colunas ao Seu Critério
    </button>

    {showManual && (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        {Object.keys(files).length < 2 ? (
          <p className="text-gray-500 italic">Carregue pelo menos 2 ficheiros para mapear manualmente.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4">
              <select 
                className="border p-2 rounded"
                onChange={(e) => setSelectedFileA(e.target.value)}
                value={selectedFileA}
              >
                <option value="">Escolha Ficheiro A</option>
                {Object.keys(files).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select 
                className="border p-2 rounded"
                onChange={(e) => setSelectedFileB(e.target.value)}
                value={selectedFileB}
              >
                <option value="">Escolha Ficheiro B</option>
                {Object.keys(files).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {selectedFileA && selectedFileB && (
              <div className="flex gap-4">
                <select 
                  className="border p-2 rounded"
                  onChange={(e) => setSelectedColA(e.target.value)}
                  value={selectedColA}
                >
                  <option value="">Coluna em {selectedFileA}</option>
                  {files[selectedFileA].columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select 
                  className="border p-2 rounded"
                  onChange={(e) => setSelectedColB(e.target.value)}
                  value={selectedColB}
                >
                  <option value="">Coluna em {selectedFileB}</option>
                  {files[selectedFileB].columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <button 
                  onClick={() => {
                    if (selectedColA && selectedColB) {
                      setRelations(prev => [...prev, { fileA: selectedFileA, colA: selectedColA, fileB: selectedFileB, colB: selectedColB }]);
                      setSelectedColA(""); setSelectedColB("");
                    }
                  }} 
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded"
                >
                  Adicionar Relação
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )}
  </div>

  {/* ===================== BLOCO 2 – MAPEAMENTO AUTOMÁTICO ===================== */}
  <div className="mb-8">
    <h3 className="text-xl font-semibold mb-2">Sugerir Mapeamento Inteligente</h3>
    <p className="text-gray-600 mb-4">
      A aplicação analisa os ficheiros e propõe automaticamente as relações mais prováveis, 
      com base em nomes semelhantes e padrões de dados.
    </p>

    <button 
      onClick={() => {
        const suggestions = [];
        const fileNames = Object.keys(files);
        for (let i = 0; i < fileNames.length; i++) {
          for (let j = i + 1; j < fileNames.length; j++) {
            const fA = fileNames[i];
            const fB = fileNames[j];
            files[fA].columns.forEach(colA => {
              if (files[fB].columns.includes(colA)) {
                suggestions.push({ fileA: fA, colA, fileB: fB, colB: colA });
              }
            });
          }
        }
        setRelations(prev => [...prev, ...suggestions]);
      }} 
      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl mb-4"
    >
      Sugerir Mapeamento Inteligente
    </button>

    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      {relations.length === 0 ? (
        <p className="text-gray-500 italic">Nenhuma relação encontrada ainda.</p>
      ) : (
        <ul className="list-disc list-inside text-gray-700">
          {relations.map((r, idx) => (
            <li key={idx}>
              {r.fileA} ({r.colA}) ↔ {r.fileB} ({r.colB})
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>

  {/* ===================== BLOCO 3 – RELAÇÕES AVANÇADAS ===================== */}
  <div>
    <h3 className="text-xl font-semibold mb-2">Configurar Relações Avançadas</h3>
    <p className="text-gray-600 mb-4">
      Defina relações mais complexas (1:N, N:N) ou baseadas em regras de negócio específicas.
    </p>

    <button 
      onClick={() => setShowAdvanced(prev => !prev)} 
      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl mb-4"
    >
      Configurar Relações Avançadas
    </button>

    {showAdvanced && (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
        <select 
          className="border p-2 rounded"
          onChange={(e) => setRelationType(e.target.value)}
          value={relationType}
        >
          <option value="">Escolha tipo de relação</option>
          <option value="1-1">Um para Um (1:1)</option>
          <option value="1-N">Um para Muitos (1:N)</option>
          <option value="N-N">Muitos para Muitos (N:N)</option>
        </select>

        <button 
          onClick={() => {
            if (relationType) {
              setRelations(prev => [...prev, { type: relationType, custom: true }]);
              setRelationType("");
            }
          }} 
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Guardar Relação Avançada
        </button>
      </div>
    )}
  </div>
</div>


      {/* Botão Serviços */}
      <div className="fixed bottom-4 right-4">
        <a href="/servicos" className="px-4 py-2 bg-purple-600 text-white rounded shadow">
          Serviços
        </a>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-600">Klinos Insight</footer>
    </div>
  );
};

export default App;
