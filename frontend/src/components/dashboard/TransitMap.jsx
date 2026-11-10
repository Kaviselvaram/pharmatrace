import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Icons } from "../ui/Icons";

export default function TransitMap({ lastPacket, height = "320px" }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  // Default coordinate: Bangalore hub
  const defaultLat = 12.9716;
  const defaultLon = 77.5946;

  // Major corridor waypoints (Hyderabad -> Bangalore -> Chennai NH44)
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

    let resizeObserver = null;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        preferCanvas: true,
      }).setView([15.2, 78.5], 6);

      // Dedicated OpenStreetMap tile provider with local dark filter (Zero API key required, zero watermarks)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        className: "dark-map-tiles",
        maxZoom: 19,
        minZoom: 4,
        crossOrigin: true,
      }).addTo(map);

      // Top-right zoom control
      L.control.zoom({ position: "topright" }).addTo(map);

      // Draw corridor route in soft electric blue
      const polyline = L.polyline(routeCoordinates, {
        color: "#4F80F8",
        weight: 3.5,
        opacity: 0.85,
        dashArray: "6, 6",
      }).addTo(map);
      polylineRef.current = polyline;

      // Add Start (Hyderabad) & End (Chennai) Markers
      L.circleMarker([17.5186, 78.5833], { radius: 7, color: "#8B5CF6", fillColor: "#A78BFA", fillOpacity: 0.95 })
        .addTo(map)
        .bindPopup("<div style='font-family:sans-serif;font-size:12px;color:#0C0D11;'><b>Genesis Lot Origin</b><br/>BioVax Pharma City, Hyderabad</div>");

      L.circleMarker([13.0604, 80.2496], { radius: 7, color: "#10B981", fillColor: "#34D399", fillOpacity: 0.95 })
        .addTo(map)
        .bindPopup("<div style='font-family:sans-serif;font-size:12px;color:#0C0D11;'><b>Clinical Destination</b><br/>Apollo Specialty Hospital, Chennai</div>");

      // Custom Vehicle Marker with live radar pulse
      const vehicleIcon = L.divIcon({
        className: "custom-vehicle-marker",
        html: `<div style="
          width: 18px;
          height: 18px;
          background: #4F80F8;
          border: 2px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 14px #4F80F8;
          cursor: pointer;
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([defaultLat, defaultLon], { icon: vehicleIcon }).addTo(map);
      vehicleMarkerRef.current = marker;

      mapInstanceRef.current = map;

      // Handle resize and visibility triggers
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);

      if (window.ResizeObserver && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
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
          <div style="font-family: sans-serif; font-size: 12px; color: #0C0D11; padding: 4px;">
            <b>${lastPacket.node_id || "ColdLogix Reefer 04"}</b><br/>
            Temp: <b>${lastPacket.temperature_celsius}°C</b><br/>
            Location: ${lastPacket.waypoint_label}
          </div>
        `);
      }
    }
  }, [lastPacket]);

  return (
    <div className="dash-card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icons.Navigation size={18} color="var(--dash-blue-accent)" />
          <span className="font-display" style={{ fontSize: "14px", fontWeight: "700", color: "var(--dash-text-primary)" }}>
            Interstate Fleet Transit Corridor (NH44)
          </span>
        </div>
        <div style={{ fontSize: "12px", color: "var(--dash-text-muted)" }}>
          Corridor: <span style={{ fontWeight: "600", color: "var(--dash-text-secondary)" }}>{lastPacket?.waypoint_label || "En route NH44 to Chennai"}</span>
        </div>
      </div>

      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: height,
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          border: "1px solid var(--dash-border)",
          background: "#0C0D11",
        }}
      />
    </div>
  );
}
