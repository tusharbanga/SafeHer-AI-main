const express = require("express");
const { body } = require("express-validator");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const controller = require("../controllers/contactController");

const router = express.Router();

router.use(protect);

router.get("/", controller.getContacts);
router.post(
  "/",
  [
    body("name").trim().notEmpty(),
    body("relationship").trim().notEmpty(),
    body("phone").trim().notEmpty(),
  ],
  validate,
  controller.createContact
);
router.patch("/reorder", controller.reorderContacts);
router.get("/:id", controller.getContact);
router.patch("/:id", controller.updateContact);
router.delete("/:id", controller.deleteContact);

module.exports = router;
