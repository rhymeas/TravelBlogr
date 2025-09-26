// Leaflet shim - provides stub implementations for server-side rendering
// This prevents build errors when leaflet is not installed

export const Icon = {
  Default: {
    prototype: {},
    mergeOptions: () => {}
  }
}

export const divIcon = () => ({})
export const latLng = (lat: number, lng: number) => ({ lat, lng, distanceTo: () => 0 })
export const latLngBounds = () => ({
  extend: () => {},
  isValid: () => true
})

export default {
  Icon,
  divIcon,
  latLng,
  latLngBounds
}
