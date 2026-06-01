/**
 * Shim for backward compatibility.
 * Re-exports locationService from the new work-orders/ subdirectory.
 */
export { locationService, calculateDistance } from "./work-orders/locationService";
