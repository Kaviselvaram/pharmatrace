import { useState, useEffect, useRef } from "react";

/**
 * Custom React Hook for Real-Time WebSocket Telemetry Streaming.
 * Uses a ring buffer of last 40 telemetry readings to guarantee high 60fps rendering performance.
 */
export function useWebSocket(onEventCallback) {
  const [connected, setConnected] = useState(false);
  const [lastPacket, setLastPacket] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/telemetry`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "TELEMETRY_STREAM") {
            setLastPacket(payload.data);
            setTelemetryHistory((prev) => {
              // Maintain ring buffer of last 40 points
              const updated = [...prev, payload.data];
              return updated.length > 40 ? updated.slice(updated.length - 40) : updated;
            });
          }

          if (onEventCallback) {
            onEventCallback(payload);
          }
        } catch (e) {
          console.error("Failed to parse WebSocket packet", e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return { connected, lastPacket, telemetryHistory };
}
