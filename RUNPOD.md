# UXIA + RunPod Serverless (Wan 2.1 1.3B)

Roda o modelo numa GPU sua, pagando só os segundos de uso. O UXIA chama o endpoint
`runpod/worker-comfyui` com um fluxo do ComfyUI pronto (Wan 2.1 T2V 1.3B, texto → vídeo, ~5 s, 832×480).

> O Wan 2.1 **1.3B faz só texto → vídeo**. Para animar uma imagem, use um fluxo imagem → vídeo
> (ex.: Wan 2.2 TI2V 5B ou Wan 2.1 I2V 14B) colado no campo "fluxo ComfyUI" do app, com `{{IMAGE}}` no nó LoadImage.

## 1. Network Volume (onde ficam os modelos)

RunPod → **Storage → New Network Volume** → ~20 GB, mesma região que vai usar no endpoint.

## 2. Baixar os modelos para o volume (uma vez)

Crie um **Pod** barato (CPU basta) com o volume anexado; ele monta em `/workspace`. No terminal do Pod:

```bash
cd /workspace && mkdir -p models/diffusion_models models/text_encoders models/vae
B=https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files
wget -O models/diffusion_models/wan2.1_t2v_1.3B_fp16.safetensors $B/diffusion_models/wan2.1_t2v_1.3B_fp16.safetensors
wget -O models/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors $B/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors
wget -O models/vae/wan_2.1_vae.safetensors $B/vae/wan_2.1_vae.safetensors
```

Depois **apague o Pod** (o volume continua). No Serverless o volume aparece em `/runpod-volume`,
e o worker-comfyui procura os modelos em `/runpod-volume/models/...`.

## 3. Endpoint Serverless

RunPod → **Serverless → New Endpoint**:

- **Imagem Docker:** `runpod/worker-comfyui` (versão mais recente, variante `base`).
- **Network Volume:** o do passo 1.
- **GPU:** 16 GB ou mais (ex.: RTX 4000 Ada / A4000 / L4) é suficiente para o 1.3B.
- **Active Workers: 0** · **Max Workers: 1** → desliga sozinho quando parado.
- **Execution timeout:** 600 s ou mais (vídeo + cold start).

Anote o **Endpoint ID**. Em **Settings → API Keys**, crie uma chave.

## 4. No UXIA

⋮ Ajustes → **RunPod — Endpoint ID** e **API Key** (marque "Lembrar token e chaves") → Pronto.
Escolha **Minha GPU (RunPod)** no seletor e escreva o prompt (em inglês rende melhor).

- Formato **Retrato** gera 480×832; os outros, 832×480.
- A primeira chamada após um tempo parado demora mais (cold start: ligar a GPU e carregar o modelo).
- Se aparecer `Value not in list: unet_name` (ou similar), o nome/pasta do arquivo no volume não bate com o fluxo.

## Fluxo próprio

No ComfyUI: **Workflow → Export (API)** e cole o JSON no campo "fluxo ComfyUI".
Marcadores trocados pelo app: `{{PROMPT}}`, `{{NEGATIVE}}`, `{{SEED}}`, `{{WIDTH}}`, `{{HEIGHT}}`, `{{IMAGE}}`.
