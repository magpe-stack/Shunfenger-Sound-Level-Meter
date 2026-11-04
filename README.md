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
7. [Histórico e observações](#7-histórico-e-observações)
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

---

## 1. Visão geral

O Shunfenger mede o nível de pressão sonora do ambiente usando o microfone do celular, mostra o valor em decibéis (dB) em tempo real, classifica o risco para a audição e permite salvar cada medição com **data/hora**, **localização (latitude/longitude)**, **classificação** e uma **observação** sua.

**Principais recursos**

- Medição em tempo real, com visor numérico grande e barra de nível.
- Quatro modos de medida: **Contínuo**, **10 s**, **20 s** e **30 s**.
- Valores **mínimo**, **médio** e **máximo** de cada medição.
- Classificação em quatro faixas (Seguro, Moderado, Alto e Crítico).
- Histórico salvo no próprio aparelho, com exclusão e campo de observação de até 50 caracteres.
- Exportação em **JSON, Markdown, TXT e DOCX**, além de **impressão / PDF** em folha A4.
- Importação de backups em JSON.
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

### Instalar no celular (Chrome para Android)

1. Abra <https://magpe-stack.github.io/Shunfenger-Sound-Level-Meter/> no Chrome.
2. Use uma das opções:
   - **Arquivo › Instalar aplicativo** (aparece quando o Chrome oferece a instalação); ou
   - Menu **⋮** do Chrome › **Instalar app** (ou **Adicionar à tela inicial**).
3. Confirme. O ícone do Shunfenger aparece na tela inicial e o app abre em tela cheia, sem barra de endereço.

> Se a opção de instalar não aparecer, abra o menu ⋮ do Chrome e procure "Instalar app". Ela pode não aparecer se o app já estiver instalado.

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

## 7. Histórico e observações

Toque em **Histórico** na barra inferior. Esta tela tem **rolagem** e lista os registros do mais recente ao mais antigo.

### Cada cartão mostra

- **Valor em dB** em destaque.
- **Classificação** com emoji.
- **Data e hora** da medição.
- **Modo** e valores **mín / máx**.
- **📍 Localização:** latitude e longitude com 5 casas decimais e a precisão estimada, por exemplo `-23.55052, -46.63331 (±12 m)`. Sem localização, aparece "Localização indisponível".
- **Campo de observação.**
- **🗑 Botão de excluir.**

### Campo de observação

- Escreva uma nota curta sobre aquele registro, de até **50 caracteres** (por exemplo: "Sala de aula, janela aberta").
- Um contador (`12/50`) mostra quantos caracteres você já usou.
- O texto é **salvo automaticamente** enquanto você digita; não há botão de salvar. Toque em **Enter** no teclado para fechá-lo.
- A observação é incluída em todas as exportações e na impressão.

### Excluir

- **🗑 no cartão:** exclui apenas aquele registro, sem pedir confirmação.
- **Apagar tudo** (canto superior direito da tela): apaga **todos** os registros, com uma confirmação antes. **Não dá para desfazer.** Exporte um JSON antes se quiser guardar uma cópia.

---

## 8. O menu Arquivo

Toque no botão **📁** no cabeçalho. O menu abre como uma folha na parte inferior da tela; toque fora dela ou no **✕** para fechar.

| Item | O que faz |
|---|---|
| ➕ **Novo registro** | Volta à tela principal e **inicia uma medição** no modo selecionado. |
| 📥 **Importar (JSON)** | Restaura registros de um backup `.json` exportado pelo app. |
| 🗂️ **Exportar JSON** | Backup completo dos registros. |
| 📝 **Exportar Markdown (.md)** | Relatório formatado em tabela. |
| 📄 **Exportar TXT** | Relatório em texto puro. |
| 📘 **Exportar DOCX** | Relatório para abrir no Word, Google Docs ou LibreOffice. |
| 🖨️ **Imprimir / Salvar PDF** | Abre a impressão do Chrome com layout A4 limpo. |
| 📲 **Instalar aplicativo** | Aparece só quando o Chrome permite instalar o app. |
| 🌬️ **Sobre o Shunfenger** | Significado do nome, calibração e atalho para este manual. |

Se não houver registros, as exportações e a impressão avisam "Não há registros para exportar".

---

## 9. Exportação, relatórios e backup

### Onde ficam os arquivos exportados

Os arquivos são baixados pelo Chrome para a pasta **Downloads** do celular, com nome no formato `shunfenger-AAAAMMDD-HHMM.extensão` (por exemplo, `shunfenger-20261104-1030.docx`).

### Formatos

| Formato | Para que usar | Conteúdo |
|---|---|---|
| **JSON** | Backup e restauração | Todos os campos de cada registro, incluindo `id`, valores numéricos e coordenadas. |
| **Markdown (.md)** | Publicar em GitHub, wikis e blocos de notas | Tabela com Data/Hora, dB, Classificação, Modo, Mín / Máx, Localização e Observação. |
| **TXT** | Leitura rápida, e-mail, mensagens | Um bloco de texto por registro. |
| **DOCX** | Uso profissional, relatórios | Documento em A4 paisagem com tabela e aviso de precisão. |
| **Impressão / PDF** | Entregar em papel ou arquivo | Tabela em folha A4 com aviso de precisão. |

### Gerar um PDF

1. Abra **Arquivo › Imprimir / Salvar PDF**.
2. Na tela de impressão do Chrome, em **Destino**, escolha **Salvar como PDF** (ou uma impressora).
3. Confirme. O layout da página é preparado automaticamente para A4.

### Backup e restauração

- **Fazer backup:** Arquivo › **Exportar JSON** e guarde o arquivo (nuvem, e-mail, outro aparelho).
- **Restaurar:** Arquivo › **Importar (JSON)** e escolha o arquivo.
- A importação **soma** os registros aos que já existem, sem apagar nada. Registros com o mesmo identificador não são duplicados; o app informa quantos foram importados e quantos já existiam.
- Arquivos que não sejam JSON do app, ou sem registros válidos, são recusados com um aviso.

> Os registros ficam apenas neste aparelho e neste navegador. **Limpar os dados do site** no Chrome apaga o histórico. Faça backups com frequência se os dados forem importantes.

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
- Use os valores como **indicação aproximada**, ótima para comparar ambientes e acompanhar mudanças, mas não como medida certificada (norma IEC 61672).

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
- O app **não envia nenhum dado** para servidores. Medições, localização e observações ficam no **armazenamento local do navegador (`localStorage`)**.
- A localização só é lida **quando você inicia uma medição** e só se você permitir.
- Para apagar tudo: use **Apagar tudo** no Histórico, ou limpe os dados do site nas configurações do Chrome.
- Arquivos exportados (JSON, DOCX etc.) contêm suas coordenadas e observações; compartilhe com cuidado.

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
| **Não consigo instalar** | Use o menu ⋮ do Chrome › Instalar app. Verifique se já não está instalado. |
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

**Posso levar meus registros para outro celular?**
Sim. Exporte um JSON no aparelho antigo e importe no novo.

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

### Formato do arquivo JSON

```json
{
  "app": "Shunfenger Sound Level Meter",
  "version": 1,
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
  ]
}
```

| Campo | Descrição |
|---|---|
| `id` | Identificador único do registro. |
| `ts` | Data e hora de início, em milissegundos desde 1970 (UTC). |
| `mode` | `cont`, `10`, `20` ou `30`. |
| `duration` | Duração real da medição, em segundos. |
| `value` | Valor registrado em dB (instantâneo no modo Contínuo; média nos demais). |
| `avg`, `min`, `max` | Média de energia, mínimo e máximo da medição, em dB. |
| `level` | `safe`, `moderate`, `high` ou `critical`. |
| `lat`, `lon`, `acc` | Latitude, longitude e precisão (m). `null` se indisponível. |
| `note` | Observação do usuário (até 50 caracteres). |

Ao importar, o app aceita um arquivo com a lista `records` (ou uma lista direta de registros) e exige, no mínimo, `ts` e `value` numéricos.

### Armazenamento local

| Chave (`localStorage`) | Conteúdo |
|---|---|
| `shunfenger.records.v1` | Lista de registros. |
| `shunfenger.theme.v1` | Tema escolhido (`light` ou `dark`). |
| `shunfenger.cal.v1` | Offset de calibração. |

### Tecnologias

Vanilla JavaScript, Web Audio API, Geolocation API, Screen Wake Lock API, Service Worker e Web App Manifest. Sem bibliotecas externas: o arquivo DOCX é montado no próprio app.

---

## 17. Estrutura do repositório e publicação

```
Shunfenger-Sound-Level-Meter/
├── index.html                 # Tela principal (sem rolagem) e página de histórico
├── style.css                  # Estilos, temas claro/escuro, splash e @media print
├── app.js                     # Medição, geolocalização, histórico e exportações
├── manifest.json              # Configuração do PWA
├── sw.js                      # Service Worker (offline-first)
├── logo.svg                   # Logo vetorial
├── logo.png                   # Logo 512×512
├── favicon.ico                # Favicon
├── splash.png                 # Imagem de abertura
├── icon-192.png               # Ícone PWA 192×192
├── icon-512.png               # Ícone PWA 512×512
├── icon-maskable-512.png      # Ícone PWA "maskable"
└── README.md                  # Este manual
```

### Publicar no GitHub Pages

1. Envie todos os arquivos para a raiz do repositório.
2. Em **Settings › Pages**, selecione a branch `main` e a pasta `/ (root)`.
3. Aguarde a publicação e acesse <https://magpe-stack.github.io/Shunfenger-Sound-Level-Meter/>.

### Publicar uma nova versão

1. Altere os arquivos desejados.
2. Em `sw.js`, aumente o valor de `CACHE_VERSION` (por exemplo, de `v1.1.0` para `v1.1.1`). Isso força os celulares a baixarem a versão nova.
3. Envie as alterações ao GitHub. Os aparelhos atualizam na próxima abertura do app.

---

## 18. Aviso importante

O Shunfenger Sound Level Meter é uma ferramenta de **informação e conscientização**. As medições são **aproximadas**, feitas com o microfone de um smartphone, sem ponderação em frequência e sem calibração de fábrica. Elas **não substituem** um decibelímetro calibrado (IEC 61672), nem servem como laudo técnico, pericial ou ocupacional.

Em caso de desconforto, zumbido ou perda de audição, procure um profissional de saúde (otorrinolaringologista ou fonoaudiólogo).

---

Feito com 💜 · Paleta: `#873ff3` · `#000000` · `#ffffff` · `#B487F7` · `#E1CFFC`
