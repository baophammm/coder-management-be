const { AppError, sendResponse } = require("../helpers/utils");
var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.status(200).send("Welcome to CoderManagement!");
});

const userRouter = require("./user.api.js");
router.use("/users", userRouter);

const taskRouter = require("./task.api.js");
router.use("/tasks", taskRouter);

module.exports = router;
