import type { Region } from "./era-questions";

type LocationInfo = {
  region: Region;
  country?: string;
  city?: string;
};

async function reverseGeocode(lat: number, lon: number): Promise<{ country?: string; city?: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return {};
    const json: any = await res.json();
    return {
      country: json?.address?.country_code?.toUpperCase(),
      city: json?.address?.city || json?.address?.town || json?.address?.state,
    };
  } catch {
    return {};
  }
}

async function ipFallback(): Promise<{ country?: string; city?: string }> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return {};
    const json: any = await res.json();
    return { country: json?.country_code, city: json?.city };
  } catch {
    return {};
  }
}

function regionFor(country?: string): Region {
  if (country === "IN") return "IN";
  return "GLOBAL";
}

export async function detectLocation(): Promise<LocationInfo> {
  // Try browser geolocation first (silent — only resolves if permission granted)
  const geo = await new Promise<{ lat: number; lon: number } | null>((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    const timeout = setTimeout(() => resolve(null), 4000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
      { timeout: 4000, maximumAge: 60 * 60 * 1000 },
    );
  });

  let loc: { country?: string; city?: string } = {};
  if (geo) loc = await reverseGeocode(geo.lat, geo.lon);
  if (!loc.country) loc = { ...(await ipFallback()), ...loc };

  const info: LocationInfo = { region: regionFor(loc.country), country: loc.country, city: loc.city };
  try { localStorage.setItem("eraos.location", JSON.stringify(info)); } catch {}
  return info;
}

export function getCachedLocation(): LocationInfo | null {
  try {
    const raw = localStorage.getItem("eraos.location");
    if (!raw) return null;
    return JSON.parse(raw) as LocationInfo;
  } catch { return null; }
}
