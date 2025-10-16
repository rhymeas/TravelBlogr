'use client'

/**
 * Airbnb-style Date Range Picker
 */

import { useState } from 'react'
import { DayPicker, DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import 'react-day-picker/dist/style.css'

interface DateRangePickerProps {
  startDate?: Date
  endDate?: Date
  onSelect: (range: { startDate: Date; endDate: Date } | null) => void
}

export function DateRangePicker({ startDate, endDate, onSelect }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [range, setRange] = useState<DateRange | undefined>({
    from: startDate,
    to: endDate
  })

  const handleSelect = (selectedRange: DateRange | undefined) => {
    setRange(selectedRange)
    // Don't close automatically - wait for user to click "Done"
    if (selectedRange?.from && selectedRange?.to) {
      onSelect({
        startDate: selectedRange.from,
        endDate: selectedRange.to
      })
    }
  }

  const displayText = range?.from && range?.to
    ? `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`
    : 'Select dates'

  // Check if valid range is selected (both dates and at least 2 days apart)
  const isValidRange = range?.from && range?.to && range.from !== range.to

  // Calculate number of days selected
  const getDaysDifference = () => {
    if (!range?.from || !range?.to) return 0
    const diffTime = Math.abs(range.to.getTime() - range.from.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left border border-gray-300 rounded-xl hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-1">Dates</div>
            <div className="text-sm text-gray-900">{displayText}</div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </button>

      {/* Calendar Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={() => setIsOpen(false)}
          />

          {/* Calendar - Centered on Screen */}
          <div className="fixed top-1/2 left-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[110] p-3" style={{ width: 'fit-content', minWidth: '650px', maxWidth: '750px', transform: 'translate(-50%, -50%) scale(0.9)' }}>
            <style>{`
              .rdp {
                --rdp-cell-size: 28px;
                --rdp-accent-color: #000;
                --rdp-background-color: #f7f7f7;
                margin: 0;
              }
              .rdp-months {
                display: flex !important;
                flex-direction: row !important;
                justify-content: center;
                gap: 1.25rem;
                flex-wrap: nowrap !important;
              }
              .rdp-month {
                margin: 0;
              }
              .rdp-caption {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 0 0.5rem 0;
                font-weight: 600;
                font-size: 0.8rem;
                position: relative;
              }
              .rdp-caption_label {
                text-align: center;
                flex: 1;
                padding: 0 0.5rem;
              }
              .rdp-nav {
                display: contents;
              }
              .rdp-nav_button {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                flex-shrink: 0;
                background: transparent;
                border: none;
                cursor: pointer;
              }
              .rdp-nav_button:hover {
                background-color: #f7f7f7;
              }
              .rdp-nav_button svg {
                width: 12px;
                height: 12px;
              }
              .rdp-head_cell {
                font-weight: 600;
                font-size: 0.65rem;
                color: #6b7280;
                text-transform: uppercase;
              }
              .rdp-cell {
                padding: 1.5px;
              }
              .rdp-day {
                border-radius: 50%;
                font-size: 0.75rem;
                transition: all 0.2s;
              }
              .rdp-day:hover:not(.rdp-day_selected) {
                background-color: #f7f7f7;
              }
              .rdp-day_selected {
                background-color: #000 !important;
                color: white;
                font-weight: 600;
              }
              .rdp-day_range_middle {
                background-color: #f7f7f7 !important;
                color: #000;
                border-radius: 0;
              }
              .rdp-day_range_start {
                border-radius: 50% 0 0 50% !important;
              }
              .rdp-day_range_end {
                border-radius: 0 50% 50% 0 !important;
              }
              .rdp-day_disabled {
                opacity: 0.3;
              }
            `}</style>
            
            <DayPicker
              mode="range"
              selected={range}
              onSelect={handleSelect}
              numberOfMonths={2}
              disabled={{ before: new Date() }}
              showOutsideDays={false}
            />

            <div className="pt-3 border-t mt-2">
              {/* Hint message */}
              <div className="mb-3 min-h-[20px]">
                {!range?.from && (
                  <p className="text-xs text-gray-400 text-center">
                    Select at least 2 days for your trip
                  </p>
                )}
                {range?.from && !range?.to && (
                  <p className="text-xs text-gray-400 text-center">
                    Select an end date
                  </p>
                )}
                {range?.from && range?.to && range.from === range.to && (
                  <p className="text-xs text-gray-400 text-center">
                    Please select at least 2 days
                  </p>
                )}
                {isValidRange && (
                  <p className="text-xs text-gray-500 text-center font-medium">
                    {getDaysDifference()} {getDaysDifference() === 1 ? 'day' : 'days'} selected
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setRange(undefined)
                    onSelect(null)
                  }}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 underline"
                >
                  Clear dates
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={!isValidRange}
                  className={`px-4 py-1.5 rounded-lg font-medium text-xs transition-all ${
                    isValidRange
                      ? 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

