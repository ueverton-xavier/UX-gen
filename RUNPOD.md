# UXIA + RunPod Serverless (Wan 2.2 TI2V 5B)

Roda o modelo numa GPU sua, pagando só os segundos de uso. O UXIA chama o endpoint
`runpod/worker-comfyui` com fluxos prontos do ComfyUI:

| No app (⋮ → "RunPod — modelo instalado") | Faz | Resolução | GPU |
|---|---|---|---|
| **Wan 2.2 TI2V 5B** (padrão) | texto → vídeo **e** imagem → vídeo | 1280×704, ~5 s a 24 fps | **24 GB+** |
| Wan 2.1 1.3B | só texto → vídeo | 832×480, ~5 s a 16 fps | 16 GB+ |

Com imagem anexada (ou botão **Animar**), o 5B usa a foto como primeiro quadro.

## 1. Network Volume (onde ficam os modelos)

RunPod → **Storage → New Network Volume** → **30 GB**, na mesma região do endpoint (escolha uma região com GPU de 24 GB disponível).

## 2. Baixar os modelos para o volume (uma vez, ~10–20 min)

Crie um **Pod** barato (CPU basta) com o volume anexado; ele monta em `/workspace`. No terminal do Pod:

```bash
cd /workspace && mkdir -p models/diffusion_models models/text_encoders models/vae
W22=https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files
W21=https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files

# Wan 2.2 TI2V 5B (~10 GB) + VAE do 2.2 (~1,4 GB)
wget -O models/diffusion_models/wan2.2_ti2v_5B_fp16.safetensors $W22/diffusion_models/wan2.2_ti2v_5B_fp16.safetensors
wget -O models/vae/wan2.2_vae.safetensors $W22/vae/wan2.2_vae.safetensors

# Codificador de texto (~7 GB) — o mesmo para 2.1 e 2.2
wget -O models/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors $W21/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors

# (Opcional) Wan 2.1 1.3B para testes baratos (~3 GB) + VAE do 2.1
wget -O models/diffusion_models/wan2.1_t2v_1.3B_fp16.safetensors $W21/diffusion_models/wan2.1_t2v_1.3B_fp16.safetensors
wget -O models/vae/wan_2.1_vae.safetensors $W21/vae/wan_2.1_vae.safetensors

ls -lh models/*/
```

Depois **apague o Pod** (o volume continua). No Serverless o volume aparece em `/runpod-volume`,
e o worker-comfyui procura os modelos em `/runpod-volume/models/...`.

## 3. Endpoint Serverless (~5 min)

RunPod → **Serverless → New Endpoint**:

- **Imagem Docker:** `runpod/worker-comfyui` (versão mais recente, variante `base`).
- **Network Volume:** o do passo 1.
- **GPU:** **24 GB ou mais** para o 5B (RTX 4090 / L4 / A5000; A100/H100 são mais rápidas).
- **Active Workers: 0** · **Max Workers: 1** → desliga sozinho quando parado.
- **Execution timeout:** 900 s ou mais (vídeo 720p + cold start).

Anote o **Endpoint ID**. Em **Settings → API Keys**, crie uma chave.

## 4. No UXIA

⋮ Ajustes → **RunPod — Endpoint ID**, **API Key** e **modelo instalado** (marque "Lembrar token e chaves") → Pronto.
Escolha **Minha GPU (RunPod)** no seletor e escreva o movimento (em inglês rende melhor).

- **Primeiro teste:** marque "Vídeo curto de teste" (~2 s, 20 passos) para validar rápido e barato.
- Formato **Retrato** gera vídeo em pé (704×1280); os outros, deitado.
- A primeira chamada demora mais (cold start: baixar a imagem Docker e carregar o modelo).
- Erro `Value not in list: unet_name` (ou `vae_name`, `clip_name`): o nome ou a pasta do arquivo no volume não bate.

## Tempos esperados (estimativa)

| | 24 GB (4090/L4) | A100/H100 |
|---|---|---|
| 5B, ~5 s 720p, 30 passos | 6–10 min | 2–4 min |
| 5B, teste curto (~2 s, 20 passos) | 1–3 min | < 1 min |

## Fluxo próprio

No ComfyUI: **Workflow → Export (API)** e cole o JSON no campo "fluxo ComfyUI próprio".
Marcadores trocados pelo app: `{{PROMPT}}`, `{{NEGATIVE}}`, `{{SEED}}`, `{{WIDTH}}`, `{{HEIGHT}}`, `{{LENGTH}}`, `{{STEPS}}`, `{{IMAGE}}`.
