const { v4: uuidv4 } = require('uuid');

const formatDate = (date) => {
  return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

function generateICalEvent(event) {
  // Add timezone identifier to DTSTART and DTEND
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//hacksw/handcal//NONSGML v1.0//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uuidv4()}@${process.env.DOMAIN || 'stagholme.com'}
DTSTAMP:${formatDate(new Date())}
DTSTART;TZID=America/New_York:${formatDateWithoutZ(event.startTime)}
DTEND;TZID=America/New_York:${formatDateWithoutZ(event.endTime)}
SUMMARY:${event.summary}
DESCRIPTION:${event.description}
LOCATION:${event.location}
ORGANIZER;CN=${event.organizer?.name || 'Event Organizer'}:mailto:${event.organizer?.email || process.env.EMAIL_FROM}
ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${event.to.name || event.to.email}:mailto:${event.to.email}
END:VEVENT
END:VCALENDAR`;
}

// New helper function to format date without Z suffix
function formatDateWithoutZ(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, '').replace(/[-:]/g, '');
}

module.exports = {
  generateICalEvent,
  formatDate
};
