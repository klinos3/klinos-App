import React, { useState } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function App() {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-purple-200 text-gray-900 text-[16px]">
      {/* Header */}
      <header className="p-6 shadow-md bg-white/70 backdrop-blur-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Klinos Insight – Dashboard Inteligente
        </h1>
      </header>

      {/* Main Section */}
      <main className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Panel */}
        <section>
          <Card className="shadow-lg rounded-2xl bg-white/80">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Carregar Ficheiros</h2>
              <input
                type="file"
                accept=".csv,.txt,.json,.xlsx,.pdf"
                onChange={handleFileChange}
                className="mb-4"
              />
              {file && (
                <p className="text-sm text-gray-700">
                  Ficheiro selecionado:{" "}
                  <span className="font-medium">{file.name}</span>
                </p>
              )}
              <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white">
                Analisar Ficheiro
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Right Panel */}
        <section className="flex flex-col gap-6">
          {/* Card de relacionar colunas */}
          <Card className="shadow-lg rounded-2xl bg-white/80">
            <CardContent className="p-6 flex flex-col">
              <h2 className="text-xl font-semibold mb-4">Relacionar Colunas</h2>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Abrir Relacionamento
              </Button>
            </CardContent>
          </Card>

          {/* Botão Serviços abaixo */}
          <div className="flex justify-end">
            <Button
              onClick={() => (window.location.href = "/servicos")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl shadow-md"
            >
              Serviços
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
