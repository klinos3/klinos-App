import React from "react";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 to-purple-200 font-sans text-gray-900">
      {/* Cabeçalho */}
      <header className="p-6 bg-blue-300 shadow-md text-center">
        <h1 className="text-2xl font-semibold">Klinos Insight</h1>
        <p className="mt-2 text-lg">Análise e visualização de dados simplificada</p>
      </header>

      {/* Conteúdo principal */}
      <main className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Seção de carregar ficheiros */}
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Carregar ficheiros</h2>
          <p className="mb-2">
            Suporta CSV, XLSX, PDF, JSON e TXT. Pré-visualize e edite os dados.
          </p>
          <input
            type="file"
            accept=".csv, .xlsx, .pdf, .json, .txt"
            className="border p-2 rounded-md w-full"
          />
        </section>

        {/* Seção relacionar colunas */}
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Relacionar colunas</h2>
          <p>Defina relações entre colunas para análises detalhadas.</p>
          <div className="mt-4 flex justify-end">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600">
              Serviços
            </button>
          </div>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="p-6 bg-blue-300 text-center">
        <p className="text-sm">© 2025 Klinos Insight. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

export default App;
