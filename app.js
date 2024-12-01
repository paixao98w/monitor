require('dotenv').config(); // Carregar variáveis do .env
const AsteriskAmiClient = require('asterisk-ami-client');
const axios = require('axios');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Conectar ao Asterisk usando variáveis do .env
const client = new AsteriskAmiClient({ reconnect: true });

client.connect(process.env.AMI_USER, process.env.AMI_PASSWORD, {
  host: process.env.AMI_HOST,
  port: process.env.AMI_PORT,
})
  .then(() => console.log('Conectado ao Asterisk'))
  .catch(err => console.error('Erro ao conectar:', err));

const ramalEspecifico = process.env.RAMAL_ESPECIFICO;
const webhookUrl = process.env.WEBHOOK_URL;
const recordingsDir = process.env.RECORDINGS_DIR || '/var/spool/asterisk/monitor';

// Notificação de chamada recebida no ramal específico
client.on('event', event => {
  if (event.Event === 'Dial' && event.Destination === ramalEspecifico) {
    console.log(`Chamada recebida no ramal ${ramalEspecifico}`);

    axios.post(webhookUrl, { evento: event })
      .then(response => console.log('Webhook notificado:', response.data))
      .catch(error => console.error('Erro no webhook:', error));
  }
});

// Rota para monitorar ligações em tempo real
app.post('/monitorar-ligacao', (req, res) => {
  const ramal = req.body.ramal;
  client.action({
    Action: 'Originate',
    Channel: `Local/${ramal}@chanspy`,
    Context: 'default',
    Priority: 1,
    CallerID: 'Monitor',
  }, (err, response) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(200).json({ message: 'Monitoramento iniciado', response });
    }
  });
});

// Rota para listar áudios gravados
app.get('/audios', (req, res) => {
  fs.readdir(recordingsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao listar arquivos' });
    }
    const audioFiles = files.filter(file => file.endsWith('.wav') || file.endsWith('.mp3'));
    res.status(200).json({ audios: audioFiles });
  });
});

// Rota para baixar um áudio específico
app.get('/audios/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(recordingsDir, filename);

  fs.access(filePath, fs.constants.F_OK, err => {
    if (err) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    res.download(filePath, err => {
      if (err) {
        res.status(500).json({ error: 'Erro ao baixar o arquivo' });
      }
    });
  });
});

// Inicializar o servidor
app.listen(process.env.PORT || 3000, () => console.log(`API rodando na porta ${process.env.PORT || 3000}`));
