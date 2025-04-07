console.log("🚀 Archivo server.js se está ejecutando");

const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');

const app = express();
const port = 3541;
console.log("🧠 Iniciando servidor...");

// Configuración para servir archivos estáticos
app.use(express.static(path.join(__dirname)));

const options = {
  key: fs.readFileSync('certs/key.pem'),
  cert: fs.readFileSync('certs/cert.pem')
};

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/panel', (req, res) => res.sendFile(path.join(__dirname, 'panel.html')));

https.createServer(options, app).listen(port, () => {
  console.log(`✅ Servidor HTTPS escuchando en https://localhost:${port}`);
});