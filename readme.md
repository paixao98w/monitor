#   Monitor Asterisk Server

## Como instalar:

  ###  1 - Configure o AMI no Asterisk em: 
  #### vi /etc/asterisk/manager.conf

    Exemplo: 
    [admin]
    secret = senha_do_admin
    read = system,call,log,verbose,command,agent,user
    write = system,call,log,verbose,command,agent,user

    
### 2 - Ajuste o dianplan customizado em:
####  vi /etc/asterisk/extensions_custom.conf

        [custom-chanspy]
        exten => _555XXXX,1,Answer()
        same => n,Wait(1)
        same => n,ChanSpy(SIP/${EXTEN:3},q)
        same => n,Hangup()

    
### 3 - Baixe o Projeto no servidor e ajuste as variavies de ambiente no .env:

        AMI_USER=usuario   (usuario configurado no ami em     /etc/asterisk/manager.conf)
        AMI_PASSWORD=senha   (senha configurado no ami em     /etc/asterisk/manager.conf)
        AMI_HOST=127.0.0.1 (por padrao localhost verificar regras de firewall)
        AMI_PORT=5038 (porta padrao altere caso conflito)
        RAMAL_ESPECIFICO=2001 (ramal a ser monitordo)
        PORT=3000 (porta de execução do servidor, alterar caso conflito)

### 4 - execute o serviço (necessario o node e o pm2 instalado no servidor)

    cd  /diretorio/
    pm2 start app.js --name "monitor-server"
    pm2 log monitor-server 
    caso apareça servidor rodando na porta tal esta ok

