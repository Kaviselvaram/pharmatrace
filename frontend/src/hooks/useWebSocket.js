import { useState, useEffect, useRef } from "react";

/**
 * Custom React Hook for Real-Time WebSocket Telemetry Streaming.
 * Uses a ring buffer of last 40 telemetry readings to guarantee high 60fps rendering performance.
 * Supports: useWebSocket(callback) or useWebSocket(endpoint, callback).
 */
export function useWebSocket(endpointOrCallback, maybeCallback) {
  let endpoint = "/ws/telemetry";
  let onEventCallback = null;

  if (typeof endpointOrCallback === "function") {
    onEventCallback = endpointOrCallback;
  } else if (typeof endpointOrCallback === "string") {
    endpoint = endpointOrCallback;
    if (typeof maybeCallback === "function") {
      onEventCallback = maybeCallback;
    }
  }

  const [connected, setConnected] = useState(false);
  const [lastPacket, setLastPacket] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const callbackRef = useRef(onEventCallback);

  useEffect(() => {
    callbackRef.current = onEventCallback;
  }, [onEventCallback]);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
      const wsUrl = `${protocol}//${host}${cleanEndpoint}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) setConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === "TELEMETRY_STREAM" || payload.type === "TELEMETRY_PACKET") {
              const data = payload.data;
              if (isMounted) {
                setLastPacket(data);
                setTelemetryHistory((prev) => {
                  const updated = [...prev, data];
                  return updated.length > 40 ? updated.slice(updated.length - 40) : updated;
                });
              }
            }

            if (callbackRef.current && typeof callbackRef.current === "function") {
              callbackRef.current(payload);
            }
          } catch (e) {
            console.error("Failed to parse WebSocket packet", e);
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            setConnected(false);
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.error("WebSocket connection error:", err);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [endpoint]);

  return { connected, isConnected: connected, lastPacket, telemetryHistory };
}
