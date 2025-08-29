import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const App = () => {
  const [filesData, setFilesData] = useState([]);
  const [uploadMessage, setUploadMessage] = useState("Nenhum ficheiro selecionado");
  const [jsonData, setJsonData] = useState("");
  const [previewJson, setPreviewJson] = useState([]);
  const [relations, setRelations] = useState({});
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

      {/* Relacionar Colunas (CORRETO: dentro do return) */}
      <div className="mt-8 p-6 bg-white rounded-2xl shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-4">Relacionar Colunas</h2>

            {/* Botão Mapear Colunas ao Seu Critério (não faz nada por agora) */}
            <div className="mb-6">
              <button className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition">
                Mapear Colunas ao Seu Critério
              </button>
              <p className="text-gray-600 text-sm mt-2">
                Selecione manualmente as colunas que deseja relacionar entre diferentes ficheiros.
                Ideal quando procura <strong>controlo total</strong> sobre as ligações.
              </p>
            </div>

            {/* Botão Sugerir Mapeamento Inteligente → usa a tua função existente */}
            <div className="mb-6">
              <button
                onClick={autoRelateFiles}
                className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition"
              >
                Sugerir Mapeamento Inteligente
              </button>
              <p className="text-gray-600 text-sm mt-2">
                A aplicação analisa os ficheiros e propõe automaticamente as relações mais prováveis,
                com base em nomes semelhantes e padrões de dados.
              </p>
            </div>

            {/* Botão Configurar Relações Avançadas (placeholder) */}
            <div className="mb-4">
              <button className="w-full bg-purple-600 text-white py-2 rounded-xl hover:bg-purple-700 transition">
                Configurar Relações Avançadas
              </button>
              <p className="text-gray-600 text-sm mt-2">
                Defina relações mais complexas (<strong>1:N, N:N</strong>) ou baseadas em regras de negócio específicas.
              </p>
            </div>
          </div>

          {/* Ações à direita */}
          <div className="w-56">
            <button
              onClick={clearAllRelations}
              className="w-full bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 transition"
              title="Limpar todas as relações"
            >
              Limpar relações
            </button>
          </div>
        </div>

        {/* Lista de relações sugeridas/atuais */}
        {Object.keys(relations).length > 0 ? (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Relações encontradas:</h3>
            <ul className="text-sm list-disc pl-5">
              {Object.entries(relations).map(([src, targets]) => (
                <li key={src} className="mb-2">
                  <strong>{src}</strong>
                  <ul className="list-disc pl-5 mt-1">
                    {Object.entries(targets).map(([dst, cols]) => (
                      <li key={dst}>
                        ↔ <strong>{dst}</strong>: {cols.join(", ")}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-600 text-sm mt-4">
            Ainda não existem relações. Utilize “Sugerir Mapeamento Inteligente” ou mapeie manualmente.
          </p>
        )}
      </div>

      {/* Botão Serviços */}
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
