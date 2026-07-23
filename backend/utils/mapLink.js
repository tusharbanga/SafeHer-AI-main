/**
 * Builds a shareable Google Maps link from a latitude/longitude pair.
 * Used by the SOS system and live-tracking share links.
 */
const buildGoogleMapsLink = (latitude, longitude) => {
  const base = process.env.GOOGLE_MAPS_BASE_URL || "https://www.google.com/maps";
  return `${base}?q=${latitude},${longitude}`;
};

module.exports = { buildGoogleMapsLink };
