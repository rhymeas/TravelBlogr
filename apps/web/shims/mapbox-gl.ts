// Mapbox GL shim - provides stub implementations for server-side rendering
// This prevents build errors when mapbox-gl is not installed

export const accessToken = ''

export default {
  accessToken: '',
  Map: class {
    constructor() {}
    on() {}
    off() {}
    addSource() {}
    addLayer() {}
    removeLayer() {}
    removeSource() {}
    setCenter() {}
    setZoom() {}
    fitBounds() {}
    remove() {}
  },
  Marker: class {
    constructor() {}
    setLngLat() { return this }
    addTo() { return this }
    remove() {}
  },
  Popup: class {
    constructor() {}
    setLngLat() { return this }
    setHTML() { return this }
    addTo() { return this }
    remove() {}
  }
}
