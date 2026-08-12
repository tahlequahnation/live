const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const bookingsFile = path.join(__dirname, 'bookings.json');

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function readBookings() {
  try {
    const raw = fs.readFileSync(bookingsFile, 'utf8');
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function writeBookings(data) {
  fs.writeFileSync(bookingsFile, JSON.stringify(data, null, 2));
}

function getTripName(trip) {
  const map = {
    striper: 'Striper Catch, Clean, Cook with Capt. Wayne',
    catfish: 'Catfish Catch, Cook, Clean with Capt. Bradley'
  };
  return map[trip] || trip;
}

app.get('/api/bookings', (req, res) => {
  res.json(readBookings());
});

app.get('/api/availability', (req, res) => {
  const { trip, date } = req.query;
  if (!trip || !date) {
    return res.status(400).json({ error: 'Trip and date are required.' });
  }

  const bookings = readBookings().filter((booking) => {
    return booking.trip === trip && booking.date === date && booking.status !== 'cancelled';
  });

  const totalBooked = bookings.reduce((sum, booking) => sum + Number(booking.partySize || 1), 0);

  res.json({
    trip,
    date,
    totalBooked,
    capacity: 4,
    available: totalBooked < 4,
    bookings
  });
});

app.post('/api/bookings', (req, res) => {
  const booking = req.body || {};

  const requiredFields = ['name', 'email', 'phone', 'trip', 'date', 'time', 'partySize'];
  const hasMissingFields = requiredFields.some((field) => !booking[field]);

  if (hasMissingFields) {
    return res.status(400).json({ error: 'Missing required booking fields.' });
  }

  const tripName = getTripName(booking.trip);
  const bookings = readBookings();

  const alreadyBooked = bookings.some((item) => {
    return (
      item.trip === booking.trip &&
      item.date === booking.date &&
      item.time === booking.time &&
      item.status !== 'cancelled'
    );
  });

  if (alreadyBooked) {
    return res.status(409).json({ error: 'That trip time is already booked.' });
  }

  const record = {
    id: `booking-${Date.now()}`,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    trip: booking.trip,
    tripName,
    date: booking.date,
    time: booking.time,
    partySize: Number(booking.partySize),
    notes: booking.notes || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    paymentProvider: 'Square',
    paymentLink: 'https://square.link/u/boyHZkQf'
  };

  bookings.push(record);
  writeBookings(bookings);

  return res.json({
    success: true,
    booking: record,
    paymentLink: record.paymentLink,
    message: 'Booking request received. Complete payment through Square.'
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Muskogee Fishing Tours booking server running at http://localhost:${PORT}`);
});
