// src/App.jsx
import React, { useMemo, useState } from "react";
import { FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

// Usa o worker de PDF a partir do CDN (funciona em CRA/Netlify)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const App = () => {
  // ---------- STATE ----------
  const [filesData, setFilesData] = useState([]); // [{name, headers[], rows[][]}]
  const [uploadMessage, setUploadMessage] = useState("Nenhum ficheiro selecionado");
  const [jsonData, setJsonData] = useState("");
  const [previewJson, setPreviewJson] = useState([]); // igual a filesData para o JSON colado
  const [expandedJson, setExpandedJson] = useState(false);

  // Relações
  // relations = [{ column: "StoreKey", files: ["Products.csv","Sales.csv"]}, ...]
  const [relations, setRelations] = useState([]);
  // Mapeamento manual: { "Sales.csv": "StoreKey", "Products.csv": "ProductKey", ... }
  const [manualMapping, setManualMapping] = useState({});
  // Mostrar/ocultar setup manual e avançado
  const [showManual, setShowManual] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ---------- CONSTANTES ----------
  const validExtensions = [".csv", ".txt", ".json", ".xlsx", ".pdf"];

  // ---------- HELPERS ----------
  const getExtension = (name) => {
    const i = name.lastIndexOf(".");
    return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
  };

  // headers por ficheiro (para o UI manual) — derivado de filesData + previewJson
  const fileColumns = useMemo(() => {
    const cols = {};
    [...filesData, ...previewJson].forEach((f) => {
      cols[f.name] = f.headers || [];
    });
    return cols;
  }, [filesData, previewJson]);

  // ---------- PARSERS ----------
  const parseCSVText = (text) => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.length);
    if (!lines.length) return { headers: [], rows: [] };
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));
    return { headers, rows };
  };

  const parseTXTText = (text) => {
    // Heurística simples: 1ª linha como headers por espaços/vírgulas/ponto-e-vírgula
    const allLines = text.split(/\r\n|\n/).filter(Boolean);
    if (!allLines.length) return { headers: ["Conteúdo"], rows: [] };
    const candidate = allLines[0].split(/[;,|\t]+|\s{2,}/).map((s) => s.trim()).filter(Boolean);
    if (candidate.length > 1) {
      const headers = candidate;
      const body = allLines.slice(1).map((line) => line.split(/[;,|\t]+|\s{2,}/).map((s) => s.trim()));
      return { headers, rows: body };
    }
    // fallback: coluna única “Conteúdo”
    return {
      headers: ["Conteúdo"],
      rows: allLines.map((l) => [l]),
    };
  };

  const parseXLSXFile = async (file) => {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const sheetName = wb.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    const headers = (sheet[0] || []).map((h) => String(h ?? ""));
    const rows = (sheet.slice(1) || []).map((r) => r.map((c) => String(c ?? "")));
    return { headers, rows };
  };

  const parsePDFFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Falha a ler PDF."));
      reader.onload = async (ev) => {
        try {
          const typedarray = new Uint8Array(ev.target.result);
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          const firstPage = await pdf.getPage(1);
          const textContent = await firstPage.getTextContent();

          // Agrupar por linhas na página
          const lines = [];
          let currentY = null;
          let currentLine = [];
          textContent.items.forEach((item) => {
            const y = item.transform[5];
            if (currentY !== null && Math.abs(y - currentY) > 5) {
              lines.push(currentLine.join(" "));
              currentLine = [];
            }
            currentLine.push(item.str);
            currentY = y;
          });
          if (currentLine.length) lines.push(currentLine.join(" "));

          // Tentar detetar colunas separando por múltiplos espaços/tab/pipe/;
          const split = lines.map((l) =>
            l.split(/[|;]+|\t+|\s{2,}/).map((s) => s.trim()).filter(Boolean)
          );

          const firstRow = split[0] || [];
          const looksTabular = firstRow.length > 1;
          const headers = looksTabular ? firstRow : ["Conteúdo"];
          const rows = looksTabular
            ? split.slice(1)
            : split.map((arr) => [arr.join(" ")]);
          resolve({ headers, rows });
        } catch (e) {
          // fallback texto único
          resolve({ headers: ["Conteúdo"], rows: [["Pré-visualização indisponível para este PDF"]] });
        }
      };
      reader.readAsArrayBuffer(file);
    });

  // ---------- UPLOAD ----------
  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    // Validação de extensões
    const invalid = selectedFiles.find(
      (f) => !validExtensions.some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    if (invalid) {
      setUploadMessage("Ficheiro não suportado");
      return;
    }
    setUploadMessage(""); // limpar msg

    // Ler cada ficheiro
    const promises = selectedFiles.map(
      (file) =>
        new Promise((resolve) => {
          const name = file.name.toString();
          const ext = getExtension(name);

          // XLSX
          if (ext === "xlsx") {
            parseXLSXFile(file).then(({ headers, rows }) => resolve({ name, headers, rows }));
            return;
          }

          // PDF
          if (ext === "pdf") {
            parsePDFFile(file).then(({ headers, rows }) => resolve({ name, headers, rows }));
            return;
          }

          // CSV/JSON/TXT via FileReader texto
          const reader = new FileReader();
          reader.onload = (ev) => {
            const text = String(ev.target.result || "");
            if (ext === "csv") {
              const { headers, rows } = parseCSVText(text);
              resolve({ name, headers, rows });
              return;
            }
            if (ext === "json") {
              try {
                const data = JSON.parse(text);
                const headers = Object.keys(data[0] || {});
                const rows = Array.isArray(data)
                  ? data.map((row) => headers.map((h) => String(row?.[h] ?? "")))
                  : [];
                resolve({ name, headers, rows });
              } catch {
                resolve({ name, headers: ["Conteúdo"], rows: [[text.slice(0, 1000)]] });
              }
              return;
            }
            if (ext === "txt") {
              const { headers, rows } = parseTXTText(text);
              resolve({ name, headers, rows });
              return;
            }
            // fallback
            resolve({ name, headers: ["Conteúdo"], rows: [["Formato não processado"]] });
          };
          reader.readAsText(file);
        })
    );

    const parsedFiles = await Promise.all(promises);
    setFilesData((prev) => [...prev, ...parsedFiles]);
    e.target.value = "";
  };

  // ---------- JSON PREVIEW ----------
  const handleJsonPreview = () => {
    try {
      const data = JSON.parse(jsonData);
      const headers = Object.keys(data[0] || {});
      const rows = Array.isArray(data)
        ? data.map((row) => headers.map((h) => String(row?.[h] ?? "")))
        : [];
      setPreviewJson([{ name: "JSON Colado", headers, rows }]);
    } catch {
      setPreviewJson([{ name: "JSON Inválido", headers: ["Conteúdo"], rows: [[jsonData]] }]);
    }
  };

  // ---------- RELAÇÕES ----------
  // Limpar todos os mapeamentos/relações
  const clearAllRelations = () => {
    setRelations([]);
    setManualMapping({});
  };

  // Automático: agrupa ficheiros que partilham o MESMO nome de coluna
  const handleAutoRelate = () => {
    const all = [...filesData, ...previewJson];
    // colName -> set de fileNames
    const colMap = {};
    all.forEach((f) => {
      (f.headers || []).forEach((h) => {
        const key = String(h);
        if (!colMap[key]) colMap[key] = new Set();
        colMap[key].add(f.name);
      });
    });
    const grouped = Object.entries(colMap)
      .map(([column, fileSet]) => ({ column, files: Array.from(fileSet) }))
      .filter((g) => g.files.length >= 2) // só relações úteis (>=2 ficheiros)
      .sort((a, b) => a.column.localeCompare(b.column));
    setRelations(grouped);
  };

  // ---------- RENDER ----------
  const allPreviewBlocks = [...previewJson, ...filesData];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 via-green-100 to-purple-200 p-6">
      {/* Topo arredondado com links */}
      <div className="flex justify-between items-center p-4 bg-white shadow-xl rounded-full mb-8">
        <a href="https://www.klinosinsight.com" className="font-bold text-xl">
          Klinos Insight
        </a>
        <div className="flex space-x-4 text-sm md:text-base">
          <a href="/inicio" className="hover:underline">Início</a>
          <a href="/servicos" className="hover:underline">Serviços</a>
          <a href="/pagamento" className="hover:underline">Pagamento</a>
          <a href="/resultados" className="hover:underline">Resultados</a>
        </div>
      </div>

      {/* Título + frase com mais respiro */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4">Klinos Insight - App</h1>
        <p className="text-lg">Automação inteligente: menos tempo em tarefas, mais tempo em resultados.</p>
      </div>

      {/* Dashboards (hover zoom + brilho) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { icon: "⚡", title: "Rápido", text: "Carregue e processe os seus ficheiros em segundos. Analise os dados sem esperas e ganhe tempo para decisões importantes." },
          { icon: "🧩", title: "Simples", text: "Tudo num só lugar: carregamento, pré-visualização e exportação. Automatize tarefas complexas com um clique." },
          { icon: "🔒", title: "Seguro", text: "Os seus dados permanecem privados e protegidos. Toda a automação cumpre as melhores práticas de segurança." },
        ].map((d, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl text-white bg-gradient-to-br from-blue-400 to-purple-500 text-center transform transition hover:scale-105 hover:brightness-110 shadow"
          >
            <div className="text-4xl mb-2">{d.icon}</div>
            <h2 className="text-xl font-bold mb-2">{d.title}</h2>
            <p className="text-base">{d.text}</p>
          </div>
        ))}
      </div>

      {/* JSON expansível + botão de pré-visualização */}
      <div className="mb-8 p-5 bg-white rounded-2xl shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Colar ou editar JSON</h3>
          <button
            onClick={() => setExpandedJson((v) => !v)}
            className="px-3 py-1 bg-gray-500 text-white rounded-md"
          >
            {expandedJson ? "Reduzir" : "Expandir"}
          </button>
        </div>
        <textarea
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          placeholder="Cole ou edite JSON aqui..."
          className={`w-full border p-3 rounded-md mb-3 ${expandedJson ? "h-64" : "h-28"}`}
        />
        <button
          onClick={handleJsonPreview}
          className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Adicionar Pré-visualização
        </button>
      </div>

      {/* Upload */}
      <div className="mb-8 p-5 bg-white rounded-2xl shadow flex flex-col md:flex-row items-start md:items-center justify-between">
        <div className="flex flex-col mb-3 md:mb-0">
          <label className="mb-1 font-semibold">
            Carregar ficheiro - .csv, .txt, .json, .xlsx, .pdf
          </label>
          <input type="file" multiple onChange={handleFileUpload} className="border p-2 rounded-md" />
          <span className="text-sm text-gray-600 mt-1">{uploadMessage}</span>
        </div>
        <button
          onClick={() => setFilesData([])}
          className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Apagar todos
        </button>
      </div>

      {/* Pré-visualização (6 linhas: header + 5) */}
      <div className="mb-10 p-5 bg-white rounded-2xl shadow">
        {allPreviewBlocks.length === 0 && (
          <div className="text-sm text-gray-600">Nenhum ficheiro carregado.</div>
        )}
        {allPreviewBlocks.map((f, idx) => {
          const totalRows = f.rows?.length || 0;
          const previewRows = (f.rows || []).slice(0, 5); // 5 linhas + header
          const ext = getExtension(f.name);
          return (
            <div key={`${f.name}-${idx}`} className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">
                  {f.name} ({ext}) — {f.headers?.length || 0} colunas, {totalRows} linhas
                </span>
                <button
                  title="Remover"
                  onClick={() =>
                    setFilesData((prev) => prev.filter((ff) => ff.name !== f.name))
                  }
                  className="text-red-600 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="table-auto w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {(f.headers || []).map((h, i) => (
                        <th key={i} className="border px-2 py-1 bg-gray-200 text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        {(row || []).map((cell, j) => (
                          <td key={j} className="border px-2 py-1">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {totalRows > 5 && (
                      <tr>
                        <td className="px-2 py-1 text-xs text-gray-500" colSpan={(f.headers || []).length}>
                          … mostrando 5 de {totalRows} linhas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------- RELACIONAR COLUNAS ---------- */}
      <div className="mt-8 p-6 bg-white rounded-2xl shadow-md">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold">Relacionar Colunas</h2>
          <button
            onClick={clearAllRelations}
            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Limpar relações
          </button>
        </div>

        {/* 1) Manual */}
        <div className="mb-6 p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Mapear Colunas ao Seu Critério</h3>
              <p className="text-gray-600 text-sm">
                Selecione manualmente as colunas que deseja relacionar entre diferentes ficheiros.
              </p>
            </div>
            <button
              onClick={() => setShowManual((v) => !v)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showManual ? "Fechar" : "Configurar"}
            </button>
          </div>

          {showManual && (
            <div className="mt-4">
              {/* Grid com Ficheiros (1..N) e dropdown de colunas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(fileColumns).length === 0 && (
                  <div className="text-sm text-gray-600">
                    Carregue ficheiros para escolher colunas.
                  </div>
                )}
                {Object.entries(fileColumns).map(([fname, cols]) => (
                  <div key={fname} className="p-3 rounded-lg bg-gray-50 border">
                    <div className="font-semibold mb-2">{fname}</div>
                    <label className="block text-sm text-gray-600 mb-1">Selecionar coluna</label>
                    <select
                      value={manualMapping[fname] || ""}
                      onChange={(e) =>
                        setManualMapping((prev) => ({ ...prev, [fname]: e.target.value }))
                      }
                      className="w-full border rounded-md p-2"
                    >
                      <option value="">— escolher coluna —</option>
                      {(cols || []).map((c, i) => (
                        <option key={i} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Resumo tipo “Ficheiros | Colunas” */}
              {Object.keys(manualMapping).length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Mapeamento manual selecionado</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-semibold">Ficheiros</div>
                    <div className="font-semibold">Colunas</div>
                    {Object.entries(manualMapping).map(([fname, col]) => (
                      <React.Fragment key={fname}>
                        <div>{fname}</div>
                        <div>{col || "—"}</div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2) Automático */}
        <div className="mb-6 p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Sugerir Mapeamento Inteligente</h3>
              <p className="text-gray-600 text-sm">
                Analisa os ficheiros e sugere relações com base em colunas com o mesmo nome.
              </p>
            </div>
            <button
              onClick={handleAutoRelate}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Gerar Sugestões
            </button>
          </div>

          {/* Resultado automático: layout em colunas alinhadas */}
          <div className="mt-4">
            {relations.length === 0 ? (
              <div className="text-sm text-gray-600">Sem relações encontradas ainda.</div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-semibold mb-1">Relações encontradas:</div>
                {relations.map((rel, idx) => (
                  <div
                    key={`${rel.column}-${idx}`}
                    className="grid grid-cols-12 gap-2 items-center text-sm"
                  >
                    {/* Lista de ficheiros em colunas (até 10 colunas); última coluna mostra “: ColumnName” */}
                    <div className="col-span-10 grid grid-cols-5 gap-2">
                      {rel.files.map((f) => (
                        <div
                          key={f}
                          className="px-2 py-1 bg-gray-100 rounded-md text-gray-800 truncate"
                          title={f}
                        >
                          {f}
                        </div>
                      ))}
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-gray-500">: {rel.column}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3) Avançado */}
        <div className="p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Configurar Relações Avançadas</h3>
              <p className="text-gray-600 text-sm">
                Defina relações mais complexas (1:N, N:N) ou baseadas em regras de negócio específicas.
              </p>
            </div>
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              {showAdvanced ? "Fechar" : "Configurar"}
            </button>
          </div>

          {showAdvanced && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded-md border">
                  <div className="font-semibold mb-2">Tipo de relação</div>
                  <select className="w-full border rounded-md p-2">
                    <option>Um para Muitos (1:N)</option>
                    <option>Muitos para Muitos (N:N)</option>
                  </select>
                </div>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <div className="font-semibold mb-2">Chave/Tabela A</div>
                  <input className="w-full border rounded-md p-2" placeholder="ex.: Sales.csv: CustomerID" />
                </div>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <div className="font-semibold mb-2">Chave/Tabela B</div>
                  <input className="w-full border rounded-md p-2" placeholder="ex.: Customers.xlsx: CustomerID" />
                </div>
              </div>
              <div className="flex justify-end">
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                  Guardar Relação Avançada
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botão Serviços fixo */}
      <div className="fixed bottom-4 right-4">
        <a href="/servicos" className="px-4 py-2 bg-purple-600 text-white rounded shadow">
          Serviços
        </a>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-600">2025 Klinos Insight</footer>
    </div>
  );
};

export default App;
