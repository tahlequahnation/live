document.addEventListener('DOMContentLoaded', () => {
  const tripParam = new URLSearchParams(window.location.search).get('trip');
  const tripSelect = document.getElementById('trip-select');
  const tripSummary = document.getElementById('trip-summary');

  if (tripSelect && tripParam) {
    tripSelect.value = tripParam;
  }

  if (tripSummary && tripParam) {
    const details = {
      striper: {
        title: 'Striper Catch, Clean, Cook',
        subtitle: 'Capt. Wayne • 6 hour excursion • $489 • Up to 4 people'
      },
      catfish: {
        title: 'Catfish Catch, Cook, Clean',
        subtitle: 'Capt. Steve • 6 hour excursion • $489 • Up to 4 people'
      }
    };

    const selected = details[tripParam] || details.striper;
    tripSummary.innerHTML = `
      <span class="summary-label">Selected trip</span>
      <h2>${selected.title}</h2>
      <p>${selected.subtitle}</p>
    `;
  }

  const bookingForm = document.getElementById('booking-form');

  if (bookingForm) {
    bookingForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(bookingForm);
      const payload = Object.fromEntries(formData.entries());
      payload.partySize = Number(payload.partySize || 1);
      payload.trip = payload.trip || tripParam || 'striper';

      const submitButton = bookingForm.querySelector('button[type="submit"]');
      const statusBox = document.getElementById('booking-status');

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
      }

      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Booking failed.');
        }

        if (statusBox) {
          statusBox.innerHTML = `
            <strong>Booking received.</strong>
            <p>Your trip request has been submitted and payment can be completed securely through Square.</p>
          `;
          statusBox.classList.add('success');
        }

        if (result.paymentLink) {
          window.location.href = result.paymentLink;
        }
      } catch (error) {
        if (statusBox) {
          statusBox.textContent = error.message || 'Unable to submit booking request.';
          statusBox.classList.add('error');
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Request Booking';
        }
      }
    });
  }
});
