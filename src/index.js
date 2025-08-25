import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';   // 👈 garante que usa o App.jsx

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
