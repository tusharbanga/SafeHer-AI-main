const express = require("express");
const { body } = require("express-validator");
const { protect } = require("../middleware/auth");
const { uploadImage } = require("../middleware/upload");
const validate = require("../middleware/validate");
const controller = require("../controllers/communityController");

const router = express.Router();

router.use(protect);

router.get("/posts", controller.getPosts);
router.post(
  "/posts",
  uploadImage.single("image"),
  [body("content").trim().notEmpty()],
  validate,
  controller.createPost
);
router.delete("/posts/:id", controller.deletePost);
router.post("/posts/:id/like", controller.likePost);
router.delete("/posts/:id/like", controller.unlikePost);
router.post(
  "/posts/:id/comments",
  [body("text").trim().notEmpty()],
  validate,
  controller.addComment
);
router.post(
  "/posts/:id/comments/:commentId/replies",
  [body("text").trim().notEmpty()],
  validate,
  controller.addReply
);

module.exports = router;
