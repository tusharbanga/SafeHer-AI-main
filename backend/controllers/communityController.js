const CommunityPost = require("../models/CommunityPost");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { uploadBufferToCloudinary } = require("../services/cloudinaryService");

// @route  GET /api/v1/community/posts
const getPosts = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const posts = await CommunityPost.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "name profileImage")
    .populate("comments.user", "name profileImage");

  new ApiResponse(200, "Community posts fetched.", { posts, page, limit }).send(res);
});

// @route  POST /api/v1/community/posts
const createPost = catchAsync(async (req, res) => {
  const { content, type, isAnonymous, latitude, longitude, locationLabel } = req.body;

  let image;
  if (req.file) {
    const uploaded = await uploadBufferToCloudinary(req.file.buffer, "community-posts", "image");
    image = { url: uploaded.url, publicId: uploaded.publicId };
  }

  const post = await CommunityPost.create({
    user: req.user._id,
    content,
    type: type || "general",
    isAnonymous: !!isAnonymous,
    image,
    location: latitude && longitude ? { latitude, longitude, label: locationLabel } : undefined,
  });

  new ApiResponse(201, "Post created.", { post }).send(res);
});

// @route  DELETE /api/v1/community/posts/:id
const deletePost = catchAsync(async (req, res) => {
  const post = await CommunityPost.findOne({ _id: req.params.id });
  if (!post) throw new ApiError(404, "Post not found.");

  if (post.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own posts.");
  }

  await post.deleteOne();
  new ApiResponse(200, "Post deleted.").send(res);
});

// @route  POST /api/v1/community/posts/:id/like
const likePost = catchAsync(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw new ApiError(404, "Post not found.");

  const alreadyLiked = post.likes.some((id) => id.toString() === req.user._id.toString());
  if (alreadyLiked) throw new ApiError(409, "Post already liked.");

  post.likes.push(req.user._id);
  await post.save();

  new ApiResponse(200, "Post liked.", { likesCount: post.likes.length }).send(res);
});

// @route  DELETE /api/v1/community/posts/:id/like
const unlikePost = catchAsync(async (req, res) => {
  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw new ApiError(404, "Post not found.");

  post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
  await post.save();

  new ApiResponse(200, "Post unliked.", { likesCount: post.likes.length }).send(res);
});

// @route  POST /api/v1/community/posts/:id/comments
const addComment = catchAsync(async (req, res) => {
  const { text } = req.body;
  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw new ApiError(404, "Post not found.");

  post.comments.push({ user: req.user._id, text });
  await post.save();

  new ApiResponse(201, "Comment added.", { comments: post.comments }).send(res);
});

// @route  POST /api/v1/community/posts/:id/comments/:commentId/replies
const addReply = catchAsync(async (req, res) => {
  const { text } = req.body;
  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw new ApiError(404, "Post not found.");

  const comment = post.comments.id(req.params.commentId);
  if (!comment) throw new ApiError(404, "Comment not found.");

  comment.replies.push({ user: req.user._id, text });
  await post.save();

  new ApiResponse(201, "Reply added.", { comment }).send(res);
});

module.exports = { getPosts, createPost, deletePost, likePost, unlikePost, addComment, addReply };
