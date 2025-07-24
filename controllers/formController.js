const { validationResult } = require("express-validator");
const FormSubmission = require("../models/form.model");
const tokenStore = require("../utils/tokenStore");
const SingleUserEventService = require("../services/singleUserEventService"); // 🔁 New import

const submitForm = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // const { token } = req.body;
  // const isLocal = process.env.RUN_MODE === 'd';
  // if (!isLocal && !tokenStore.isValid(token)) {
  //   return res.status(403).json({ success: false, error: "Invalid or expired token" });
  // }

  try {
    
    console.log('📦 Incoming event data:', req.body);

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      eventName,
      eventLocation,
      zipCode,
      eventDate,
      extendedProps
    } = req.body;

    const sanitizedExtendedProps = extendedProps || { source: "other" };

    const newFormSubmission = new FormSubmission({
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || "",
      eventName: eventName || "",
      eventLocation: eventLocation || "",
      zipCode: zipCode || "",
      eventDate,
      submittedAt: new Date(),
      extendedProps: sanitizedExtendedProps
    });

    await newFormSubmission.save();

    const eventDetails = {
      startTime: new Date(eventDate),
      endTime: new Date(new Date(eventDate).getTime() + 2 * 60 * 60 * 1000),
      summary: eventName,
      description: `Event at ${eventLocation}`,
      location: eventLocation,
      organizer: {
        name: `${firstName} ${lastName}`,
        email
      }
    };

    console.log("📦 Scheduling single-user event and sending invitation...");

    await SingleUserEventService.scheduleAndNotify({
      eventDetails,
      selectedUser: {
        email,
        name: `${firstName} ${lastName}`
      }
    });

    return res.status(200).json({
      success: true,
      message: "Form submitted and calendar invite sent successfully",
      data: newFormSubmission
    });

  } catch (error) {
    console.error("❌ Error in submit-form handler:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};


// const submitForm = async (req, res) => {
//   // Validate request data
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ success: false, errors: errors.array() });
//   }

//   // Validate token from request body
//   const { token } = req.body;
//   const isLocal = process.env.RUN_MODE === 'd';
//   if (!isLocal && !tokenStore.isValid(token)) {
//     return res.status(403).json({ success: false, error: "Invalid or expired token" });
//   }

//   try {
//     const {
//       firstName,
//       lastName,
//       email,
//       phoneNumber,
//       eventName,
//       eventLocation,
//       zipCode,
//       eventDate,
//       extendedProps
//     } = req.body;

//     const sanitizedExtendedProps = extendedProps || { source: "other" };

//     const newFormSubmission = new FormSubmission({
//       firstName,
//       lastName,
//       email,
//       phoneNumber: phoneNumber || "",
//       eventName: eventName || "",
//       eventLocation: eventLocation || "",
//       zipCode: zipCode || "",
//       eventDate,
//       submittedAt: new Date(),
//       extendedProps: sanitizedExtendedProps
//     });

//     await newFormSubmission.save();

//     const eventDetails = {
//       startTime: new Date(eventDate),
//       endTime: new Date(new Date(eventDate).getTime() + 2 * 60 * 60 * 1000),
//       summary: eventName,
//       description: `Event at ${eventLocation}`,
//       location: eventLocation,
//       organizer: {
//         name: `${firstName} ${lastName}`,
//         email
//       }
//     };

//     const selectedUsers = [{
//       email,
//       name: `${firstName} ${lastName}`
//     }];

//     const payloadForScheduling = {
//       eventDetails,
//       scheduledTime: new Date(),
//       selectedUsers
//     };

//     console.log("📦 Scheduling payload:", JSON.stringify(payloadForScheduling, null, 2));

//     if (!eventDetails || !selectedUsers.length) {
//       console.warn("⚠️ Skipping scheduling due to incomplete payload.");
//     } else {
//       await ScheduledEventService.scheduleEvent(payloadForScheduling);
//     }

//     await ScheduledEventService.sendImmediateInvitations({
//       ...eventDetails,
//       selectedUsers
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Form submission created, event scheduled, and confirmation email sent successfully",
//       data: newFormSubmission
//     });

//   } catch (error) {
//     console.error("Error in submit-form handler:", error);
//     return res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };
