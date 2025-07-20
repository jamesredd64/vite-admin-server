const { body, validationResult } = require("express-validator");
const FormSubmission = require("../models/form.model.js");
const sanitizeHtml = require("sanitize-html");
const tokenStore = require("../utils/tokenStore");

const validateFormSubmission = [
  body("firstName").isString().isLength({ min: 2 }).withMessage("First name must be at least 2 characters"),
  body("lastName").isString().isLength({ min: 2 }).withMessage("Last name must be at least 2 characters"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("eventDate").isISO8601().withMessage("Invalid event date format"),
  body("eventName").isString().isLength({ min: 2 }).withMessage("Invalid event name"),
  body("eventLocation").isString().isLength({ min: 2 }).withMessage("Invalid event location"),
  body("token").isString().withMessage("Token is required"),
];

const submitForm = async (req, res) => {
  // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Validate token from request body
  const { token } = req.body;
  if (!tokenStore.isValid(token)) {
    return res.status(403).json({ success: false, error: "Invalid or expired token" });
  }

  try {
    const { firstName, lastName, email, phoneNumber, eventName, eventLocation, zipCode, eventDate, extendedProps } = req.body;

    // Sanitize inputs
    const sanitizedExtendedProps = extendedProps || { source: "other" };

    // Create a new submission document
    const newFormSubmission = new FormSubmission({
      firstName: firstName,
      lastName: lastName,
      email: email,
      phoneNumber: phoneNumber || "",
      eventName: eventName || "",
      eventLocation: eventLocation || "",
      zipCode: zipCode || "",
      eventDate: eventDate,
      submittedAt: new Date(),
      extendedProps: sanitizedExtendedProps,
    });

    await newFormSubmission.save();

    return res.status(200).json({ success: true, message: "Form submission created successfully", data: newFormSubmission });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { submitForm, validateFormSubmission };
