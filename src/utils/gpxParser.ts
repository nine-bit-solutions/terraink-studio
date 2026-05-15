export const parseGPX = async (file: File): Promise<[number, number][]> => {
  const text = await file.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");
  
  // This finds every 'track point' in your Strava file
  const points = Array.from(xml.querySelectorAll("trkpt")).map((pt) => {
    const lon = parseFloat(pt.getAttribute("lon") || "0");
    const lat = parseFloat(pt.getAttribute("lat") || "0");
    return [lon, lat] as [number, number];
  });

  return points;
};