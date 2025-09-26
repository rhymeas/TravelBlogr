// React-Leaflet shim - provides stub components for server-side rendering
// This prevents build errors when react-leaflet is not installed

import React from 'react'

const StubComponent = ({ children, ...props }: any) => {
  return React.createElement('div', { 
    className: 'map-stub bg-gray-100 rounded-lg flex items-center justify-center',
    style: { height: '400px', ...props.style }
  }, 'Map loading...')
}

export const MapContainer = StubComponent
export const TileLayer = StubComponent
export const Marker = StubComponent
export const Popup = StubComponent
export const Polyline = StubComponent
export const useMap = () => ({})
export const useMapEvents = () => ({})

export default {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents
}
