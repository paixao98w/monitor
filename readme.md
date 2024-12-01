#   Monitor Asterisk Server

## Como instalar:

  ###  1 - Configure o AMI no Asterisk em: 
    /etc/asterisk/manager.conf

    Exemplo: 
    [admin]
    secret = senha_do_admin
    read = system,call,log,verbose,command,agent,user
    write = system,call,log,verbose,command,agent,user

### 2 - Baixe o Projeto no servidor e ajuste as variavies de ambiente no .env:

        AMI_USER=usuario   (usuario configurado no ami em     /etc/asterisk/manager.conf)
        AMI_PASSWORD=senha   (senha configurado no ami em     /etc/asterisk/manager.conf)
        AMI_HOST=127.0.0.1 (por padrao localhost verificar regras de firewall)
        AMI_PORT=5038 (porta padrao altere caso conflito)
        WEBHOOK_URL=http://webhook.com  (url do webhook para receber as notificçoes)
        RAMAL_ESPECIFICO=1010 (ramal a ser monitordo)
        RECORDINGS_DIR=/var/spool/asterisk/monitor (diretorio padrao das gravações, verificar se foi alterado no servidor)
        PORT=3000 (porta de execução do servidor, alterar caso conflito)

### 3 - execute o serviço (necessario o node e o pm2 instalado no servidor)

    cd  /diretorio/
    pm2 start app.js --name "monitor-server"
    pm2 log monitor-server 
    caso apareça servidor rodando na porta tal esta ok


### 4 - Como usar 

    o Webhoook cliente vai receber o evento quando o ramal estiver em ring
     console.log(`Chamada recebida no ramal ${ramalEspecifico}`);

     nisso é necessario que o cliente faça a requisiçao no 

     curl -X POST http://localhost:3000/monitorar-ligacao

    para listar as gravaçoes retroativas:

    curl -X GET http://localhost:3000/audios

    e fazer o dowlodod:

    curl -X GET http://localhost:3000/audios/1639421100.12345.wav --output chamada_1639421100.wav
