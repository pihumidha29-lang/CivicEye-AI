import React, { createContext, useContext, useState, useEffect } from "react";
import { UserLocation } from "../types";

interface LocationContextType {
  location: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  statusMessage: string | null;
  requestGPS: () => Promise<UserLocation>;
  selectManualLocation: (cityKey: string) => void;
  updateLocation: (loc: UserLocation) => void;
  retryLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const CITY_DEFAULTS: Record<string, UserLocation> = {
  jaipur: { latitude: 26.9124, longitude: 75.7873, city: "Jaipur", state: "Rajasthan", locality: "Malviya Nagar", district: "Jaipur District", pincode: "302017", country: "India", source: "manual" },
  mumbai: { latitude: 19.0760, longitude: 72.8777, city: "Mumbai", state: "Maharashtra", locality: "Bandra West", district: "Mumbai Suburban", pincode: "400050", country: "India", source: "manual" },
  delhi: { latitude: 28.6139, longitude: 77.2090, city: "New Delhi", state: "Delhi", locality: "Connaught Place", district: "New Delhi District", pincode: "110001", country: "India", source: "manual" },
  bengaluru: { latitude: 12.9716, longitude: 77.5946, city: "Bengaluru", state: "Karnataka", locality: "Indiranagar", district: "Bengaluru Urban", pincode: "560038", country: "India", source: "manual" },
  sf: { latitude: 37.7749, longitude: -122.4194, city: "San Francisco", state: "California", locality: "Mission District", district: "San Francisco County", pincode: "94110", country: "United States", source: "manual" }
};

export const getCityFromCoordinates = async (lat: number, lng: number): Promise<{city: string, state: string, locality: string, district?: string, pincode?: string, country?: string}> => {
  console.log(`[LocationService] Starting reverse geocoding for latitude: ${lat}, longitude: ${lng}`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 seconds timeout
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || "Jaipur";
      const state = addr.state || "Rajasthan";
      const district = addr.county || addr.district || addr.state_district || `${city} District`;
      const locality = addr.suburb || addr.neighbourhood || addr.road || addr.quarter || "Central Area";
      const pincode = addr.postcode || "";
      const country = addr.country || "India";
      console.log(`[LocationService] Reverse geocoding success: ${locality}, ${city}, ${state}, ${country}`);
      return { city, state, locality, district, pincode, country };
    } else {
      console.warn(`[LocationService] Reverse geocoding API returned status ${res.status}`);
    }
  } catch (e) {
    console.error("[LocationService] Reverse geocoding fetch failed or timed out", e);
  }

  // Nearest fallback mapping
  console.log("[LocationService] Using nearest-neighbor fallback mapping");
  const cities = Object.values(CITY_DEFAULTS);

  let closest = cities[0];
  let minDist = Infinity;
  for (const c of cities) {
    const dist = Math.sqrt(Math.pow(c.latitude - lat, 2) + Math.pow(c.longitude - lng, 2));
    if (dist < minDist) {
      minDist = dist;
      closest = c;
    }
  }

  return {
    city: closest.city,
    state: closest.state,
    locality: closest.locality,
    district: closest.district,
    pincode: closest.pincode,
    country: closest.country
  };
};

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(() => {
    const saved = localStorage.getItem("civic_user_location");
    if (saved) {
      try {
        console.log("[LocationService] Loaded saved location from localStorage");
        return JSON.parse(saved);
      } catch (e) {
        console.warn("[LocationService] Failed to parse saved location from localStorage", e);
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const requestGPS = (): Promise<UserLocation> => {
    return new Promise((resolve, reject) => {
      setIsLoading(true);
      setError(null);
      setStatusMessage("Requesting location permission...");

      console.log("[LocationService] Request started");

      // Check if navigator.geolocation exists
      if (!navigator.geolocation) {
        const errorMsg = "Geolocation is not supported by this browser.";
        console.error(`[LocationService] Geolocation supported: FALSE. Error: ${errorMsg}`);
        setError("Geolocation is not supported by your browser. Please select manually.");
        setStatusMessage("Unable to detect location. Geolocation unsupported.");
        setIsLoading(false);
        reject(new Error(errorMsg));
        return;
      }

      console.log("[LocationService] Geolocation supported: TRUE");

      const attemptGPS = async (isRetryAttempt: boolean) => {
        // Query browser location permission state if API is supported
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: "geolocation" as any });
            console.log(`[LocationService] Permission state: ${permissionStatus.state}`);
          } catch (e: any) {
            console.log(`[LocationService] Permission state: UNKNOWN (API query failed: ${e.message})`);
          }
        } else {
          console.log("[LocationService] Permission state: UNKNOWN (navigator.permissions.query not supported)");
        }

        console.log(`[LocationService] Request started${isRetryAttempt ? " (Retry Attempt)" : ""}`);
        if (isRetryAttempt) {
          setStatusMessage("Location request timed out. Retrying...");
        } else {
          setStatusMessage("Querying satellite telemetry coordinates...");
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            console.log("[LocationService] Coordinates received: SUCCESS");
            const { latitude, longitude } = position.coords;
            console.log(`[LocationService] Coordinates received: Lat ${latitude}, Lng ${longitude}`);
            setStatusMessage("Syncing grid... Reverse geocoding location...");

            try {
              const geoData = await getCityFromCoordinates(latitude, longitude);
              const newLoc: UserLocation = {
                latitude,
                longitude,
                city: geoData.city,
                state: geoData.state,
                locality: geoData.locality,
                district: geoData.district,
                pincode: geoData.pincode,
                country: geoData.country,
                source: "gps"
              };
              console.log("[LocationService] Location synced successfully", newLoc);
              setLocation(newLoc);
              localStorage.setItem("civic_user_location", JSON.stringify(newLoc));
              setIsLoading(false);
              setError(null);
              setStatusMessage(null);
              resolve(newLoc);
            } catch (err: any) {
              console.error("[LocationService] Reverse geocoding failed, using fallback location", err);
              // Save coordinates even if geocoding fails, with nearest fallback representation
              const newLoc: UserLocation = {
                latitude,
                longitude,
                city: "Jaipur",
                state: "Rajasthan",
                locality: "Detected Area",
                district: "Jaipur District",
                pincode: "302017",
                country: "India",
                source: "gps"
              };
              setLocation(newLoc);
              localStorage.setItem("civic_user_location", JSON.stringify(newLoc));
              setIsLoading(false);
              setError(null);
              setStatusMessage(null);
              resolve(newLoc);
            }
          },
          async (browserError) => {
            console.error(`[LocationService] Error code: ${browserError.code}, Error message: ${browserError.message}`);

            let displayError = "An unexpected GPS error occurred.";

            switch (browserError.code) {
              case browserError.PERMISSION_DENIED:
                displayError = "Location permission was denied. Please allow location access or choose your city manually.";
                console.warn(`[LocationService] Error type: PERMISSION_DENIED. Info: ${displayError}`);
                break;
              case browserError.POSITION_UNAVAILABLE:
                displayError = "Your device could not determine your location. Please try again.";
                console.warn(`[LocationService] Error type: POSITION_UNAVAILABLE. Info: ${displayError}`);
                break;
              case browserError.TIMEOUT:
                displayError = "Location request timed out. Retrying...";
                console.warn(`[LocationService] Error type: TIMEOUT. Info: ${displayError}`);
                
                // Automatic retry once after timeout
                if (!isRetryAttempt) {
                  console.log("[LocationService] Automatically retrying GPS request once due to timeout...");
                  attemptGPS(true);
                  return;
                } else {
                  displayError = "Location request timed out again after automatic retry.";
                  console.warn("[LocationService] Error type: TIMEOUT_RETRY_FAILED. GPS request timed out a second time.");
                }
                break;
              default:
                displayError = "An unexpected GPS error occurred.";
                console.warn(`[LocationService] Error type: UNKNOWN_ERROR. Info: ${browserError.message}`);
                break;
            }

            setError(displayError);
            setStatusMessage(null);
            setIsLoading(false);

            // Do not fall back to manual selection unless GPS genuinely fails after retries (and we don't have ANY location set yet)
            if (!location) {
              console.log("[LocationService] Genuine GPS failure and no preset location exists. Defaulting to Jaipur manual fallback.");
              const fallback = CITY_DEFAULTS.jaipur;
              setLocation(fallback);
              localStorage.setItem("civic_user_location", JSON.stringify(fallback));
            }

            reject(browserError);
          },
          { enableHighAccuracy: !isRetryAttempt, timeout: isRetryAttempt ? 10000 : 7000, maximumAge: 300000 }
        );
      };

      attemptGPS(false);
    });
  };

  const selectManualLocation = (cityKey: string) => {
    console.log(`[LocationService] Manual city selection triggered for: ${cityKey}`);
    const selected = CITY_DEFAULTS[cityKey] || CITY_DEFAULTS.jaipur;
    setLocation(selected);
    localStorage.setItem("civic_user_location", JSON.stringify(selected));
    setError(null);
    setStatusMessage(null);
  };

  const retryLocation = () => {
    console.log("[LocationService] Retrying GPS detection...");
    requestGPS().catch((err) => {
      console.warn("[LocationService] Retry attempt failed", err);
    });
  };

  // Keep location synced background watches if source is GPS
  useEffect(() => {
    if (location && location.source === "gps") {
      console.log("[LocationService] Setting up active watchPosition listener");
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Check significant movement of ~100m to avoid constant updates
          const diffLat = Math.abs(location.latitude - latitude);
          const diffLng = Math.abs(location.longitude - longitude);
          if (diffLat > 0.0008 || diffLng > 0.0008) {
            console.log(`[LocationService] Significant coordinate movement detected in watchPosition: Lat ${latitude}, Lng ${longitude}`);
            try {
              const geoData = await getCityFromCoordinates(latitude, longitude);
              const updated: UserLocation = {
                latitude,
                longitude,
                city: geoData.city,
                state: geoData.state,
                locality: geoData.locality,
                district: geoData.district,
                pincode: geoData.pincode,
                country: geoData.country,
                source: "gps"
              };
              setLocation(updated);
              localStorage.setItem("civic_user_location", JSON.stringify(updated));
            } catch (err) {
              console.warn("[LocationService] Failed background reverse-geocoding", err);
            }
          }
        },
        (err) => console.log("[LocationService] Silent background watchPosition update skipped", err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
      return () => {
        console.log("[LocationService] Clearing active watchPosition listener");
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [location?.source]);

  const updateLocation = (loc: UserLocation) => {
    console.log("[LocationService] Manual updateLocation triggered", loc);
    setLocation(loc);
    localStorage.setItem("civic_user_location", JSON.stringify(loc));
    setError(null);
    setStatusMessage(null);
  };

  return (
    <LocationContext.Provider value={{
      location,
      isLoading,
      error,
      statusMessage,
      requestGPS,
      selectManualLocation,
      updateLocation,
      retryLocation
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationService() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocationService must be used within a LocationProvider");
  }
  return context;
}
