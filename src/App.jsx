import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);

    if (uploadedFile && uploadedFile.type.startsWith("text")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreview(ev.target.result.substring(0, 500)); // pré-visualizar primeiras 500 chars
      };
      reader.readAsText(uploadedFile);
    } else {
      setPreview("Pré-visualização disponível apenas para ficheiros de texto.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-klinosGreen">Klinos Insight</h1>
        <p className="text-gray-200 mt-2">Upload e Análise de Ficheiros</p>
      </header>

      <main className="bg-white text-black shadow-xl rounded-2xl p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-6 text-klinosBlue">1. Carregar Ficheiro</h2>
        <input
          type="file"
          accept=".csv,.txt,.json,.xlsx,.pdf"
          onChange={handleFileChange}
          className="mb-6 block w-full border border-gray-300 rounded-lg p-2"
        />

        {file && (
          <div>
            <h3 className="text-lg font-bold text-klinosGreen mb-2">Detalhes:</h3>
            <p><strong>Nome:</strong> {file.name}</p>
            <p><strong>Tamanho:</strong> {(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}

        {preview && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-klinosGreen mb-2">Pré-visualização:</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              {preview}
            </pre>
          </div>
        )}
      </main>

      <footer className="mt-12 text-gray-300 text-sm">
        © 2025 Klinos Insight
      </footer>
    </div>
  );
}

export default App;
