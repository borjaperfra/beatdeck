import type { SceneDef } from 'beatdeck';

/** The 8 scenes / 47 beats of v3, with source-slide mapping for the presenter view (see docs/CONTENT-AUDIT.md). */
export const SCENES: SceneDef[] = [
  {
    id: '01', title: 'BOOT',
    beats: [
      { name: 'standby', ref: 'slide 01', source: '—', note: 'Pantalla en espera. Un clic arranca el boot (~9 s automático hasta el título).' },
      { name: 'boot', auto: true, ref: 'slide 01', source: '—', note: 'Automático: log de arranque + sudo rm -rf /boring_talks.' },
      { name: 'wordmark', auto: true, ref: 'slide 01', source: 'KERNEL PANIC · Madrid · 06 oct', note: 'Automático: wordmark del evento, luego el título.' },
      { name: 'title', ref: 'slide 01', source: 'Escalando inferencia · de 0 a +1000 usuarios · Cristian Córdova, Founder & CEO de Helmcode' },
    ],
  },
  {
    id: '02', title: 'ORIGIN',
    beats: [
      { name: 'una idea bastante mala', ref: 'slide 02', source: 'Con Twitter empezó todo…' },
      { name: 'tweet', ref: 'slide 02', source: 'Tweet de @barckcode · 10 abr. 2026 · 108,7 mil visualizaciones' },
      { name: 'strip ui', ref: 'slide 02', source: 'Con Twitter empezó todo…' },
      { name: 'isolate', ref: 'slide 02', source: '"…un buen server privado con GPUs para poder quemar tokens como locos con modelos locales."' },
      { name: 'zoom: ollama', ref: 'slide 02', source: '"…con Ollama en 2 minutos…"' },
      { name: '¿ollama? wtf', ref: 'slide 03', source: '¿Ollama? Wtf…' },
    ],
  },
  {
    id: '03', title: 'LOCAL ≠ SELF-HOSTED',
    beats: [
      { name: '5', ref: 'slide 04–05', source: 'Local VS Self-hosted' },
      { name: '15', ref: 'slide 04–05', source: 'Local VS Self-hosted' },
      { name: '30', ref: 'slide 04–05', source: 'Local VS Self-hosted' },
      { name: '50', ref: 'slide 04–05', source: 'Local VS Self-hosted' },
      { name: '75', ref: 'slide 05', source: '~5 procesos concurrentes vs ~75 procesos concurrentes' },
      { name: 'labels', ref: 'slide 04–05', source: 'Local VS Self-hosted' },
      { name: 'vllm / sglang', ref: 'slide 06', source: 'Motores de inferencia Enterprise · vLLM · SGLang' },
      { name: 'litellm / bifrost', ref: 'slide 07', source: 'Gobernanza · LiteLLM · Bifrost' },
    ],
  },
  {
    id: '04', title: 'BURN TOKENS',
    beats: [
      { name: 'hardware', ref: 'slide 09', source: '¿Qué hardware (GPUs) necesitamos?' },
      { name: 'modelos', ref: 'slide 10', source: '¿Qué modelos queremos correr?' },
      { name: 'qué hacer', ref: 'slide 11', source: '¿Qué queremos hacer con la IA?' },
      { name: 'burn', tolerance: 8, ref: 'slide 12', source: 'Queremos quemar tokens para crear cosas con código' },
      { name: 'qwencito', ref: 'slide 13', source: 'Qwencito para los amigos · Qwen3.6-35B-A3B open-source release' },
    ],
  },
  {
    id: '05', title: 'ARCHITECTURE',
    beats: [
      { name: 'rtx 6000 pro', ref: 'slide 14', source: 'Nuestra primera GPU · NVIDIA RTX PRO 6000' },
      { name: 'vllm', ref: 'slide 15', source: 'Nuestra primera arquitectura (~25 users)' },
      { name: 'litellm', ref: 'slide 15', source: 'Nuestra primera arquitectura (~25 users)' },
      { name: 'nginx', ref: 'slide 15', source: 'Nuestra primera arquitectura (~25 users)' },
      { name: '~25 users', ref: 'slide 15', source: 'Nuestra primera arquitectura (~25 users)' },
      { name: 'requests', ref: 'slide 15', source: 'Linux Server: Nginx → LiteLLM → vLLM → RTX 6000 PRO (Qwencito)' },
    ],
  },
  {
    id: '06', title: 'SCALE',
    beats: [
      { name: 'waitlist', auto: true, ref: 'slide 16', source: 'La waitlist no para de crecer', note: 'Automático: usuarios 25 → 100.' },
      { name: 'server_02', ref: 'slide 17', source: 'Primera evolución (~100 users activos)' },
      { name: 'reyes magos', ref: 'slide 18', source: 'Carta a los reyes magos' },
      { name: 'server_03', ref: 'slide 19', source: 'Múltiples modelos · server 03 con Gemma4' },
      { name: 'warnings', auto: true, ref: 'slide 20', source: '1. No hay HA en puntos críticos · 2. Meter/quitar modelos supone caída de servicio · 3. Todo dependía del server 01' },
      { name: 'kernel panic', auto: true, ref: 'new', source: 'Nuevo: fallo de 520 ms → pantalla de kernel panic', note: 'Tras el fallo queda el mensaje del kernel sobre negro. Siguiente clic = reboot.' },
    ],
  },
  {
    id: '07', title: 'REBUILD',
    beats: [
      { name: 'reboot', ref: 'new', source: '> reboot_' },
      { name: 'cloudflare + kubernetes', ref: 'slide 21', source: 'El combo para escalar · Cloudflare + Kubernetes' },
      { name: 'cloudflare layer', ref: 'slide 22', source: 'Cloudflare: DNS · Cloudflared · Rutas · Workers' },
      { name: 'kubernetes', ref: 'slide 22', source: 'Kubernetes: Cloudflared · Traefik · api.nan.builders · LiteLLM (Fork) · CNPG · Valkey · Grafana · Victoria Metrics · vLLM' },
      { name: 'traffic', ref: 'slide 22', source: 'Parte de la arquitectura actual' },
    ],
  },
  {
    id: '08', title: 'FINALE',
    beats: [
      { name: '~5 meses', ref: 'slide 23', source: 'En ~5 meses' },
      { name: '900+', ref: 'slide 23', source: '+900 usuarios' },
      { name: '80+', ref: 'slide 23', source: '+80 países' },
      { name: '10+', ref: 'slide 23', source: '+10 modelos (no solo LLMs)' },
      { name: '50B tokens', auto: true, ref: 'slide 23', source: 'Procesamos casi 50B de tokens en un solo día · This is Fine', note: 'Automático: contador ~4,6 s, luego "this is fine".' },
      { name: 'still scaling', ref: 'new', source: '> still scaling._' },
      { name: 'q&a', tolerance: 8, ref: 'slide 24', source: '¡Muchas gracias! · Cristian Córdova, Founder & CEO de Helmcode · @barckcode · QR' },
    ],
  },
];
