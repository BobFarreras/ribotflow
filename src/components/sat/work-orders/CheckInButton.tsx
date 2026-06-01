/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/CheckInButton.tsx
 * Description: Client component for GPS check-in. Captures geolocation,
 *              validates proximity to client, and submits to server action.
 */

"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { checkInAction } from "@/actions/sat/work-orders/checkIn";
import { MapPin, Loader2, Navigation, AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  workOrderId: string;
  clientLocation?: { lat: number; lng: number } | null;
  lastCheckIn?: { lat: number; lng: number; createdAt: Date } | null;
}

const MAX_DISTANCE_METERS = 100;

export function CheckInButton({ workOrderId, clientLocation, lastCheckIn }: Props) {
  const t = useTranslations("sat.location");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    distanceToClient?: number | null;
  } | null>(null);

  const handleCheckIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Request geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      // Get battery level if available
      let batteryLevel: number | undefined;
      try {
        const battery = await (navigator as Navigator & { getBattery?(): Promise<{ level: number }> }).getBattery?.();
        if (battery) {
          batteryLevel = Math.round(battery.level * 100);
        }
      } catch {
        // Battery API not supported, ignore
      }

      const formData = new FormData();
      formData.append("workOrderId", workOrderId);
      formData.append("lat", String(latitude));
      formData.append("lng", String(longitude));
      formData.append("accuracy", String(accuracy));
      if (batteryLevel !== undefined) {
        formData.append("batteryLevel", String(batteryLevel));
      }

      const response = await checkInAction(formData);

      if (!response.success) {
        setError(response.error ?? t("checkInError"));
        return;
      }

      setResult({
        success: true,
        distanceToClient: response.data?.distanceToClient ?? null,
      });
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError(t("geoPermissionDenied"));
            break;
          case err.POSITION_UNAVAILABLE:
            setError(t("geoPositionUnavailable"));
            break;
          case err.TIMEOUT:
            setError(t("geoTimeout"));
            break;
          default:
            setError(t("geoUnknownError"));
        }
      } else {
        setError(t("checkInError"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [workOrderId, t]);

  const isWithinRange = result?.distanceToClient !== null && result?.distanceToClient !== undefined
    ? result.distanceToClient <= MAX_DISTANCE_METERS
    : null;

  return (
    <div className="space-y-3">
      {/* Last check-in info */}
      {lastCheckIn && (
        <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <Navigation className="h-3.5 w-3.5" />
          <span>
            {t("lastCheckIn")}: {" "}
            {new Date(lastCheckIn.createdAt).toLocaleTimeString("ca-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}

      {/* Client location hint */}
      {clientLocation && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          <span>{t("clientHasLocation")}</span>
        </div>
      )}

      {/* Check-in button */}
      <button
        type="button"
        onClick={handleCheckIn}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--module-sat)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("gettingLocation")}
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4" />
            {t("checkInButton")}
          </>
        )}
      </button>

      {/* Result feedback */}
      {result?.success && isWithinRange !== null && (
        <div
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
            isWithinRange
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {isWithinRange ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>
            {isWithinRange
              ? t("withinRange", { distance: Math.round(result.distanceToClient!) })
              : t("outOfRange", { distance: Math.round(result.distanceToClient!) })}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
