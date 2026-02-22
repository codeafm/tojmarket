export async function decodeVin(vin) {
  const v = (vin || "").trim();
  if (v.length !== 17) throw new Error("VIN должен быть 17 символов");

  // Бесплатный decode (не история аварий). Для аварий нужен платный сервис.
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(v)}?format=json`;
  const r = await fetch(url);
  const j = await r.json();
  const row = j?.Results?.[0];
  return row || null;
}
