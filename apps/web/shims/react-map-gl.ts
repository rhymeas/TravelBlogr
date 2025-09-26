// React-Map-GL shim - provides stub components for server-side rendering
// This prevents build errors when react-map-gl is not installed

import React from 'react'

const StubComponent = ({ children, ...props }: any) => {
  return React.createElement('div', { 
    className: 'map-stub bg-gray-100 rounded-lg flex items-center justify-center',
    style: { height: '400px', ...props.style }
  }, 'Mapbox loading...')
}

export default StubComponent
export const Marker = StubComponent
export const Popup = StubComponent
export const Source = StubComponent
export const Layer = StubComponent
export const NavigationControl = StubComponent
export const GeolocateControl = StubComponent
export const ScaleControl = StubComponent

export type MapRef = any
export type ViewState = any
