# UXIA — passagem de contexto (para outra sessão do Claude)

## Repositórios

| Repo | Branch | Conteúdo |
|---|---|---|
| https://github.com/ueverton-xavier/UX-gen | `main` | **App publicado** (GitHub Pages: https://ueverton-xavier.github.io/UX-gen/) |
| https://github.com/ueverton-xavier/ERP-Pessoal | `ccr-6a850273-kvsku9` | Espelho do app em `flux-gerador/` + doc de arquitetura `docs/10-app-imagem-flux-arquitetura.md` |

Fonte da verdade: **UX-gen/main**. Publicar = commit + push em `main` (Pages republica em ~1 min).
Ao mudar o app, subir `VERSAO` em `index.html` **e** `version.json` juntos (o app mostra "Nova versão → Atualizar agora").

## O que é o app

PWA de arquivo único (`index.html`), interface de chat estilo mensageiro, para gerar imagem e vídeo.
Instalado no Android do usuário (APK via PWABuilder e/ou "Instalar app" do Chrome). Versão atual: **v23**.

Arquivos: `index.html` (app inteiro), `manifest.webmanifest`, `sw.js` (sem cache, página sempre da rede),
`icon-192.png`, `icon-512.png`, `version.json`, `RUNPOD.md` (guia de instalação da GPU).

### Provedores no seletor de modelos
- **Hugging Face Spaces** via `@gradio/client@2.7.1` (`record_history: false`): FLUX.1 dev / schnell / Kontext,
  CogVideoX 5B, AnimateDiff Lightning, LTX-Video. Chamada adaptativa: lê `view_api()`, escolhe o endpoint que
  devolve mídia e preenche só os parâmetros existentes (estilo "realista", modo text/image-to-video etc.).
  Limite: cota ZeroGPU **por conta**, compartilhada entre todos os Spaces.
- **Pollinations** (FLUX, chave opcional) e **Together** (`FLUX.1-schnell-Free`, chave) — troca automática quando a cota do HF acaba.
- **Civitai Orchestration** (`POST /v2/consumer/workflows`): imagem com `imageGen` (`engine: flux2`, `model: klein`,
  com variações se a validação recusar) ou `textToImage` com AIR de checkpoint SDXL + LoRAs (`additionalNetworks`);
  vídeo `videoGen` `engine: wan`. **Confirmado funcionando pelo usuário** (gerou imagem). O vídeo Wan do Civitai ainda não foi confirmado.
- **Minha GPU (RunPod)** — Serverless `runpod/worker-comfyui`, `POST /v2/{id}/run` + poll `/status/{id}`.
  Fluxos prontos: **Wan 2.2 TI2V 5B** (padrão; 1280×704, texto ou imagem→vídeo via `Wan22ImageToVideoLatent.start_image`)
  e Wan 2.1 T2V 1.3B. Nós conferidos contra o código atual do ComfyUI. **Não testado em GPU real ainda.**

### Privacidade (requisito do usuário: não gravar nada no aparelho sem pedir)
Tudo em memória. Opt-in em Ajustes: "Lembrar token e chaves" (localStorage), "Guardar conversa" (IndexedDB).
"Salvar" baixa o arquivo e registra só o SHA-256 da imagem fictícia (para reconhecê-la se reenviada).

### Travas de conteúdo (decisão mantida — não remover)
1. Conteúdo sexual envolvendo menores: sempre bloqueado.
2. Nudez/despir/sexual a partir de **foto enviada pelo clipe**: bloqueado (pode ser pessoa real sem consentimento).
   Liberado para imagens **geradas pelo próprio app só com texto** (marcadas em memória / por SHA-256 ao salvar).
Conteúdo adulto de pessoas fictícias descrito só com texto não é bloqueado pelo app.

## Estado da RunPod (do usuário)

- Network Volume criado: **`cool_maroon_planarian`**, ID `i6vd7d2l3y`, região **US-CA-2**, **10 GB → precisa aumentar para 30 GB**.
- Pendente: Pod temporário para baixar os modelos (comandos em `RUNPOD.md`), apagar o Pod, criar endpoint Serverless
  (`runpod/worker-comfyui` base, GPU 24 GB+, Active 0 / Max 1, timeout 900 s), criar API Key, colar Endpoint ID + key no app.
- Guia oficial de agente da Runpod: https://agents.runpod.io/ — no Claude Code:
  `claude plugin marketplace add runpod/runpod-plugins-official` e `claude plugin install runpod@runpod`, depois `/mcp` → runpod → Sign in.

## Não verificado / atenção
- Tag exata da imagem `runpod/worker-comfyui` e se ela lê modelos em `/runpod-volume/models/...` (erro `Value not in list: unet_name` indica caminho/nome errado).
- Formato do `videoGen` (Wan) do Civitai: o app tenta campos `images` / `sourceImage` / `imageUrl` / `image`; ajustar pelo erro de validação.
- Nomes dos Spaces do HF podem mudar (ex.: THUDM → zai-org no CogVideoX).

## Testes locais usados (não estão no repo)
Playwright + mocks do `@gradio/client` e das APIs (Civitai, RunPod, Pollinations, Together), e um servidor Gradio 6 real
para validar o client. Antes de publicar: checar sintaxe do `<script type="module">` e rodar os cenários.
