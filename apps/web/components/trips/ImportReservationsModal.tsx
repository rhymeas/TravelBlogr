'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { ImportReservationsPanel } from './ImportReservationsPanel'

interface ImportReservationsModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
}

export function ImportReservationsModal({
  isOpen,
  onClose,
  tripId,
}: ImportReservationsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Reservations</DialogTitle>
        </DialogHeader>
        <ImportReservationsPanel
          tripId={tripId}
          onImportComplete={() => {
            // Optionally close modal after successful import
            // onClose()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

