const SYSTEM = `Sen "Oyun Zeka" adlı bir oyun geliştirme yapay zekasısın.
Kullanıcının istediği oyunu TEK dosyalık, kendi kendine yeten bir HTML olarak yaz.
Kurallar:
- Yalnızca tam HTML kodunu döndür (<!DOCTYPE html> ile başla). Açıklama, markdown çiti yazma.
- 3D için Three.js'i yalnızca şu adresten yükle: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
- Başka harici kaynak, resim veya ağ isteği kullanma. Grafikleri kodla çiz.
- Hem dokunmatik hem klavye/fare kontrolü ekle, mobilde çalışsın.
- Başlangıç menüsü, skor, oyun bitti ve tekrar oyna ekranı olsun. Görsel olarak güzel ve akıcı olsun.
- Kullanıcı değişiklik isterse mevcut oyunu koru, sadece istenen değişikliği yapıp TAM dosyayı yeniden döndür.
- Arayüz metinleri kullanıcının dilinde olsun.`;

export async function onRequestPost({ request, env }) {
  const json = (o, s = 200) =>
    new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
  try {
    const { prompt, currentHtml } = await request.json();
    if (!prompt || prompt.length > 2000) return json({ error: 'Geçersiz istek' }, 400);

    const content = currentHtml
      ? `Mevcut oyun:\n${currentHtml.slice(0, 60000)}\n\nİstenen değişiklik: ${prompt}`
      : prompt;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5-5',
        max_tokens: 16000,
        system: SYSTEM,
        messages: [{ role: 'user', content }]
      })
    });
    const d = await r.json();
    if (!r.ok) return json({ error: d.error?.message || 'API hatası' }, 502);

    let html = (d.content || []).map(c => c.text || '').join('');
    html = html.replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
    return json({ html });
  } catch (e) {
    return json({ error: 'Sunucu hatası' }, 500);
  }
  }
