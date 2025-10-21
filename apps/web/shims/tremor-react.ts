// Minimal stub for @tremor/react to unblock builds on  do-not-use-this-anymore-no-vercel-we-use-railway-now.
// Replace by installing the real package and removing this alias.
import * as React from 'react'

function passthrough(tag: keyof JSX.IntrinsicElements) {
  return ({ children, ...props }: any) => React.createElement(tag, props, children)
}

export const Card = passthrough('div')
export const Title = passthrough('h3')
export const Text = passthrough('p')
export const Metric = passthrough('div')
export const Flex = ({ children, ...props }: any) =>
  React.createElement('div', { style: { display: 'flex' }, ...props }, children)
export const Grid = passthrough('div')
export const AreaChart = passthrough('div')
export const BarChart = passthrough('div')
export const DonutChart = passthrough('div')
export const LineChart = passthrough('div')

