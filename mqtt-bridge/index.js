require('dotenv').config();
const mqtt = require('mqtt');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const mqttUrl = `mqtts://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`;
const mqttOptions = {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  clientId: 'govest-bridge-' + Math.random().toString(16).slice(2, 10),
};

console.log('Menghubungkan ke MQTT broker:', mqttUrl);
const client = mqtt.connect(mqttUrl, mqttOptions);

const workerIdCache = new Map();

async function getWorkerId(workerCode) {
  if (workerIdCache.has(workerCode)) {
    return workerIdCache.get(workerCode);
  }

  const { data, error } = await supabase
    .from('workers')
    .select('id')
    .eq('worker_code', workerCode)
    .single();

  if (error || !data) {
    console.error(`Worker dengan code "${workerCode}" tidak ditemukan di database:`, error?.message);
    return null;
  }

  workerIdCache.set(workerCode, data.id);
  return data.id;
}

client.on('connect', () => {
  console.log('Terhubung ke MQTT broker.');
  client.subscribe('govest/+/telemetry', (err) => {
    if (err) console.error('Gagal subscribe topic telemetry:', err);
    else console.log('Subscribe ke govest/+/telemetry');
  });

  client.subscribe('govest/+/alert', (err) => {
    if (err) console.error('Gagal subscribe topic alert:', err);
    else console.log('Subscribe ke govest/+/alert');
  });
});

client.on('error', (err) => {
  console.error('MQTT connection error:', err.message);
});

client.on('message', async (topic, messageBuffer) => {
  const parts = topic.split('/'); // 
  const workerCode = parts[1];
  const messageType = parts[2];

  let payload;
  try {
    payload = JSON.parse(messageBuffer.toString());
  } catch (err) {
    console.error(`Gagal parse JSON dari topic ${topic}:`, err.message);
    return;
  }

  const workerId = await getWorkerId(workerCode);
  if (!workerId) return;

  if (messageType === 'telemetry') {
    await handleTelemetry(workerId, payload);
  } else if (messageType === 'alert') {
    await handleAlert(workerId, workerCode, payload);
  }
});

async function handleTelemetry(workerId, payload) {
  const { error } = await supabase.from('telemetry').insert({
    worker_id: workerId,
    recorded_at: new Date().toISOString(),
    bpm: payload.bpm,
    spo2: payload.spo2,
    gas_value: payload.gas_value,
    total_g: payload.total_g,
    roll: payload.roll,
    pitch: payload.pitch,
    lat: payload.lat,
    lon: payload.lon,
    gps_fix_valid: payload.gps_fix_valid,
    is_danger: payload.is_danger,
    alert_message: payload.alert_message,
    fall_confirmed: payload.fall_confirmed,
  });

  if (error) {
    console.error('Gagal insert telemetry:', error.message);
  } else {
    console.log(`[telemetry] ${payload.worker_id}: BPM=${payload.bpm} SpO2=${payload.spo2} Gas=${payload.gas_value} Danger=${payload.is_danger}`);
  }
}

async function handleAlert(workerId, workerCode, payload) {
  const { data: workerData } = await supabase
    .from('workers')
    .select('location_label')
    .eq('id', workerId)
    .single();

  const { error } = await supabase.from('alerts').insert({
    worker_id: workerId,
    severity: 'danger',
    cause: payload.cause,
    location_label: workerData?.location_label || 'Tidak diketahui',
    source: 'rule_based',
  });

  if (error) {
    console.error('Gagal insert alert:', error.message);
  } else {
    console.log(`[ALERT] ${workerCode}: ${payload.cause} di ${payload.lat},${payload.lon}`);
  }
}

process.on('SIGINT', () => {
  console.log('Menutup koneksi MQTT...');
  client.end();
  process.exit(0);
});