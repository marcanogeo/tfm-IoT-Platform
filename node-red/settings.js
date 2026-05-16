module.exports = {
    // ── Puerto y host ─────────────────────────────────────────────
    uiPort: process.env.PORT || 1880,
    uiHost: "0.0.0.0",

    // ── Seguridad: tiempo de inactividad ──────────────────────────
    httpAdminRoot: '/',
    httpNodeRoot: '/',

    // ── Directorio de datos ───────────────────────────────────────
    userDir: '/data',
    flowFile: 'flows.json',

    // ── Habilitar módulos externos en nodos function ──────────────
    functionExternalModules: true,

    // ── Contexto global: acceso a fs y otros módulos Node.js ──────
    functionGlobalContext: {
        fs: require('fs'),
        path: require('path')
    },

    // ── Logging ───────────────────────────────────────────────────
    logging: {
        console: {
            level: "info",
            metrics: false,
            audit: false
        }
    },

    // ── Editor ───────────────────────────────────────────────────
    editorTheme: {
        projects: {
            enabled: false
        },
        page: {
            title: "TFM - IoT Platform"
        }
    },

    // ── CORS para los endpoints HTTP ──────────────────────────────
    httpNodeCors: {
        origin: "*",
        methods: "GET,PUT,POST,DELETE"
    },

    // ── Exportar nodos de forma segura ────────────────────────────
    exportGlobalContextKeys: false,

    // ── Timezone ──────────────────────────────────────────────────
    // Se toma del entorno: TZ=Europe/Madrid en docker-compose
}
