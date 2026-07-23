const ApiError = require("../utils/ApiError");

/**
 * Queries OpenStreetMap's free Overpass API for nearby amenities —
 * used for Nearby Police / Hospitals / Safe Zones and the Crime Heatmap
 * "nearby safe spots" list. No API key required.
 */
const AMENITY_MAP = {
  police: 'node["amenity"="police"]',
  hospital: 'node["amenity"="hospital"]',
  pharmacy: 'node["amenity"="pharmacy"]',
  metro: 'node["railway"="station"]',
};

const searchNearby = async (latitude, longitude, category = "police", radiusMeters = 3000) => {
  const selector = AMENITY_MAP[category];
  if (!selector) {
    throw new ApiError(400, `Unsupported nearby category: ${category}`);
  }

  const query = `
    [out:json][timeout:15];
    (
      ${selector}(around:${radiusMeters},${latitude},${longitude});
    );
    out center 20;
  `;

  const url = process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter";

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new ApiError(502, "Failed to fetch nearby places.");
  }

  const data = await response.json();

  return (data.elements || []).map((el) => ({
    id: el.id,
    name: el.tags?.name || category.charAt(0).toUpperCase() + category.slice(1),
    latitude: el.lat,
    longitude: el.lon,
    category,
  }));
};

module.exports = { searchNearby };
