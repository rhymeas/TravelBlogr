// Turf.js shim - provides stub implementations for geospatial calculations
// This prevents build errors when @turf/turf is not installed

export const distance = () => 0
export const bearing = () => 0
export const destination = () => ({ geometry: { coordinates: [0, 0] } })
export const lineString = () => ({ geometry: { coordinates: [] } })
export const point = () => ({ geometry: { coordinates: [0, 0] } })
export const bbox = () => [0, 0, 0, 0]
export const center = () => ({ geometry: { coordinates: [0, 0] } })
export const length = () => 0

export default {
  distance,
  bearing,
  destination,
  lineString,
  point,
  bbox,
  center,
  length
}
