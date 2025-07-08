import { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

function formatDuration(startTime) {
  if (!startTime) return "00:00:00";
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now - start;
  if (diffMs < 0) return "00:00:00";
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  const diffS = Math.floor((diffMs % 60000) / 1000);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(diffH)}:${pad(diffM)}:${pad(diffS)}`;
}

export default function useTables(user) {
  const [tables, setTables] = useState([]);
  const [sessions, setSessions] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchTables = async () => {
      setLoading(true);
      try {
        const res = await api.get("/Tables", { headers: { Authorization: `Bearer ${user.token}` } });
        setTables(res.data.sort((a, b) => a.tableName.localeCompare(b.tableName)));
        
        const localSessions = {};
        res.data.forEach((table) => {
          const start = localStorage.getItem(`start_${table.id}`);
          if (start) {
            localSessions[table.id] = {
              tableId: table.id,
              startTime: start,
              durationFormatted: formatDuration(start),
            };
          }
        });
        setSessions(localSessions);
        
        setErrorMsg("");
      } catch {
        setErrorMsg("Masalar yüklənmədi.");
      }
      setLoading(false);
    };

    fetchTables();

    const interval = setInterval(() => {
      setSessions((prev) => {
        const updated = {};
        for (const [tableId, session] of Object.entries(prev)) {
          updated[tableId] = {
            ...session,
            durationFormatted: formatDuration(session.startTime),
          };
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  return { tables, sessions, loading, errorMsg, setSessions, setErrorMsg };
}
