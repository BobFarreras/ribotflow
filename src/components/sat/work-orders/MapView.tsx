/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/MapView.tsx
 * Description: Client map component using Leaflet. Displays work order markers
 *              with category icons, HQ marker, rich popups with phone/link/status.
 */

"use client";

import { useEffect, useRef } from "react";
import type { WorkOrder, Client, WorkOrderCategory } from "@/types/sat";
import type { User } from "@/types";

interface MapOrder {
  workOrder: WorkOrder;
  client: Client;
  category: WorkOrderCategory;
  technician?: User | null;
}

interface Props {
  orders: MapOrder[];
  hqLocation?: { lat: number; lng: number } | null;
  companyName?: string;
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

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendent",
  assigned: "Assignada",
  scheduled: "Programada",
  in_progress: "En curs",
  paused: "Pausada",
  completed: "Completada",
  closed: "Tancada",
  cancelled: "Cancel·lada",
  waiting_parts: "Esperant peces",
  waiting_client: "Esperant client",
};

// Category icons (SVG paths)
const CATEGORY_ICONS: Record<string, string> = {
  repair: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,
  maintenance: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/><circle cx="12" cy="12" r="3"/>`,
  installation: `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>`,
  assembly: `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>`,
  inspection: `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
};

// Default fallback icon
const DEFAULT_ICON = CATEGORY_ICONS.maintenance;

function getCategoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] || DEFAULT_ICON;
}

export function MapView({ orders, hqLocation, companyName = "Seu" }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    let map: any;
    const markers: any[] = [];

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

      // Center on HQ or first order
      const center = hqLocation ?? orders[0]?.client.location ?? { lat: 41.3851, lng: 2.1734 };

      map = L.map(mapRef.current!).setView([center.lat, center.lng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // --- HQ Marker ---
      if (hqLocation) {
        const hqIconHtml = `
          <div style="position:relative;width:36px;height:36px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0f766e" width="36" height="36">
              <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
            </svg>
            <div style="position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;background:#0f766e;border-radius:50%;border:2px solid white;"></div>
          </div>
        `;
        const hqIcon = L.divIcon({
          html: hqIconHtml,
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        });

        const hqMarker = L.marker([hqLocation.lat, hqLocation.lng], { icon: hqIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: system-ui, sans-serif; min-width: 160px;">
              <div style="font-weight: 700; font-size: 14px; color: #0f766e;">
                🏢 ${companyName}
              </div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                Seu central
              </div>
            </div>
          `);
        markers.push(hqMarker);
      }

      // --- Work Order Markers ---
      orders.forEach((order) => {
        if (!order.client.location) return;

        const color = order.category.color ?? STATUS_COLORS[order.workOrder.status] ?? "#6b7280";
        const catSlug = order.category.slug ?? "maintenance";
        const catIconSvg = getCategoryIcon(catSlug);
        const isAssigned = !!order.workOrder.assignedTo;
        const isInProgress = order.workOrder.status === "in_progress";
        const statusColor = STATUS_COLORS[order.workOrder.status] ?? "#6b7280";
        const statusLabel = STATUS_LABELS[order.workOrder.status] ?? order.workOrder.status;

        // Assigned indicator (small blue dot)
        const assignedBadge = isAssigned
          ? `<div style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#3b82f6;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);" title="Assignada a tècnic"></div>`
          : "";

        // In-progress pulse ring
        const progressRing = isInProgress
          ? `<div style="position:absolute;top:-6px;left:-6px;width:48px;height:48px;border-radius:50%;border:3px solid #f59e0b;animation:pulse 2s infinite;"></div>`
          : "";

        const markerHtml = `
          <div style="position:relative;width:36px;height:36px;">
            ${progressRing}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36" height="36" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
              ${catIconSvg}
            </svg>
            ${assignedBadge}
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        });

        const marker = L.marker(
          [order.client.location.lat, order.client.location.lng],
          { icon: customIcon }
        ).addTo(map);

        // Rich popup
        const phoneHtml = order.client.phone
          ? `<div style="margin-top:4px;">
               <a href="tel:${order.client.phone}" style="font-size:12px;color:#3b82f6;text-decoration:none;display:flex;align-items:center;gap:4px;">
                 📞 ${order.client.phone}
               </a>
             </div>`
          : "";

        const techHtml = order.technician
          ? `<div style="margin-top:4px;font-size:11px;color:#3b82f6;">
               👤 ${order.technician.name}
             </div>`
          : isAssigned
            ? `<div style="margin-top:4px;font-size:11px;color:#3b82f6;">
                 👤 Assignada
               </div>`
            : "";

        const distanceHtml = order.workOrder.travelDistanceKm
          ? `<div style="margin-top:4px;font-size:11px;color:#666;">
               🚗 ${order.workOrder.travelDistanceKm} km des de la seu
             </div>`
          : "";

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; min-width: 220px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <span style="font-weight:700;font-size:13px;color:#111;">
                ${order.workOrder.number}
              </span>
              <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;background:${statusColor}20;color:${statusColor};border:1px solid ${statusColor}40;">
                ${statusLabel}
              </span>
            </div>
            <div style="font-size:13px;color:#333;margin-bottom:4px;font-weight:500;">
              ${order.workOrder.title}
            </div>
            <div style="font-size:12px;color:#666;margin-bottom:6px;">
              ${order.client.name}
            </div>
            <div style="font-size:11px;color:#888;margin-bottom:6px;">
              📍 ${order.client.address ?? "Sense adreça"}
            </div>
            ${phoneHtml}
            ${techHtml}
            ${distanceHtml}
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;">
              <a href="/sat/${order.workOrder.id}" 
                 style="display:inline-block;padding:4px 12px;background:var(--module-sat,#0d9488);color:white;text-decoration:none;border-radius:6px;font-size:12px;font-weight:500;"
                 target="_blank">
                Veure ordre →
              </a>
            </div>
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

      // Add pulse animation style
      const style = document.createElement("style");
      style.innerHTML = `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    };

    initMap();

    return () => {
      if (map) map.remove();
    };
  }, [orders, hqLocation, companyName]);

  return (
    <div className="relative h-[calc(100vh-200px)] w-full">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
