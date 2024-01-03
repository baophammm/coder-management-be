const express = require("express");
const router = express.Router();
const { query, body, param } = require("express-validator");
const {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
} = require("../controllers/user.controllers.js");

//Read
router.get("/", getUsers);

//Create
router.post(
  "/",
  body("name")
    .notEmpty()
    .isString()
    .escape()
    .withMessage("name cannot be empty"),
  createUser
);

//Update
router.put(
  "/:userId",
  param("userId")
    .exists()
    .notEmpty()
    .withMessage("userId cannot be empty")
    .isMongoId()
    .withMessage("UserId must be a MongoDB ObjectId"),
  updateUser
);

//Delete
router.delete(
  "/:userId",
  param("userId")
    .exists()
    .notEmpty()
    .withMessage("userId cannot be empty")
    .isMongoId()
    .withMessage("UserId must be a MongoDB ObjectId"),
  deleteUser
);

module.exports = router;
