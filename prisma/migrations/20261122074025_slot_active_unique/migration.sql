-- Create partial unique index on Booking(slotId) for active bookings
CREATE UNIQUE INDEX "Booking_slotId_active_key" ON "Booking" ("slotId")
WHERE status NOT IN ('DECLINED', 'CANCELLED');
