require('dotenv').config(); // Carregar variáveis do .env
const AsteriskAmiClient = require('asterisk-ami-client');
const express = require('express');
const { exec } = require('child_process'); // Usar exec para rodar comandos no sistema

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

// Notificação de chamada recebida no ramal
client.on('event', event => {
  console.log(event); // Mostra todos os eventos para depuração

  // Verificando se o evento é ExtensionStatus e o status do ramal é 'Ringing'
  if (event.Event === 'ExtensionStatus' && event.StatusText === 'Ringing' && event.Exten === ramalEspecifico) {
    console.log(`Chamada recebida no ramal ${ramalEspecifico} com status: ${event.StatusText}`);

    // Enviar o comando originate para 2002 com ChanSpy
    const comando = `asterisk -rx "originate SIP/2002 extension 5552001@custom-chanspy"`;

    // Executar o comando no terminal
    exec(comando, (err, stdout, stderr) => {
      if (err) {
        console.error('Erro ao executar o comando originate:', err);
        return;
      }

      if (stderr) {
        console.error('Erro no stderr:', stderr);
        return;
      }

      console.log('Comando executei com sucesso:', stdout);
    });
  }

  if (event.Event === "Hangup" && event.CallerIDNum === '2001') {
    console.log("->> Hangup Detectado!")
    extractSIPChannels().then(channel => {
      if (channel) {
        exec(`asterisk -rx "channel request hangup ${channel}"`, (err, stdout, stderr) => {
          if (err) {
            console.error('Erro ao desligar a chamada de 2002:', err);
            return;
          }

          if (stderr) {
            console.error('Erro no stderr ao desligar a chamada de 2002:', stderr);
            return;
          }

          console.log('Chamada de 2002 desligada com sucesso');
        });
      }
    });
  }

  // Verificando o evento Dial para capturar o canal do 2002
  if (event.Event === 'Dial' && event.Channel && event.Channel.startsWith('SIP/2002')) {
    console.log('Chamada originada para o canal 2002:', event.Channel);

    // Verificando o evento de Hangup para o canal 2002
    if (event.Event === 'Hangup' && event.Channel.startsWith('SIP/2002')) {
      console.log(`Desligando a chamada de 2002 (${event.Channel}), pois 2001 terminou a chamada`);

      // Enviar o comando Hangup para o canal 2002
      exec(`asterisk -rx "channel request hangup ${event.Channel}"`, (err, stdout, stderr) => {
        if (err) {
          console.error('Erro ao desligar a chamada de 2002:', err);
          return;
        }

        if (stderr) {
          console.error('Erro no stderr ao desligar a chamada de 2002:', stderr);
          return;
        }

        console.log('Chamada de 2002 desligada com sucesso');
      });
    }
  }
});

function getChannels() {
  return new Promise((resolve, reject) => {
    exec('asterisk -rx "core show channels"', (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`Stderr: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}

async function extractSIPChannels() {
  try {
    const output = await getChannels();

    // Split the output into lines and filter for lines starting with 'SIP/2002'
    const lines = output.split('\n');
    const filtered = lines.filter(line => line.includes('SIP/2002'));

    // Extract the full channel name (first field in the line)
    const channelNames = filtered.map(line => {
      const parts = line.trim().split(/\s+/); // Split by spaces/tabs
      return parts[0]; // The channel name is the first part
    });

    // Return the first channel found or null if none found
    return channelNames[0] || null;
  } catch (error) {
    console.error('Error fetching channels:', error);
    return null;
  }
}

// Inicializar o servidor
app.listen(process.env.PORT || 3000, () => console.log(`API rodando na porta ${process.env.PORT || 3000}`));
