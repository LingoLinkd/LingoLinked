import { useEffect, useState } from "react";

type Health = { ok: boolean };

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Client</h1>
      {err && <pre>{err}</pre>}
      <pre>{JSON.stringify(health, null, 2)}</pre>
    </div>
  );
}
