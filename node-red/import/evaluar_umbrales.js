// ── Evaluar umbrales ─────────────────────────────────────────────
// Genera una alerta por cada variable fuera de su umbral.
// Valores de referencia: docs/diccionario_datos_mqtt_tfm.xlsx (pestaña Umbrales)
const s = msg.payload.sensors;
if (!s) return null;

const UMBRALES = {
    temperature_c:   { max: 35 },
    humidity_pct:    { max: 90 },
    eco2_ppm:        { max: 1000, requiereEns160: true },  // ventilación insuficiente
    pm25_ugm3:       { max: 15 },                          // OMS 2021 (media 24 h)
    pm10_ugm3:       { max: 45 },                          // OMS 2021 (media 24 h)
    gas_mq2_ppm_est: { max: 200 }                          // formato anterior (Wokwi)
};

const ens160Ok = s.ens160_status === undefined || s.ens160_status === "ok";
const alertas = [];

for (const [campo, u] of Object.entries(UMBRALES)) {
    const val = s[campo];
    if (val === null || val === undefined) continue;
    if (u.requiereEns160 && !ens160Ok) continue;   // ENS160 calentando: lectura no fiable
    if (u.max !== undefined && val > u.max) alertas.push({ field: campo, value: val, threshold: u.max, op: ">" });
    if (u.min !== undefined && val < u.min) alertas.push({ field: campo, value: val, threshold: u.min, op: "<" });
}
if (alertas.length === 0) return null;

msg.payload = {
    device_id: msg.payload.device_id,
    zone: msg.payload.zone,
    triggered_at: new Date(msg.payload.timestamp * 1000),
    alerts: alertas,
    notified_via: [],
    resolved_at: null
};
return msg;
