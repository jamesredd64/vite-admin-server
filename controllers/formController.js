const { body, validationResult } = require("express-validator");
const FormSubmission = require("../models/form.model.js");
const sanitizeHtml = require("sanitize-html");

const validateFormSubmission = [
  body("firstName").isString().isLength({ min: 2 }).withMessage("First name must be at least 2 characters"),
  body("lastName").isString().isLength({ min: 2 }).withMessage("Last name must be at least 2 characters"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("eventDate").isISO8601().withMessage("Invalid event date format"),
];

const submitForm = async (req, res) => {
  // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Verify API authentication token
  const secretToken = req.headers["x-webflow-token"];
  if (secretToken !== process.env.WEBFLOW_SECRET) {
    return res.status(403).json({ success: false, error: "Unauthorized" });
  }

  try {
    const { firstName, lastName, email, phoneNumber, zipCode, eventDate, extendedProps } = req.body;

    // Sanitize inputs
    const sanitizedExtendedProps = extendedProps || { source: "other" };

    // Find and update existing submission, or create a new one
    const updatedFormSubmission = await FormSubmission.findOneAndUpdate(
      { email }, // Look for submission by email
      {
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || "",
        zipCode: zipCode || "",
        eventDate,
        submittedAt: new Date(),
        extendedProps: sanitizedExtendedProps,
      },
      {
        new: true, // Return updated document
        upsert: true, // Insert if not found
        runValidators: true, // Validate schema constraints
        setDefaultsOnInsert: true, // Apply default values when inserting
      }
    );

    return res.status(200).json({ success: true, message: "Form submission updated successfully", data: updatedFormSubmission });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { submitForm, validateFormSubmission };




