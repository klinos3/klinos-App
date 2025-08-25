import React, { useState } from "react";
import * as XLSX from "exceljs";
import * as pdfjsLib from "pdfjs-dist";

function App() {
  const [fileData, setFileData] = useState(null);
  const [preview, setPreview] = useState("");

  const handleFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileType = file.name.split(".").pop().toLowerCase();

    if (fileType === "xlsx") {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const buffer = e.target.result;
        const workbook = new XLSX.Workbook();
        await workbook.xlsx.load(buffer);
        const sheetNames = workbook.worksheets.map((sheet) => sheet.name);
        setFileData({ type: "xlsx", sheets: sheetNames });
        setPreview(`XLSX file loaded: ${sheetNames.join(", ")}`);
      };
      reader.readAsArrayBuffer(file);
    } else if (fileType === "pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setFileData({ type: "pdf", pages: pdf.numPages });
      setPreview(`PDF file loaded: ${pdf.numPages} pages`);
    } else {
      setPreview("Tipo de ficheiro não suportado.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6 text-blue-800">
        Klinos Insight Dashboard
      </h1>

      <input
        type="file"
        accept=".xlsx,.pdf"
        onChange={handleFile}
        className="mb-4 p-2 border rounded"
      />

      {preview && (
        <div className="bg-white p-4 rounded shadow w-full max-w-lg">
          <h2 className="font-semibold text-lg mb-2">Preview:</h2>
          <p>{preview}</p>
        </div>
      )}

      <footer className="mt-10 text-gray-500">
        Transforme os seus ficheiros em insights poderosos.
      </footer>
    </div>
  );
}

export default App;
