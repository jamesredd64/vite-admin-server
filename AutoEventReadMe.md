Let me break down the flow of scheduled events from autoEventInvitation.js:
First, when a new event is scheduled, it's saved to MongoDB using the ScheduledEvent model with these key fields:
 eventDetails (start/end time, summary, description, location, organizer)
 selectedUsers (array of recipients)
 scheduledTime (when to send invitations)
 status (starts as 'pending')
The auto-invitation scheduler runs twice daily via cron jobs:

```
// Runs at 9 AM
// Runs at 9 AM
const morningJob = new CronJob('0 9 * * *', () => {
  processNewUsers();
});

// Runs at 3 PM
const afternoonJob = new CronJob('0 15 * * *', () => {
  processNewUsers();
});

// Runs at 3 PM
const afternoonJob = new CronJob('0 15 * * *', () => {
  processNewUsers();
});
```


When processNewUsers() runs, it:
Finds all upcoming events where status: 'pending'
For each event, it:
Creates/updates metadata tracking who received invitations
Finds new users created since last run
Sends calendar invitations to new users via email with iCal attachments
Updates the metadata with processed users
The invitation emails contain:
iCal event attachment generated via generateICalEvent()
Event details (summary, time, location etc.)
REQUEST method for calendar apps to handle it as an invitation
Key points:
Events are stored persistently in MongoDB
The scheduler runs automatically at set times
It tracks which users already received invitations
New users automatically get invitations to upcoming events
All email sending is handled asynchronously with error handling
The system ensures that scheduled events reliably reach all intended recipients, even if they join after the event was initially created