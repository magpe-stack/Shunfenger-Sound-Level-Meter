
# 🌬️ Shunfenger Sound Level Meter

> **順風耳 · Shunfeng'er — "A Orelha que Acompanha o Vento"**
>
> Na mitologia chinesa, Shunfeng'er é a divindade celestial capaz de ouvir qualquer som levado pelo vento. Ao lado de Qianliyan, o "Olho de Mil Léguas", ele serve como guardião da deusa Mazu, protetora dos navegantes. Este aplicativo herda um pouco dessa escuta atenta: perceber cada ruído ao redor para cuidar da sua saúde auditiva.

**Shunfenger Sound Level Meter** é um decibelímetro em formato PWA (Progressive Web App), *mobile-first* e *offline-first*, feito em Vanilla JavaScript. Usa a **Web Audio API** e a **Geolocation API** reais do navegador, sem simulações.

🔗 **App online:** <https://magpe-stack.github.io/Shunfenger-Sound-Level-Meter/>
📦 **Repositório:** <https://github.com/magpe-stack/Shunfenger-Sound-Level-Meter>

![Ilustração de Capa do Aplicativo Decibelímetro](Shunfengercover.png)

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Requisitos e instalação](#2-requisitos-e-instalação)
3. [Primeiro uso e permissões](#3-primeiro-uso-e-permissões)
4. [A tela principal](#4-a-tela-principal)
5. [Como fazer uma medição](#5-como-fazer-uma-medição)
6. [Classificação de saúde auditiva](#6-classificação-de-saúde-auditiva)
7. [Histórico, observações e fotografias](#7-histórico-observações-e-fotografias)
8. [O menu Arquivo](#8-o-menu-arquivo)
9. [Exportação, relatórios e backup](#9-exportação-relatórios-e-backup)
10. [Calibração e precisão](#10-calibração-e-precisão)
11. [Tema claro e escuro](#11-tema-claro-e-escuro)
12. [Funcionamento offline e atualizações](#12-funcionamento-offline-e-atualizações)
13. [Privacidade e dados](#13-privacidade-e-dados)
14. [Solução de problemas](#14-solução-de-problemas)
15. [Perguntas frequentes](#15-perguntas-frequentes)
16. [Referência técnica](#16-referência-técnica)
17. [Estrutura do repositório e publicação](#17-estrutura-do-repositório-e-publicação)
18. [Aviso importante](#18-aviso-importante)
19. [Compartilhamento de cartões de medição](#19-compartilhamento-de-cartões-de-medição)
20. [Novidades da versão 1.3 e checklist de testes](#20-novidades-da-versão-13-e-checklist-de-testes)

---

## 1. Visão geral

O Shunfenger mede o nível de pressão sonora do ambiente usando o microfone do celular, mostra o valor em decibéis (dB) em tempo real, classifica o risco para a audição e permite salvar cada medição com **data/hora**, **localização (latitude/longitude)**, **classificação** e uma **observação** sua.

**Principais recursos**

- Medição em tempo real, com visor numérico grande e barra de nível.
- Quatro modos de medida: **Contínuo**, **10 s**, **20 s** e **30 s**.
- Valores **mínimo**, **médio** e **máximo** de cada medição.
- Classificação em quatro faixas (Seguro, Moderado, Alto e Crítico).
- Histórico salvo no próprio aparelho, com exclusão e campo de observação de até 50 caracteres.
- Fotografia opcional vinculada a cada medição, armazenada localmente.
- Compartilhamento individual de medições em cartão PNG vertical de **1080 × 1350 pixels**, com fotografia opcional.
- Opção de incluir coordenadas GPS no cartão, **desativada por padrão**.
- Botão flutuante **Instalar grátis**, com instalação nativa quando disponível ou orientações para o navegador.
- Exportação em **JSON, Markdown, TXT e DOCX**, além de **impressão / PDF** em folha A4.
- Importação de backups JSON, incluindo a recuperação das fotografias incorporadas ao arquivo.
- Modo claro e modo escuro.
- Funciona **offline** depois do primeiro acesso e pode ser **instalado** como aplicativo.

**Otimizado para:** Samsung Galaxy A52 com Google Chrome, mas funciona em outros celulares Android com Chrome.

---

## 2. Requisitos e instalação

### Requisitos

- Celular com microfone e **Google Chrome** atualizado (recomendado: Android).
- Conexão com a internet **apenas no primeiro acesso** (para baixar o app).
- Endereço em **HTTPS**. O app publicado no GitHub Pages já atende a esse requisito, e o navegador só libera microfone e localização em páginas seguras.
- GPS ligado, se quiser registrar a localização.

### Botão flutuante de instalação

Na versão 1.3, há um botão **Instalar grátis** sobre a interface quando o aplicativo não está em execução como PWA instalado. Ao tocá-lo:

- Se o navegador disponibilizar o convite nativo de instalação, ele será exibido.
- Se não houver convite nativo, o aplicativo apresenta orientações para instalar manualmente.
- Se o aplicativo já estiver aberto no modo instalado, o botão não aparece.

A disponibilidade da instalação depende do navegador, do sistema e dos critérios de instalação do PWA.

### Instalar no celular (Chrome para Android)

1. Abra <https://magpe-stack.github.io/Shunfenger-Sound-Level-Meter/> no Chrome.
2. Use uma das opções:
   - **Arquivo › Instalar aplicativo** (aparece quando o Chrome oferece a instalação); ou
   - Menu **⋮** do Chrome › **Instalar app** (ou **Adicionar à tela inicial**).
3. Confirme. O ícone do Shunfenger aparece na tela inicial e o app abre em tela cheia, sem barra de endereço.

> Se a opção de instalar não aparecer, abra o menu ⋮ do Chrome e procure "Instalar app". Ela pode não aparecer se o app já estiver instalado.

### Instalação no iPhone e iPad

Abra o endereço oficial no Safari, toque em **Compartilhar** e procure **Adicionar à Tela de Início**. O nome e a posição dos comandos podem variar conforme a versão do iOS/iPadOS.

### Abertura do app

Ao abrir, o app exibe por **1 segundo** uma tela de abertura com o logo e o nome e, em seguida, passa suavemente para a tela principal.

---

## 3. Primeiro uso e permissões

Na primeira medição, o Chrome pede duas permissões, uma de cada vez:

| Permissão | Para que serve | E se eu negar? |
|---|---|---|
| **Microfone** | Medir o som. É **obrigatória**. | A medição não inicia e o app mostra um aviso com o passo a passo para liberar. |
| **Localização** | Registrar latitude e longitude de cada medição. É **opcional**. | A medição funciona normalmente; o registro fica como "Localização indisponível". |

Avisos amigáveis aparecem em uma faixa no topo da tela (toque no **✕** para fechar).

**Como liberar uma permissão negada**

- No Chrome: toque no ícone de **cadeado** ao lado do endereço › **Permissões** › ative **Microfone** e/ou **Localização**.
- No app instalado: **Configurações do Android › Apps › Chrome › Permissões** (ou "Informações do app" do Shunfenger, conforme o aparelho).
- Depois, volte ao app e toque em **Iniciar medição** novamente.

---

## 4. A tela principal

A tela principal cabe inteira na tela do celular, **sem rolagem**.

### Cabeçalho

| Elemento | O que faz |
|---|---|
| **Logo + "Shunfenger Sound Level Meter"** | Leva de volta à **tela principal** de medição, de qualquer lugar do app. |
| **☀️ / 🌙 Tema** | Alterna entre modo claro e modo escuro. |
| **GitHub** | Abre o repositório do projeto: <https://github.com/magpe-stack/Shunfenger-Sound-Level-Meter>. |
| **? Ajuda** | Abre este manual. |
| **📁 Arquivo** | Abre o menu Arquivo (novo registro, importar, exportar, imprimir, sobre). |

### Visor de medição

- **Etiqueta do modo** (canto superior esquerdo): mostra o modo selecionado (Contínuo, 10 s, 20 s ou 30 s).
- **Cronômetro** (canto superior direito): no modo Contínuo mostra o tempo decorrido (`mm:ss`); nos modos de 10, 20 e 30 s mostra a contagem regressiva ("Restam N s"). Ao salvar, exibe "Salvo ✔".
- **Número grande:** nível sonoro atual em dB, com uma casa decimal. Antes de medir mostra `--.-`.
- **Barra de nível:** vai de 0 a 120 dB. As três marcas verticais indicam **50**, **70** e **85 dB**, que são os limites das faixas de classificação.
- **Classificação:** emoji e texto da faixa atual (veja a [seção 6](#6-classificação-de-saúde-auditiva)).
- **Mín / Média / Máx:** menor, média e maior valor da medição em andamento.
- **Barra de progresso fina:** aparece nos modos de 10, 20 e 30 s e mostra quanto da medição já foi feito.

### Modos de medida

Quatro botões logo abaixo do visor: **Contínuo**, **10 s**, **20 s**, **30 s**. Só podem ser trocados com a medição **parada**.

### Botão principal

- **Iniciar medição:** começa a medir.
- **Parar e salvar:** encerra a medição e grava o registro no histórico.

### Barra inferior

- **Medir:** tela principal.
- **Histórico:** lista de registros salvos. O número no ícone mostra quantos registros existem.

---

## 5. Como fazer uma medição

### Passo a passo

1. Escolha o **modo de medida** (Contínuo, 10 s, 20 s ou 30 s).
2. Toque em **Iniciar medição** e permita o microfone (e, se quiser, a localização).
3. Observe o visor: o número e a barra acompanham o som em tempo real.
4. Para encerrar:
   - **Modos de 10, 20 e 30 s:** a medição termina e salva **sozinha** ao fim do tempo.
   - **Modo Contínuo:** toque em **Parar e salvar** quando quiser.
5. O app mostra "Registro salvo", e o registro aparece no **Histórico**.

### Diferença entre os modos

| Modo | Duração | Valor gravado no registro |
|---|---|---|
| **Contínuo** | Até você parar | O valor **instantâneo** do momento em que você tocou em Parar e salvar. Mín, média e máx da sessão também são gravados. |
| **10 s / 20 s / 30 s** | Fixa | A **média acumulada** (média de energia sonora) de toda a medição. |

Se você tocar em **Parar e salvar** antes do fim de um modo temporizado, a medição é salva com a média do que foi captado até ali.

### O que fica registrado

Cada registro guarda: data e hora de início, modo, duração, valor (dB), média, mínimo, máximo, classificação, latitude, longitude, precisão da localização (em metros) e a sua observação (opcional).

### Regras úteis

- Medições **muito curtas** (menos de 3 leituras, cerca de 0,3 s) **não são salvas**; o app avisa.
- Durante a medição, o app tenta **manter a tela ligada** para o microfone não ser interrompido.
- Se você sair do app ou bloquear a tela, o Android pode pausar o microfone. Mantenha o app aberto e visível durante a medição.
- O botão **Parar e salvar** fica indisponível por instantes enquanto o app espera a localização (até cerca de 12 s); isso é normal.
- A localização é solicitada no **início** da medição, e o registro usa a posição obtida naquele momento.

### Boas práticas

- Segure o celular **parado**, com o microfone (parte inferior do aparelho) voltado para a fonte sonora e **sem tampar** o orifício com a mão ou capa.
- Evite vento direto no microfone e o atrito dos dedos no aparelho; ambos geram ruído falso.
- Para comparar locais, use sempre o **mesmo modo** (por exemplo 30 s) e a mesma posição do aparelho.
- Prefira os modos temporizados para ambientes com som variável; a média representa melhor o ambiente do que um único instante.

---

## 6. Classificação de saúde auditiva

A classificação usa faixas simplificadas, inspiradas nas referências da **OMS** e da **NR-15**:

| Nível medido | Classificação | O que significa |
|---|---|---|
| **menos de 50 dB** | 🟢 **Seguro / Ideal** | Ambiente tranquilo, sem risco para a audição. |
| **50 a 70 dB** | 🟡 **Moderado** | Ruído cotidiano; pode incomodar em exposição prolongada, mas sem risco imediato. |
| **71 a 85 dB** | 🟠 **Alto / Risco** | Exposição longa pode causar fadiga auditiva; evite permanecer por muito tempo. |
| **acima de 85 dB** | 🔴 **Crítico / Nocivo** | Risco de dano à audição. Afaste-se, reduza a fonte ou use protetor auricular. |

O app arredonda o valor para o inteiro mais próximo antes de classificar: 70 dB é Moderado e 71 dB é Alto.

### Exemplos de referência

| Situação típica | Nível aproximado |
|---|---|
| Sussurro, biblioteca silenciosa | 30 a 40 dB |
| Casa silenciosa, escritório calmo | 40 a 50 dB |
| Conversa normal | 55 a 65 dB |
| Trânsito urbano moderado | 65 a 75 dB |
| Liquidificador, aspirador de pó | 75 a 85 dB |
| Trânsito intenso, ferramentas elétricas | 85 a 95 dB |
| Show, balada, fone de ouvido em volume máximo | 95 a 110 dB |
| Sirene próxima, fogos de artifício | 110 a 130 dB |

### Sobre a NR-15

A NR-15 (Anexo 1) fixa **85 dB(A)** como limite de exposição para uma jornada de **8 horas** de ruído contínuo, reduzindo o tempo permitido conforme o nível sobe (por exemplo, 90 dB(A) por 4 horas e 100 dB(A) por 1 hora).

> ⚠️ O Shunfenger **não aplica ponderação em frequência (dB(A))** e usa o microfone de um celular. Por isso, a classificação é **orientativa**, útil para triagem e conscientização, e **não substitui** uma avaliação ocupacional com equipamento calibrado.

---

## 7. Histórico, observações e fotografias

Toque em **Histórico** na barra inferior. A lista apresenta as medições salvas, normalmente da mais recente para a mais antiga, e pode ser percorrida com rolagem.

### Informações de cada cartão

Cada registro reúne o nível sonoro em dB, classificação, data e hora, modo, duração, valores mínimo/médio/máximo, localização quando disponível e uma observação. A versão 1.3 acrescenta ações de **fotografia** e **compartilhamento**.

### Observações

O campo aceita até **50 caracteres**, com contador visual. A observação é salva localmente durante a digitação e aparece nos relatórios e no cartão compartilhável. Uma observação longa pode ser abreviada visualmente na imagem para caber no layout.

### Adicionar ou substituir fotografia

1. Abra o **Histórico** e localize a medição desejada.
2. Toque na ação para **adicionar fotografia**.
3. Escolha uma imagem do dispositivo.
4. Aguarde o processamento e a gravação.
5. O cartão do histórico passa a exibir a fotografia ou sua prévia.

Você pode abrir a imagem para visualizá-la, substituí-la por outra ou removê-la sem apagar a medição. As imagens são processadas para reduzir o tamanho antes do armazenamento.

**Onde a fotografia fica guardada?** No **IndexedDB** do navegador, separadamente dos dados numéricos do histórico, que ficam no `localStorage`. A fotografia é vinculada ao identificador da medição.

### Excluir um registro ou apagar tudo

A exclusão de um cartão solicita confirmação e remove também a fotografia vinculada. **Apagar tudo** solicita confirmação e exclui os registros e as fotografias associadas. A operação não pode ser desfeita; faça backup antes.

### Compartilhar uma medição

Use o botão de compartilhamento do cartão para abrir a prévia de uma imagem PNG com as informações da medição. O procedimento completo está na [seção 19](#19-compartilhamento-de-cartões-de-medição).

---

## 8. O menu Arquivo

O menu **Arquivo**, no cabeçalho, reúne os comandos de gerenciamento e exportação.

| Comando | Finalidade |
|---|---|
| **Novo registro** | Retorna à tela de medição para iniciar outra sessão. |
| **Importar JSON** | Recupera medições e, quando presentes no backup, suas fotografias. |
| **Exportar JSON** | Gera uma cópia dos registros, incluindo fotografias codificadas no arquivo. |
| **Exportar Markdown (.md)** | Cria relatório textual estruturado. |
| **Exportar TXT** | Cria relatório em texto simples. |
| **Exportar DOCX** | Cria documento compatível com editores de texto. |
| **Imprimir / Salvar PDF** | Abre a impressão do navegador; o usuário pode selecionar PDF. |
| **Instalar aplicativo** | Solicita instalação nativa ou apresenta instruções. |
| **Sobre o Shunfenger** | Informações do aplicativo e ajuste de calibração. |

O compartilhamento individual não exige exportar o histórico inteiro: ele é acionado diretamente no cartão da medição.

---

## 9. Exportação, relatórios e backup

### Qual formato escolher?

| Formato | Uso recomendado | Fotografias |
|---|---|---|
| **JSON** | Backup completo e migração entre aparelhos | **Sim**, incorporadas como texto Base64. |
| **Markdown (.md)** | Documentação e repositórios GitHub | Não incorpora os arquivos de imagem. |
| **TXT** | Texto simples e consulta rápida | Não. |
| **DOCX** | Relatório editável em processadores de texto | Não há garantia de incorporação das fotografias no DOCX desta versão. |
| **Imprimir / PDF** | Relatório visual para arquivar ou imprimir | **Sim**, quando a fotografia está acessível. |
| **PNG do cartão** | Compartilhar uma medição individual | **Sim**, se o registro tiver fotografia. |

Os arquivos são baixados pelo navegador; a pasta e a interface de salvamento variam conforme o dispositivo.

### Exportar um backup JSON com fotografias

1. Abra **Arquivo → Exportar JSON**.
2. Aguarde a leitura das fotografias salvas no IndexedDB.
3. Salve o arquivo `.json` em um local seguro.
4. Guarde uma segunda cópia fora do aparelho, se os registros forem importantes.

**Atenção:** as imagens ficam codificadas dentro do próprio JSON; não é necessário enviar uma pasta separada de fotos. Isso aumenta o tamanho do backup. A exportação depende de conseguir acessar as fotografias armazenadas no navegador.

### Importar um backup JSON

1. Abra **Arquivo → Importar JSON**.
2. Escolha um backup gerado pelo aplicativo.
3. Aguarde a leitura dos registros e a recuperação das fotografias.
4. Verifique no **Histórico** se as medições e as imagens apareceram.

O código da versão 1.3 evita duplicar registros que já tenham o mesmo identificador. Em backups com fotografias, a restauração das imagens depende da disponibilidade do IndexedDB e de espaço no dispositivo. **Não apague os dados originais antes de confirmar que a restauração funcionou.**

### Gerar PDF

Abra **Arquivo → Imprimir / Salvar PDF** e, na janela do navegador, escolha **Salvar como PDF**. O relatório de impressão pode incluir as fotografias vinculadas às medições.

### Privacidade das exportações

O JSON pode conter **fotografias, coordenadas GPS, observações e horários**. Relatórios de texto e impressão também podem expor localização. Revise o conteúdo antes de enviá-lo a terceiros.

---

## 10. Calibração e precisão

Celulares não têm microfones calibrados para medir som. O app converte o sinal do microfone em dB somando um **deslocamento (offset)** ao nível digital. O valor padrão é **100 dB**, uma estimativa razoável, mas que varia entre aparelhos.

### Como calibrar

Você precisa de um **decibelímetro de referência** (ou um calibrador acústico) e de um som estável, como ruído rosa ou um tom constante.

1. Coloque o celular e o instrumento de referência lado a lado, à mesma distância da fonte.
2. Meça com o Shunfenger (modo **30 s** é bom para isso) e anote o valor médio mostrado.
3. Calcule: **novo offset = offset atual + (valor do instrumento − valor do app)**.

   Exemplo: o instrumento marca 70 dB, o app marca 64 dB e o offset atual é 100. O novo offset é 100 + (70 − 64) = **106**.

4. Abra **Arquivo › Sobre o Shunfenger**, digite o novo valor em **Offset (dB)** e toque em **Salvar**.
5. Repita a medição para conferir.

- O offset aceito vai de **40 a 160**.
- Toque em **Padrão** para voltar ao valor 100.
- O offset fica salvo no aparelho e vale para as próximas medições. Registros antigos **não são recalculados**.

### Limites de precisão

- O app **não aplica ponderação A ou C**; mede o nível sem filtro de frequência. Os valores **não são dB(A)**.
- O desempenho depende do microfone: ruídos muito fracos (abaixo de uns 35 a 40 dB) e muito fortes (acima de uns 100 a 110 dB) tendem a ser menos confiáveis.
- O app **desliga** cancelamento de eco, supressão de ruído e controle automático de ganho para não distorcer a medição. Mesmo assim, alguns aparelhos aplicam processamento próprio.
- Capas, proteções de tela e poeira no orifício do microfone alteram a leitura.
- Use os valores como **indicação aproximada**, útil para comparar ambientes e acompanhar mudanças, mas não como medida certificada (norma IEC 61672).

---

## 11. Tema claro e escuro

- Toque no botão **☀️ / 🌙** no cabeçalho para alternar.
- Na primeira vez, o app segue o tema do seu celular. Depois, **lembra a sua escolha**.
- Os dois temas usam a mesma paleta: `#873ff3` (primária), `#B487F7` e `#E1CFFC` (tons intermediários), mais preto `#000000` e branco `#ffffff`.

---

## 12. Funcionamento offline e atualizações

- Depois do **primeiro acesso**, o app guarda seus arquivos no aparelho (Service Worker) e **abre e mede sem internet**.
- Tudo que o app faz (medir, salvar, exportar, imprimir) funciona offline. Só abrir o **GitHub** e o **manual** exige conexão.
- **Atualizações:** quando há uma versão nova publicada, o app a baixa em segundo plano e passa a usá-la na **próxima abertura**. Se a versão antiga continuar aparecendo, feche o app por completo e abra de novo (às vezes duas vezes).
- A versão atual aparece em **Arquivo › Sobre o Shunfenger**.

---

## 13. Privacidade e dados

- O áudio é processado **no próprio aparelho**, em tempo real. O app **não grava** nem guarda o som; guarda apenas o número em dB.
- O processamento da medição e a geração do cartão PNG ocorrem **localmente**, sem serviço de processamento remoto.
- Medições, localização e observações ficam no `localStorage`; **fotografias** ficam no `IndexedDB` do navegador.
- A localização só é lida **quando você inicia uma medição** e só se você permitir.
- Para apagar tudo: use **Apagar tudo** no Histórico, ou limpe os dados do site nas configurações do Chrome.
- O backup JSON pode conter **fotografias e coordenadas GPS**; compartilhe com cuidado.
- No cartão PNG, a opção **Incluir coordenadas GPS** começa desmarcada. O usuário precisa ativá-la explicitamente para que as coordenadas apareçam na imagem.
- Compartilhar por aplicativos externos pode transferir a imagem, o texto e o link ao serviço escolhido; as regras de privacidade desse serviço passam a valer.

---

## 14. Solução de problemas

| Problema | O que fazer |
|---|---|
| **"Acesso ao microfone negado"** | Libere o microfone em cadeado › Permissões (veja a [seção 3](#3-primeiro-uso-e-permissões)) e tente de novo. |
| **"Nenhum microfone foi encontrado"** | Verifique se o aparelho tem microfone ativo e se não há fone desconectado com problema. |
| **"O microfone está em uso por outro aplicativo"** | Feche chamadas, gravadores ou apps de voz e tente novamente. |
| **"Este navegador não suporta captura de áudio, ou a página não está em HTTPS"** | Abra o app pelo endereço `https://` oficial, com o Chrome atualizado. |
| **Localização indisponível / tempo esgotado** | Ligue o GPS, vá para um local com melhor sinal e tente novamente. Medir sem localização continua possível. |
| **Valores muito altos ou muito baixos** | Faça a [calibração](#10-calibração-e-precisão). Confira se o microfone está livre e sem vento. |
| **Número "pulando" muito** | É natural em sons variáveis. Use um modo de 10, 20 ou 30 s e olhe a **média**. |
| **Medição não salvou** | Medições com menos de cerca de 0,3 s são descartadas. Meça por mais tempo. |
| **Exportação não baixou** | Confirme que o Chrome pode baixar arquivos e que há espaço no aparelho. Procure na pasta Downloads. |
| **Histórico sumiu** | O histórico fica no navegador; limpar dados do site o apaga. Restaure um backup JSON em Arquivo › Importar. |
| **Aparece versão antiga** | Feche o app totalmente e abra de novo. Se persistir, limpe os dados do site e acesse de novo (o histórico será apagado; exporte um backup antes). |
| **Não consigo instalar** | Toque em **Instalar grátis** e siga as instruções. A opção nativa depende do navegador e dos critérios de instalação do PWA. |
| **O botão Instalar não aparece** | Verifique se o aplicativo já está aberto em modo instalado. Em navegador comum, atualize a página e confira se a versão nova foi carregada. |
| **Não consigo adicionar fotografia** | Confira o formato da imagem, o espaço disponível e as permissões do navegador para acessar arquivos. |
| **A fotografia desapareceu** | Fotografias dependem do IndexedDB do mesmo navegador/perfil. Limpeza dos dados do site pode apagá-las; restaure um backup JSON que as contenha. |
| **A imagem compartilhável não é gerada** | Tente uma foto menor, libere espaço e atualize o aplicativo. O navegador precisa oferecer suporte a Canvas e PNG. |
| **Compartilhar não abre outro aplicativo** | Use **Salvar imagem** e envie o PNG manualmente. O compartilhamento nativo não é oferecido em todos os navegadores. |
| **GPS não aparece no cartão** | Marque **Incluir coordenadas GPS** e confirme que a medição original registrou localização. |
| **Tela apagando durante a medição** | Mantenha o app aberto e a tela ativa. Desative a economia de bateria agressiva para o Chrome/app, se necessário. |

---

## 15. Perguntas frequentes

**O app mede em dB(A) ou dB SPL?**

Mede um nível aproximado em dB, sem ponderação em frequência. Não é dB(A). É uma estimativa útil, não uma medida certificada.

**Posso usar o resultado como laudo ou prova legal?**

Não. Para fins legais ou ocupacionais (por exemplo, NR-15), use um decibelímetro calibrado e profissional.

**Por que o valor varia entre celulares?**

Cada modelo tem um microfone e um processamento de áudio diferentes. Calibre com um instrumento de referência.

**O app grava minha voz ou o som ambiente?**

Não. O áudio é analisado em tempo real e descartado; só o valor em dB é guardado.

**Funciona sem internet?**

Sim, depois do primeiro acesso.

**Funciona no iPhone?**

O app foi pensado para Chrome no Android. Em outros navegadores, o comportamento de microfone, localização e instalação pode variar.

**Qual a diferença entre média e valor instantâneo?**

O instantâneo é o nível naquele momento. A média considera toda a duração da medição e é mais estável.

**Como a média é calculada?**

Pela energia sonora (média logarítmica em dB, equivalente ao nível equivalente, ou Leq), e não pela média simples dos números.

**Posso editar a observação depois de salvar?**

Sim, a qualquer momento, no Histórico. As alterações são salvas automaticamente.

**Posso levar meus registros e fotografias para outro celular?**

Sim. Exporte um JSON com as fotografias no aparelho antigo, transfira o arquivo e importe no novo. Confirme o resultado antes de apagar os originais.

**A foto fica dentro do JSON?**

Sim. Na versão 1.3, a fotografia pode ser incorporada ao registro exportado como uma string Base64.

**A imagem compartilhada revela minha localização?**

Por padrão, **não**. A inclusão de coordenadas GPS no cartão depende de marcar a opção correspondente. Isso não elimina possíveis informações de localização presentes em uma fotografia original.

**Posso compartilhar sem internet?**

Você pode gerar e salvar o PNG offline. O envio por aplicativos de mensagens ou redes sociais pode exigir conexão.

**A imagem de compartilhamento tem um link clicável?**

Não. O endereço escrito dentro do PNG é texto visual. Quando suportado, o compartilhamento nativo também envia o link em texto separado.

**Por que o botão de instalação às vezes mostra instruções?**

Porque nem todo navegador oferece o evento de instalação nativa. O aplicativo apresenta uma alternativa manual.

---

## 16. Referência técnica

### Como o nível é calculado

1. O microfone é aberto com cancelamento de eco, supressão de ruído e ganho automático **desativados**, em canal mono.
2. A cada **100 ms**, o app lê um bloco de **2048 amostras** pela Web Audio API (`AnalyserNode`).
3. Calcula o valor eficaz (RMS) do bloco e converte para dB relativos ao fundo de escala: `dBFS = 20 · log10(RMS)`.
4. Soma o **offset de calibração**: `nível = dBFS + offset`, limitado a 0–140 dB.
5. Aplica suavização na energia (`0,4 · novo + 0,6 · anterior`), semelhante à resposta "Fast" dos decibelímetros.
6. O valor exibido é esse nível suavizado; a barra cobre 0–120 dB.
7. Mínimo, máximo e **média de energia** (`10 · log10(média de 10^(nível/10))`) são acumulados a cada leitura.

### Correção do indicador mínimo

A versão 1.3 trata o mínimo como o menor **valor válido efetivamente observado** na sessão. Isso evita que o indicador permaneça artificialmente em `0,0 dB` por causa da inicialização da variável antes da primeira leitura.

### Formato do arquivo JSON

Exemplo simplificado da estrutura de um registro exportado:

```json
{
  "app": "Shunfenger Sound Level Meter",
  "version": 2,
  "exportedAt": "2026-11-04T13:30:00.000Z",
  "records": [
    {
      "id": "m3k9x2ab1",
      "ts": 1793799000000,
      "mode": "30",
      "duration": 30.1,
      "value": 62.4,
      "avg": 62.4,
      "min": 55.1,
      "max": 71.8,
      "level": "moderate",
      "lat": -23.55052,
      "lon": -46.63331,
      "acc": 12.0,
      "note": "Sala de aula"
    }
  ],
  "photos": {
    "m3k9x2ab1": "data:image/jpeg;base64,/9j/4AAQ..."
  }
}
```

O exemplo acima foi abreviado para facilitar a leitura. A fotografia real contém uma sequência Base64 muito maior.

| Campo | Descrição |
|---|---|
| `app` | Identificação do aplicativo que gerou o backup. |
| `version` | Versão do formato de exportação JSON. |
| `exportedAt` | Data e hora da exportação em formato ISO 8601. |
| `records` | Lista dos registros de medição. |
| `photos` | Objeto opcional com fotografias codificadas em Base64, indexadas pelo identificador do registro. |
| `id` | Identificador único do registro. |
| `ts` | Data e hora de início, em milissegundos desde 1970 (UTC). |
| `mode` | `cont`, `10`, `20` ou `30`. |
| `duration` | Duração real da medição, em segundos. |
| `value` | Valor registrado em dB (instantâneo no modo Contínuo; média nos demais). |
| `avg`, `min`, `max` | Média de energia, mínimo e máximo da medição, em dB. |
| `level` | `safe`, `moderate`, `high` ou `critical`. |
| `lat`, `lon`, `acc` | Latitude, longitude e precisão (m). `null` se indisponível. |
| `note` | Observação do usuário (até 50 caracteres). |

Ao importar, o aplicativo aceita registros válidos e evita duplicações por identificador. Quando o backup contém fotografias, tenta restaurá-las no armazenamento local.

### Armazenamento local

O Shunfenger utiliza dois mecanismos de armazenamento do navegador.

**LocalStorage**

Armazena os registros de medição e algumas preferências do aplicativo.

| Chave | Conteúdo |
|---|---|
| `shunfenger.records.v1` | Lista de registros. |
| `shunfenger.theme.v1` | Tema escolhido (`light` ou `dark`). |
| `shunfenger.cal.v1` | Offset de calibração. |

**IndexedDB**

Armazena as fotografias associadas às medições. Cada imagem é vinculada ao identificador do registro correspondente.

A separação permite manter os registros numéricos leves e armazenar as fotografias em uma estrutura mais apropriada para dados binários.

### Fotografias e imagem compartilhável

As fotografias são armazenadas em **IndexedDB** e associadas ao `id` da medição.

A imagem para compartilhamento é desenhada com **Canvas 2D**, exportada como **PNG de 1080 × 1350 pixels** e pode ser compartilhada pela **Web Share API**, quando suportada.

Sem compartilhamento nativo, o usuário pode salvar a imagem e enviá-la manualmente.

### Tecnologias

- HTML5 e CSS3.
- JavaScript puro (Vanilla JavaScript).
- Web Audio API.
- Geolocation API.
- Screen Wake Lock API.
- IndexedDB.
- LocalStorage.
- Canvas 2D.
- Web Share API.
- Service Worker.
- Web App Manifest.

O aplicativo não depende de bibliotecas externas para suas funções principais. O arquivo DOCX é montado pelo próprio aplicativo.

---

## 17. Estrutura do repositório e publicação

```text
Shunfenger-Sound-Level-Meter/
├── index.html                 # Interface principal e histórico
├── style.css                  # Estilos, temas e impressão
├── app.js                     # Medições, fotografias e exportações
├── manifest.json              # Configuração do PWA
├── sw.js                      # Service Worker e funcionamento offline
├── logo.svg                   # Logotipo vetorial
├── logo.png                   # Logotipo PNG
├── favicon.ico                # Ícone do navegador
├── splash.png                 # Imagem de abertura
├── icon-192.png               # Ícone PWA 192×192
├── icon-512.png               # Ícone PWA 512×512
├── icon-maskable-512.png      # Ícone adaptável
├── Shunfengercover.png        # Imagem de capa do manual
└── README.md                  # Manual completo
```

### Publicar no GitHub Pages

1. Envie os arquivos para a raiz do repositório.
2. Em **Settings › Pages**, selecione a branch `main` e a pasta `/ (root)`.
3. Aguarde a publicação.
4. Acesse o endereço oficial:

<https://magpe-stack.github.io/Shunfenger-Sound-Level-Meter/>

### Publicar uma nova versão

1. Altere os arquivos necessários.
2. Em `sw.js`, atualize o identificador de cache utilizado pelo Service Worker, conforme a constante existente no código.
3. Envie as alterações ao GitHub.
4. Aguarde a publicação.
5. Feche e reabra o aplicativo para carregar a versão atualizada.

Se o navegador continuar exibindo uma versão antiga, pode ser necessário aguardar a atualização do Service Worker.

**Atenção:** limpar os dados do site pode excluir medições e fotografias. Faça um backup JSON antes de executar esse procedimento.

---

## 18. Aviso importante

O Shunfenger Sound Level Meter é uma ferramenta de **informação e conscientização**.

As medições são **aproximadas**, feitas com o microfone de um smartphone, sem ponderação em frequência e sem calibração de fábrica.

Elas **não substituem** um decibelímetro calibrado conforme a norma IEC 61672, nem servem como laudo técnico, pericial ou ocupacional.

A classificação de risco apresentada pelo aplicativo é simplificada e não considera, por si só, todos os fatores necessários para avaliar a exposição sonora.

Em caso de desconforto, zumbido ou perda de audição, procure um profissional de saúde, como otorrinolaringologista ou fonoaudiólogo.

---

## 19. Compartilhamento de cartões de medição

A versão 1.3 permite transformar **cada medição individual** em uma imagem vertical de **1080 × 1350 pixels**, apropriada para enviar em aplicativos de mensagens e publicar em redes sociais.

### O que aparece no cartão

- Identidade visual e nome **Shunfenger Sound Level Meter**.
- Nível sonoro registrado em dB e classificação.
- Indicadores **Mínimo**, **Médio** e **Máximo**.
- Data e hora, modo e duração da medição.
- Fotografia vinculada, caso exista.
- Observação, quando preenchida, sujeita ao espaço disponível.
- Coordenadas GPS **somente quando autorizadas na opção de compartilhamento** e disponíveis no registro.
- Chamada para instalar o aplicativo e endereço oficial.

### Como compartilhar

1. Abra **Histórico** e encontre a medição.
2. Toque em **Compartilhar**.
3. Confira a prévia do cartão.
4. Para mostrar a localização, marque **Incluir coordenadas GPS**. A opção começa **desmarcada**.
5. Escolha **Compartilhar** para abrir o painel nativo, **Salvar imagem** para obter o PNG ou **Copiar texto/link** para compartilhar as informações em texto.

Se o dispositivo não aceitar compartilhamento de arquivos pela Web Share API, o aplicativo poderá compartilhar apenas texto/link ou oferecer o salvamento do PNG. O resultado depende do navegador.

### Cuidados antes de publicar

A fotografia pode mostrar rostos, placas, documentos ou outros detalhes privados. Confira a imagem e a observação antes de compartilhar.

O GPS é omitido do cartão por padrão, mas a localização pode ser inferida por elementos visuais da foto.

### Limitações

O cartão é uma **imagem estática**, não um relatório interativo.

O endereço do aplicativo desenhado no rodapé não é clicável.

O recurso é informativo e não torna a medição certificada.

---

## 20. Novidades da versão 1.3 e checklist de testes

### Resumo das novidades

- Fotografias associadas aos registros do histórico, com armazenamento em IndexedDB.
- Exportação JSON com fotografias incorporadas e importação para recuperação dessas imagens.
- Cartão PNG vertical para compartilhar medições individuais.
- Controle de privacidade para incluir ou ocultar coordenadas GPS no cartão.
- Botão flutuante de instalação com alternativa de instruções manuais.
- Tratamento do valor mínimo para evitar que uma inicialização em zero distorça o indicador.

### Testes recomendados antes de depender dos dados

- [ ] Iniciar e encerrar medições em todos os modos.
- [ ] Confirmar que **Mínimo**, **Médio** e **Máximo** recebem valores válidos.
- [ ] Adicionar, abrir, substituir e remover uma fotografia.
- [ ] Criar um cartão com foto e outro sem foto.
- [ ] Confirmar que o GPS não aparece na imagem quando a opção está desmarcada.
- [ ] Salvar um PNG e verificar suas dimensões.
- [ ] Exportar JSON, importar em outro navegador ou dispositivo e verificar se a foto reaparece.
- [ ] Imprimir ou salvar um relatório em PDF.
- [ ] Testar o botão **Instalar grátis**.
- [ ] Testar o funcionamento sem conexão depois de instalar ou carregar o PWA.

**Estado de validação:** este manual descreve os recursos previstos e implementados no código da versão 1.3. A compatibilidade completa ainda precisa ser confirmada em testes reais no dispositivo e no navegador utilizados.

---

Feito com 💜 · Paleta: `#873ff3` · `#000000` · `#ffffff` · `#B487F7` · `#E1CFFC`
