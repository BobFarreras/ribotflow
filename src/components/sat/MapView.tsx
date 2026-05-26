/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/MapView.tsx
 * Description: Client map component using Leaflet. Displays work order markers
 *              colored by status, with popups showing order details.
 */

"use client";

import { useEffect, useRef } from "react";
import type { WorkOrder, Client, WorkOrderCategory } from "@/types/sat";

interface MapOrder {
  workOrder: WorkOrder;
  client: Client;
  category: WorkOrderCategory;
}

interface Props {
  orders: MapOrder[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#6b7280",
  assigned: "#3b82f6",
  scheduled: "#8b5cf6",
  in_progress: "#f59e0b",
  paused: "#eab308",
  completed: "#22c55e",
  closed: "#14b8a6",
  cancelled: "#ef4444",
  waiting_parts: "#f97316",
  waiting_client: "#6366f1",
};

export function MapView({ orders }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    let map: any;
    let markers: any[] = [];

    const initMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      // Fix default icon paths for webpack/Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const firstOrder = orders[0];
      const center = firstOrder.client.location ?? { lat: 41.3851, lng: 2.1734 };

      map = L.map(mapRef.current!).setView([center.lat, center.lng], 10);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      orders.forEach((order) => {
        if (!order.client.location) return;

        const color = STATUS_COLORS[order.workOrder.status] ?? "#6b7280";

        // Custom colored marker
        const markerHtml = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const marker = L.marker(
          [order.client.location.lat, order.client.location.lng],
          { icon: customIcon }
        ).addTo(map);

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; min-width: 200px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #111;">
              ${order.workOrder.number}
            </div>
            <div style="font-size: 13px; color: #333; margin-bottom: 4px;">
              ${order.workOrder.title}
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 6px;">
              ${order.client.name}
            </div>
            <div style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; background: ${color}20; color: ${color}; border: 1px solid ${color}40;">
              ${order.workOrder.status}
            </div>
            ${order.workOrder.travelDistanceKm ? `
            <div style="margin-top: 6px; font-size: 11px; color: #888;">
              ${order.workOrder.travelDistanceKm} km des de la seu
            </div>
            ` : ""}
          </div>
        `;

        marker.bindPopup(popupContent);
        markers.push(marker);
      });

      // Fit bounds to show all markers
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
      }
    };

    initMap();

    return () => {
      if (map) map.remove();
    };
  }, [orders]);

  return (
    <div className="relative h-[calc(100vh-200px)] w-full">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
