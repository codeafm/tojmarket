export function getDeviceId() {
  const k = "tm_device_id";
  let v = localStorage.getItem(k);
  if (!v) {
    v = "dev_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
    localStorage.setItem(k, v);
  }
  return v;
}
