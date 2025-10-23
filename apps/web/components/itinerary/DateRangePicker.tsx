'use client'

/**
 * sleek-style Date Range Picker
 * Mobile: 1 month, Desktop: 2 months side-by-side
 */

import { useState, useEffect } from 'react'
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
  const [isMobile, setIsMobile] = useState(false)

  // Sync internal state with props (for date persistence after login)
  useEffect(() => {
    if (startDate && endDate) {
      setRange({
        from: startDate,
        to: endDate
      })
    }
  }, [startDate, endDate])

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 700)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

          {/* Calendar - Responsive: Mobile (1 month) vs Desktop (2 months) */}
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[110] p-4 max-w-[95vw] w-full"
            style={{
              maxHeight: '90vh',
              overflowY: 'auto',
              width: isMobile ? 'calc(100vw - 2rem)' : 'auto',
              maxWidth: isMobile ? '400px' : '750px'
            }}
          >
            <style>{`
              .rdp {
                --rdp-cell-size: 40px;
                --rdp-accent-color: #000;
                --rdp-background-color: #f7f7f7;
                margin: 0;
              }

              /* Mobile: Single month, larger touch targets */
              @media (max-width: 699px) {
                .rdp {
                  --rdp-cell-size: 44px;
                }
                .rdp-months {
                  display: flex !important;
                  flex-direction: column !important;
                  gap: 0;
                }
              }

              /* Desktop: Show months side-by-side */
              @media (min-width: 700px) {
                .rdp {
                  --rdp-cell-size: 40px;
                }
                .rdp-months {
                  display: flex !important;
                  flex-direction: row !important;
                  justify-content: center;
                  gap: 1.25rem;
                  flex-wrap: nowrap !important;
                }
              }

              .rdp-month {
                margin: 0;
              }
              .rdp-caption {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 0 0.75rem 0;
                font-weight: 600;
                font-size: 0.9rem;
                position: relative;
              }

              @media (max-width: 699px) {
                .rdp-caption {
                  font-size: 1.1rem;
                  padding: 0.5rem 0 1rem 0;
                  display: flex !important;
                  flex-direction: row !important;
                  justify-content: space-between !important;
                  align-items: center !important;
                }
              }

              .rdp-caption_label {
                text-align: center;
                flex: 1;
                padding: 0 0.5rem;
                order: 2;
              }

              .rdp-nav {
                display: flex;
                gap: 0.5rem;
                align-items: center;
              }

              @media (max-width: 699px) {
                .rdp-nav {
                  display: flex !important;
                  flex-direction: row !important;
                  gap: 0.5rem;
                  position: static !important;
                }
              }

              .rdp-nav_button_previous {
                order: 1;
              }

              .rdp-nav_button_next {
                order: 3;
              }
              .rdp-nav_button {
                width: 32px;
                height: 32px;
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

              @media (max-width: 699px) {
                .rdp-nav_button {
                  width: 44px;
                  height: 44px;
                }
              }

              .rdp-nav_button:hover {
                background-color: #f7f7f7;
              }
              .rdp-nav_button svg {
                width: 14px;
                height: 14px;
              }

              @media (max-width: 699px) {
                .rdp-nav_button svg {
                  width: 20px;
                  height: 20px;
                }
              }

              .rdp-head_cell {
                font-weight: 600;
                font-size: 0.7rem;
                color: #6b7280;
                text-transform: uppercase;
              }

              @media (max-width: 699px) {
                .rdp-head_cell {
                  font-size: 0.8rem;
                }
              }

              .rdp-cell {
                padding: 2px;
              }

              @media (max-width: 699px) {
                .rdp-cell {
                  padding: 3px;
                }
              }

              .rdp-day {
                border-radius: 50%;
                font-size: 0.85rem;
                transition: all 0.2s;
                font-weight: 500;
              }

              @media (max-width: 699px) {
                .rdp-day {
                  font-size: 1rem;
                  font-weight: 600;
                }
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
              numberOfMonths={isMobile ? 1 : 2}
              disabled={{ before: new Date() }}
              showOutsideDays={false}
            />

            <div className="pt-4 border-t mt-3">
              {/* Hint message */}
              <div className="mb-4 min-h-[24px]">
                {!range?.from && (
                  <p className="text-sm text-gray-400 text-center">
                    Select at least 2 days for your trip
                  </p>
                )}
                {range?.from && !range?.to && (
                  <p className="text-sm text-gray-400 text-center">
                    Select an end date
                  </p>
                )}
                {range?.from && range?.to && range.from === range.to && (
                  <p className="text-sm text-gray-400 text-center">
                    Please select at least 2 days
                  </p>
                )}
                {isValidRange && (
                  <p className="text-sm text-gray-700 text-center font-semibold">
                    {getDaysDifference()} {getDaysDifference() === 1 ? 'day' : 'days'} selected
                  </p>
                )}
              </div>

              {/* Buttons - Mobile optimized */}
              <div className="flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRange(undefined)
                    onSelect(null)
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 underline px-2 py-2"
                >
                  Clear dates
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={!isValidRange}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
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

