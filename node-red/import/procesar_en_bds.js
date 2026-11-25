// ── Procesar en BDs ──────────────────────────────────────────────
// Valida el mensaje del ESP32 y lo prepara para InfluxDB (salida 1)
// y para MongoDB / umbrales (salida 2).
// Formato: docs/diccionario_datos_mqtt_tfm.xlsx
const DEBUG = false;
const dbg = (t) => { if (DEBUG) node.warn(t); };

// Campos aceptados: tipo y rango físico del sensor.
// Un valor fuera de rango se descarta (lectura errónea), no el mensaje entero.
const CAMPOS = {
    temperature_c: { min: -40,  max: 85 },      // BME280
    humidity_pct:  { min: 0,    max: 100 },     // BME280
    pressure_hpa:  { min: 300,  max: 1100 },    // BME280
    eco2_ppm:      { min: 400,  max: 65000 },   // ENS160
    tvoc_ppb:      { min: 0,    max: 65000 },   // ENS160
    aqi:           { min: 1,    max: 5 },       // ENS160
    light_lux:     { min: 0,    max: 65535 },   // BH1750
    pm25_ugm3:     { min: 0,    max: 999.9 },   // SDS011 (por ciclos)
    pm10_ugm3:     { min: 0,    max: 999.9 },   // SDS011 (por ciclos)
    // Formato anterior (Wokwi con MQ-2 y LDR). Retirar al migrar al prototipo físico.
    light_raw:       { min: 0, max: 4095, legacy: true },
    gas_mq2_ppm_est: { min: 0, max: 100000, legacy: true }
};
// ens160_status: se acepta texto o el código numérico de getFlags() (SparkFun)
const ESTADOS_ENS160 = ["ok", "warmup", "initial", "invalid"];   // índice = código 0..3
const CAMPOS_ENS160 = ["eco2_ppm", "tvoc_ppb", "aqi"];

// ── Parseo ───────────────────────────────────────────────────────
let p = msg.payload;
if (p === "online" || p === "offline") return null;          // mensajes de estado MQTT
if (Buffer.isBuffer(p)) p = p.toString();
if (typeof p === "string") {
    try { p = JSON.parse(p); } catch (e) { dbg("No es JSON: " + p); return null; }
}
if (!p || typeof p !== "object" || !p.sensors || typeof p.sensors !== "object") {
    dbg("Mensaje sin objeto sensors"); return null;
}

const deviceId = String(p.device_id || "").trim();
if (!deviceId || deviceId.startsWith("ESP32_Node") || deviceId.startsWith("device_")) {
    dbg("device_id vacío o con formato antiguo: " + deviceId); return null;
}
const zone = String(p.zone || "sin_zona");

// ── Timestamp (segundos Unix) ────────────────────────────────────
let ts = p.timestamp;
if (typeof ts === "string") ts = isNaN(Number(ts)) ? Math.floor(Date.parse(ts) / 1000) : Number(ts);
const ahora = Math.floor(Date.now() / 1000);
// Sin NTP el ESP32 envía segundos desde el arranque: se usa la hora del servidor
if (!Number.isFinite(ts) || ts < 1600000000 || ts > ahora + 300) ts = ahora;

// ── Estado del ENS160 ────────────────────────────────────────────
let ens = p.sensors.ens160_status;
if (typeof ens === "number") ens = ESTADOS_ENS160[ens];
if (!ESTADOS_ENS160.includes(ens)) ens = undefined;

// ── Sensores: se guardan solo los valores válidos ────────────────
const sensors = {};
const descartados = [];
for (const [campo, regla] of Object.entries(CAMPOS)) {
    // Mientras el ENS160 no está en "ok" sus lecturas no son fiables: no se guardan
    if (CAMPOS_ENS160.includes(campo) && ens && ens !== "ok") continue;
    if (!(campo in p.sensors) || p.sensors[campo] === null) continue;   // ausente: normal (p. ej. SDS011)
    const v = Number(p.sensors[campo]);
    if (Number.isFinite(v) && v >= regla.min && v <= regla.max) sensors[campo] = v;
    else descartados.push(campo + "=" + p.sensors[campo]);
}
if (ens) sensors.ens160_status = ens;
if (descartados.length) node.warn(`${deviceId}: valores fuera de rango descartados → ${descartados.join(", ")}`);
if (Object.keys(sensors).filter(k => k !== "ens160_status").length === 0) {
    dbg("Sin lecturas válidas de " + deviceId); return null;
}

// ── Salida 1: InfluxDB [fields, tags, timestamp ms] ──────────────
const msgInflux = {
    measurement: "telemetria_ambiental",
    payload: [ { ...sensors }, { device_id: deviceId, zone: zone }, ts * 1000 ]
};

// ── Salida 2: MongoDB (dispositivos) y evaluación de umbrales ────
const msgMongo = {
    payload: { device_id: deviceId, zone: zone, topic: msg.topic, timestamp: ts, sensors: sensors }
};

return [msgInflux, msgMongo];
