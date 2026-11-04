# 🌬️ Shunfenger Sound Level Meter

> **順風耳 · Shunfeng'er — "A Orelha que Acompanha o Vento"**
>
> Na mitologia chinesa, Shunfeng'er é a divindade celestial capaz de ouvir qualquer som levado pelo vento. Ao lado de Qianliyan, o "Olho de Mil Léguas", ele serve como guardião da deusa Mazu, protetora dos navegantes. Este aplicativo herda um pouco dessa escuta atenta: perceber cada ruído ao redor para cuidar da sua saúde auditiva.

**Shunfenger Sound Level Meter** é um decibelímetro em formato PWA (Progressive Web App), *mobile-first* e *offline-first*, feito em Vanilla JavaScript. Usa a **Web Audio API** e a **Geolocation API** reais do navegador, sem simulações.

🔗 **App online:** <https://magpe-stack.github.io/Shunfenger-Sound-Level-Meter/>

---

## 📁 Estrutura do repositório

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
└── README.md
```

## 🚀 Publicação (GitHub Pages)

1. Envie todos os arquivos para a raiz do repositório.
2. Em **Settings › Pages**, selecione a branch `main` e a pasta `/ (root)`.
3. Abra a URL no Chrome do Android e escolha **Instalar app** (ou use o menu **Arquivo › Instalar aplicativo**).

> O acesso ao microfone e à localização exige **HTTPS** (já fornecido pelo GitHub Pages).

## 📖 Manual de uso

*O manual completo será detalhado em breve.*

---

Feito com 💜 · Paleta: `#873ff3` · `#000000` · `#ffffff` · `#B487F7` · `#E1CFFC`
