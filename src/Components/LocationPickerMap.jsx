/**
 * LocationPickerMap
 * -----------------
 * Interactive map picker for GPS coordinates.
 *
 * Features:
 *  • Nominatim (OpenStreetMap) search autocomplete — no API key needed
 *  • Click anywhere on map → drops pin + fills coordinates
 *  • Draggable marker for fine-tuning
 *  • Reverse geocoding on pin drop → auto-fills city, neighbourhood, address
 *  • Defaults to Yaoundé, Cameroon
 *
 * Props:
 *  lat        {string|number}  current latitude  (from parent form state)
 *  lng        {string|number}  current longitude (from parent form state)
 *  onChange   {function}       called with { lat, lng, city, neighbourhood, address }
 *                              whenever the pin moves or a suggestion is chosen
 *
 * Install:
 *  npm install react-leaflet leaflet
 *  import 'leaflet/dist/leaflet.css'  ← in main.jsx / App.jsx entry point
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "./LocationPickerMap.css";

// ─── Fix Leaflet's broken default icon in Webpack/Vite ──────────────────────
import markerIconPng   from "leaflet/dist/images/marker-icon.png";
import markerIcon2xPng from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       markerIconPng,
  iconRetinaUrl: markerIcon2xPng,
  shadowUrl:     markerShadowPng,
});

// Custom green pin for OLISTAY brand
const GREEN_ICON = new L.Icon({
  iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 28 16 28S32 26 32 16C32 7.163 24.837 0 16 0z"
            fill="#1DB080" stroke="#fff" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="#fff"/>
    </svg>
  `)}`,
  iconSize:     [32, 44],
  iconAnchor:   [16, 44],
  popupAnchor:  [0, -44],
  shadowUrl:    markerShadowPng,
  shadowSize:   [41, 41],
  shadowAnchor: [13, 41],
});

// ─── Default center: Yaoundé ─────────────────────────────────────────────────
const DEFAULT_CENTER = [3.848, 11.502];
const DEFAULT_ZOOM   = 13;

// ─── Nominatim helpers ───────────────────────────────────────────────────────
const NOMINATIM = "https://nominatim.openstreetmap.org";

async function searchPlaces(query) {
  const params = new URLSearchParams({
    q:              query,
    format:         "json",
    addressdetails: "1",
    limit:          "6",
    countrycodes:   "cm",          // bias to Cameroon; remove to search globally
    "accept-language": "fr,en",
  });
  const res = await fetch(`${NOMINATIM}/search?${params}`, {
    headers: { "Accept-Language": "fr,en" },
  });
  return res.json();
}

async function reverseGeocode(lat, lng) {
  const params = new URLSearchParams({
    lat, lon: lng,
    format:         "json",
    addressdetails: "1",
    zoom:           "16",
    "accept-language": "fr,en",
  });
  const res = await fetch(`${NOMINATIM}/reverse?${params}`);
  return res.json();
}

/** Extract the most useful display parts from a Nominatim result */
function parseNominatim(result) {
  const addr = result.address ?? {};

  const city =
    addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county ?? "";

  const neighbourhood =
    addr.suburb ?? addr.neighbourhood ?? addr.quarter ?? addr.district ?? addr.borough ?? "";

  // Build a short street address
  const streetParts = [addr.house_number, addr.road ?? addr.pedestrian ?? addr.path].filter(Boolean);
  const address = streetParts.join(" ");

  return { city, neighbourhood, address };
}

/** Split display_name into main (first part) and sub (rest) for the dropdown */
function splitDisplayName(displayName = "") {
  const parts = displayName.split(",").map(s => s.trim());
  const main  = parts[0] ?? displayName;
  const sub   = parts.slice(1, 4).join(", ");
  return { main, sub };
}

// ─── Inner component: listens for map clicks ─────────────────────────────────
function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

// ─── Inner component: flies the map to a new center ─────────────────────────
function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom ?? DEFAULT_ZOOM, { duration: 1.1 });
  }, [center, zoom, map]);
  return null;
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function LocationPickerMap({ lat, lng, onChange }) {
  const [query, setQuery]           = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [flyTarget, setFlyTarget]   = useState(null);
  const [markerPos, setMarkerPos]   = useState(
    lat && lng ? [Number(lat), Number(lng)] : null
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);
  const markerRef   = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // If parent resets lat/lng (e.g. form clear), sync marker
  useEffect(() => {
    if (!lat || !lng) { setMarkerPos(null); return; }
    const pos = [Number(lat), Number(lng)];
    setMarkerPos(pos);
  }, [lat, lng]);

  // ── Search input ──
  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(true);

    clearTimeout(debounceRef.current);
    if (!val.trim()) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchPlaces(val);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 420);
  };

  // ── Pick a suggestion ──
  const handleSuggestionPick = useCallback(async (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const pos = [lat, lng];

    setMarkerPos(pos);
    setFlyTarget({ center: pos, zoom: 16 });
    setShowDropdown(false);
    setQuery(result.display_name?.split(",")[0] ?? "");

    const { city, neighbourhood, address } = parseNominatim(result);
    onChange({ lat: lat.toFixed(6), lng: lng.toFixed(6), city, neighbourhood, address });
  }, [onChange]);

  // ── Click on map ──
  const handleMapClick = useCallback(async ({ lat, lng }) => {
    const pos = [lat, lng];
    setMarkerPos(pos);

    // Reverse geocode to fill in text fields
    try {
      const result = await reverseGeocode(lat, lng);
      const { city, neighbourhood, address } = parseNominatim(result);
      // Update search box to show short location name
      setQuery(result.display_name?.split(",")[0] ?? "");
      onChange({ lat: lat.toFixed(6), lng: lng.toFixed(6), city, neighbourhood, address });
    } catch {
      onChange({ lat: lat.toFixed(6), lng: lng.toFixed(6), city: "", neighbourhood: "", address: "" });
    }
  }, [onChange]);

  // ── Drag marker ──
  const handleMarkerDrag = useCallback(async () => {
    if (!markerRef.current) return;
    const { lat, lng } = markerRef.current.getLatLng();
    setMarkerPos([lat, lng]);
    try {
      const result = await reverseGeocode(lat, lng);
      const { city, neighbourhood, address } = parseNominatim(result);
      setQuery(result.display_name?.split(",")[0] ?? "");
      onChange({ lat: lat.toFixed(6), lng: lng.toFixed(6), city, neighbourhood, address });
    } catch {
      onChange({ lat: lat.toFixed(6), lng: lng.toFixed(6), city: "", neighbourhood: "", address: "" });
    }
  }, [onChange]);

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  const hasCoords = markerPos !== null;

  return (
    <div className="lpm-wrap" ref={wrapRef}>

      {/* ── Search bar ── */}
      <div className="lpm-search-row" style={{ position: "relative" }}>
        <span className="lpm-search-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          className="lpm-search-input"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => suggestions.length && setShowDropdown(true)}
          placeholder="Search for a place — e.g. Bastos, Yaoundé"
          autoComplete="off"
        />
        {query && (
          <button className="lpm-clear-btn" onClick={clearSearch} tabIndex={-1}>×</button>
        )}

        {/* Dropdown */}
        {showDropdown && (
          <div className="lpm-suggestions">
            {isSearching && (
              <div className="lpm-searching">
                <span className="lpm-spinner" /> Searching…
              </div>
            )}
            {!isSearching && suggestions.length === 0 && query.trim() && (
              <div className="lpm-no-results">No results — try a different name</div>
            )}
            {!isSearching && suggestions.map((s) => {
              const { main, sub } = splitDisplayName(s.display_name);
              return (
                <div
                  key={s.place_id}
                  className="lpm-suggestion"
                  onMouseDown={() => handleSuggestionPick(s)}
                >
                  <span className="lpm-suggestion-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </span>
                  <div>
                    <div className="lpm-suggestion-main">{main}</div>
                    {sub && <div className="lpm-suggestion-sub">{sub}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div className="lpm-map-container">
        <MapContainer
          center={markerPos ?? DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom={true}
          attributionControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <ClickHandler onMapClick={handleMapClick} />
          {flyTarget && <FlyTo center={flyTarget.center} zoom={flyTarget.zoom} />}

          {markerPos && (
            <Marker
              position={markerPos}
              icon={GREEN_ICON}
              draggable={true}
              ref={markerRef}
              eventHandlers={{ dragend: handleMarkerDrag }}
            />
          )}
        </MapContainer>

        <div className="lpm-map-hint">
          {hasCoords ? "Drag the pin to fine-tune" : "Click the map to place a pin"}
        </div>
      </div>

      {/* ── Coordinate readout ── */}
      <div className="lpm-coords">
        <div className="lpm-coord-pill">
          <span className="lpm-coord-label">LAT</span>
          {hasCoords
            ? <span className="lpm-coord-val">{markerPos[0].toFixed(6)}</span>
            : <span className="lpm-coord-empty">not set</span>
          }
        </div>
        <div className="lpm-coord-pill">
          <span className="lpm-coord-label">LNG</span>
          {hasCoords
            ? <span className="lpm-coord-val">{markerPos[1].toFixed(6)}</span>
            : <span className="lpm-coord-empty">not set</span>
          }
        </div>
      </div>

    </div>
  );
}