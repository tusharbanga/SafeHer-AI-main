const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
    replies: [replySchema],
  },
  { timestamps: true }
);

const communityPostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    type: {
      type: String,
      enum: ["general", "walking_group", "travel_group", "anonymous_report"],
      default: "general",
    },
    isAnonymous: { type: Boolean, default: false },
    location: {
      latitude: Number,
      longitude: Number,
      label: String,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

communityPostSchema.index({ createdAt: -1 });
communityPostSchema.virtual("likesCount").get(function likesCount() {
  return this.likes.length;
});
communityPostSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("CommunityPost", communityPostSchema);
