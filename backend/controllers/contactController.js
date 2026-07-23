const EmergencyContact = require("../models/EmergencyContact");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @route  GET /api/v1/contacts
const getContacts = catchAsync(async (req, res) => {
  const contacts = await EmergencyContact.find({ user: req.user._id }).sort({ priority: 1, createdAt: 1 });
  new ApiResponse(200, "Emergency contacts fetched.", { contacts }).send(res);
});

// @route  POST /api/v1/contacts
const createContact = catchAsync(async (req, res) => {
  const { name, relationship, phone, email, priority, sosMessage } = req.body;

  const contact = await EmergencyContact.create({
    user: req.user._id,
    name,
    relationship,
    phone,
    email,
    priority,
    sosMessage,
  });

  new ApiResponse(201, "Emergency contact added.", { contact }).send(res);
});

// @route  GET /api/v1/contacts/:id
const getContact = catchAsync(async (req, res) => {
  const contact = await EmergencyContact.findOne({ _id: req.params.id, user: req.user._id });
  if (!contact) throw new ApiError(404, "Emergency contact not found.");
  new ApiResponse(200, "Emergency contact fetched.", { contact }).send(res);
});

// @route  PATCH /api/v1/contacts/:id
const updateContact = catchAsync(async (req, res) => {
  const allowedFields = ["name", "relationship", "phone", "email", "priority", "sosMessage"];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const contact = await EmergencyContact.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!contact) throw new ApiError(404, "Emergency contact not found.");

  new ApiResponse(200, "Emergency contact updated.", { contact }).send(res);
});

// @route  DELETE /api/v1/contacts/:id
const deleteContact = catchAsync(async (req, res) => {
  const contact = await EmergencyContact.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!contact) throw new ApiError(404, "Emergency contact not found.");
  new ApiResponse(200, "Emergency contact removed.").send(res);
});

// @route  PATCH /api/v1/contacts/reorder
// Body: { orderedIds: ["id1", "id2", ...] } — sets priority based on array order
const reorderContacts = catchAsync(async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) throw new ApiError(400, "orderedIds must be an array.");

  await Promise.all(
    orderedIds.map((id, index) =>
      EmergencyContact.updateOne({ _id: id, user: req.user._id }, { priority: index })
    )
  );

  const contacts = await EmergencyContact.find({ user: req.user._id }).sort({ priority: 1 });
  new ApiResponse(200, "Contacts reordered.", { contacts }).send(res);
});

module.exports = {
  getContacts,
  createContact,
  getContact,
  updateContact,
  deleteContact,
  reorderContacts,
};
