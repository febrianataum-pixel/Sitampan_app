
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Index.tsx loading...");
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Could not find root element!");
  throw new Error("Could not find root element to mount to");
}

console.log("Root element found, rendering app...");
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
