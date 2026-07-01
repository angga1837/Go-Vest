import { createServerClient } from '@/lib/supabase/server';
import mqtt from 'mqtt';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: worker, error } = await supabase
    .from('workers')
    .select('worker_code')
    .eq('id', id)
    .single();

  if (error || !worker) {
    return Response.json({ error: 'Worker tidak ditemukan' }, { status: 404 });
  }

  try {
    await publishCommand(worker.worker_code, { action: 'send_manual_alert' });
    return Response.json({ success: true });
  } catch (err) {
    console.error('Gagal publish MQTT command:', err);
    return Response.json({ error: 'Gagal mengirim perintah ke device' }, { status: 500 });
  }
}

function publishCommand(workerCode: string, payload: object): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(`mqtts://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`, {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clientId: 'safevest-web-' + Math.random().toString(16).slice(2, 8),
    });

    const timeout = setTimeout(() => {
      client.end();
      reject(new Error('Timeout menghubungi MQTT broker'));
    }, 8000);

    client.on('connect', () => {
      const topic = `safevest/${workerCode}/command`;
      client.publish(topic, JSON.stringify(payload), {}, (err) => {
        clearTimeout(timeout);
        client.end();
        if (err) reject(err);
        else resolve();
      });
    });

    client.on('error', (err) => {
      clearTimeout(timeout);
      client.end();
      reject(err);
    });
  });
}