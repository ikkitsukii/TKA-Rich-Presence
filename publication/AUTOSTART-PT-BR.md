# TKA Discord Rich Presence — 0.4.0 beta

Autor: IkkiTsuki (hikarinovamente).

## Instalação: copiar e jogar
Requer Windows x64, Discord desktop e UE4SS já funcionando no jogo. Ambiente testado: UE4SS v3.0.1-1195-g1ceefac8, layout ue4ss/Mods. Não precisa instalar Node.js, executar instalador ou abrir .cmd.

1. Feche o jogo.
2. Extraia o ZIP. Copie a pasta TKA_RPC inteira para:
   TheKillingAntidote/TheKillingAntidote/Binaries/Win64/ue4ss/Mods/
   A pasta que já contém ue4ss deve conter Mods; o resultado deve ser Mods/TKA_RPC/Scripts/main.lua e Mods/TKA_RPC/Bridge/TKA-RPC.exe. Não crie Mods/TKA_RPC/TKA_RPC.
3. Abra o Discord desktop e inicie o jogo pela Steam. O mod inicia o auxiliar automaticamente. Aguarde cerca de 20 segundos.

Mantenha toda a pasta TKA_RPC junta. O auxiliar roda oculto e encerra automaticamente após o processo do jogo fechar. Não registra inicialização no Windows. Se o Discord estiver fechado, tenta conectar enquanto o jogo estiver aberto.

## Idioma
Edite TKA_RPC/Bridge/rpc/config.json: "language": "pt-BR" para português ou "language": "en" para inglês. Salve e reinicie o jogo. A atividade usa o mesmo idioma para todos os espectadores.

## Recursos
11 locais (escritório, dois mapas da História, oito desafios); quatro dificuldades; vida; tempo de sessão; artes de mapas/menu/quartos; personalização; compras; aviso temporário de salvamento. O tempo inclui menus/carregamentos. Salvamento acionado não confirma gravação concluída. A imagem do quarto aparece durante a personalização, não apenas ao entrar no quarto. Atualizações são periódicas.

## Atualizar e remover
Com o jogo fechado, guarde sua configuração de idioma e substitua a pasta TKA_RPC pela nova versão. Para remover, feche o jogo e remova apenas Mods/TKA_RPC. Não remova UE4SS ou outros mods.

## Suporte
Confira a estrutura das pastas, Discord desktop e compartilhamento de atividade. Erros de inicialização ficam em TKA_RPC/Bridge/autostart.log; o auxiliar usa TKA_RPC/Bridge/rpc/rpc.log. O coletor escreve no UE4SS.log. Revise dados pessoais antes de compartilhar trechos. Para suporte, informe versão do mod, jogo e UE4SS.

O mod lê dados do jogo e comunica atividade ao Discord por IPC local; não envia logs ao autor. Código original com direitos reservados; redistribuição exige autorização. Componentes de terceiros mantêm suas licenças. Personagens, cenários e logo pertencem aos respectivos titulares. Artes de capturas do jogo retocadas por IA. Projeto independente, sem afiliação oficial.
