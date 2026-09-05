import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Navigation } from "lucide-react";

export default function TransitMap({ lastPacket }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  // Default coordinate: Bangalore hub
  const defaultLat = 12.9716;
  const defaultLon = 77.5946;

  // Major corridor waypoints
  const routeCoordinates = [
    [17.5186, 78.5833], // Hyderabad Pharma City
    [17.3850, 78.4867],
    [16.7488, 77.9897], // Mahabubnagar
    [15.8281, 78.0373], // Kurnool
    [14.6819, 77.6006], // Anantapur
    [13.6288, 77.5385], // Chikkaballapur
    [12.9716, 77.5946], // Bangalore Hub
    [12.8452, 77.6602], // Electronics City
    [12.8342, 77.8624], // Hosur
    [12.5266, 78.2148], // Krishnagiri
    [12.9165, 79.1325], // Vellore
    [12.9800, 79.9700], // Sriperumbudur
    [13.0604, 80.2496], // Chennai Apollo Hospital
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([15.2, 78.5], 6);

      // Dark theme map tiles (CartoDB Dark Matter - free, no API key)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      // Draw corridor route
      const polyline = L.polyline(routeCoordinates, {
        color: "#00F0FF",
        weight: 3,
        opacity: 0.7,
        dashArray: "6, 8",
      }).addTo(map);
      polylineRef.current = polyline;

      // Add Start (Hyderabad) & End (Chennai) Markers
      L.circleMarker([17.5186, 78.5833], { radius: 6, color: "#A855F7", fillOpacity: 0.9 })
        .addTo(map)
        .bindPopup("<b>Genesis</b>: BioVax Pharma City, Hyderabad");

      L.circleMarker([13.0604, 80.2496], { radius: 6, color: "#00FF88", fillOpacity: 0.9 })
        .addTo(map)
        .bindPopup("<b>Destination</b>: Apollo Specialty Hospital, Chennai");

      // Custom Vehicle Pulsing Icon
      const vehicleIcon = L.divIcon({
        className: "custom-vehicle-marker",
        html: `<div style="
          width: 18px;
          height: 18px;
          background: #00F0FF;
          border: 2px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 14px #00F0FF;
          animation: beacon-pulse 1.8s infinite;
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([defaultLat, defaultLon], { icon: vehicleIcon }).addTo(map);
      vehicleMarkerRef.current = marker;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update vehicle position when telemetry packet arrives
  useEffect(() => {
    if (lastPacket && vehicleMarkerRef.current) {
      const lat = lastPacket.latitude || defaultLat;
      const lon = lastPacket.longitude || defaultLon;
      vehicleMarkerRef.current.setLatLng([lat, lon]);

      if (mapInstanceRef.current && lat && lon) {
        mapInstanceRef.current.panTo([lat, lon], { animate: true, duration: 0.8 });
      }

      if (lastPacket.waypoint_label) {
        vehicleMarkerRef.current.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #111;">
            <b>${lastPacket.node_id || "Reefer Fleet 04"}</b><br/>
            Temp: <b>${lastPacket.temperature_celsius}°C</b><br/>
            Location: ${lastPacket.waypoint_label}
          </div>
        `);
      }
    }
  }, [lastPacket]);

  return (
    <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Navigation size={18} color="var(--cyan-primary)" />
          <span className="font-display" style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF" }}>
            Interstate Cold-Chain Logistics Map
          </span>
        </div>
        <div className="font-mono" style={{ fontSize: "12px", color: "#94A3B8" }}>
          Waypoint: {lastPacket?.waypoint_label || "En route to Apollo Specialty Hospital, Chennai"}
        </div>
      </div>

      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "320px",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          border: "1px solid var(--border-subtle)",
        }}
      />
    </div>
  );
}
