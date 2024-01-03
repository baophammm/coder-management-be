const mongoose = require("mongoose");
// Create Schema
const taskSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "working", "review", "done", "archive"],
      required: true,
    },
    assignee: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: true,
  }
);

//Create and export model
const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
