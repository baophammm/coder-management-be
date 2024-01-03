const express = require("express");
const router = express.Router();
const { query, body, param } = require("express-validator");
const {
  getTasks,
  createTask,
  updateTask,
  softDeleteTask,
  deleteTaskAssignee,
  getTaskById,
  hardDeleteTask,
} = require("../controllers/task.controllers.js");

//Read
router.get("/", getTasks);

//Create
router.post(
  "/",
  [
    body(["name", "description"])
      .notEmpty()
      .isString()
      .withMessage("name and description cannot be empty and must be string"),
    body("assignee")
      .optional()
      .isMongoId()
      .withMessage("Assignee must be in MongoDB ObjectId format"),
  ],
  createTask
);

//Get A Task By Id
router.get(
  "/:taskId",
  param("taskId")
    .exists()
    .withMessage("taskId cannot be empty")
    .isMongoId()
    .withMessage("taskId must be in MongoDb ObjectId format"),
  getTaskById
);

//Update
router.put(
  "/:taskId",
  param("taskId")
    .exists()
    .withMessage("taskId cannot be empty")
    .isMongoId()
    .withMessage("taskId must be in MongoDb ObjectId format"),
  updateTask
);

//Soft Delete A Task
router.delete(
  "/softdelete/:taskId",
  param("taskId")
    .exists()
    .withMessage("taskId cannot be empty")
    .isMongoId()
    .withMessage("taskId must be in MongoDb ObjectId format"),
  softDeleteTask
);

//Hard Delete A Task
router.delete(
  "/harddelete/:taskId",
  param("taskId")
    .exists()
    .withMessage("taskId cannot be empty")
    .isMongoId()
    .withMessage("taskId must be in MongoDb ObjectId format"),
  hardDeleteTask
);

//Delete Assignee of a Task
router.delete(
  "/:taskId/assignee",
  param("taskId")
    .exists()
    .withMessage("taskId cannot be empty")
    .isMongoId()
    .withMessage("TaskId must be in MongoDB ObjectId format"),
  deleteTaskAssignee
);
module.exports = router;
