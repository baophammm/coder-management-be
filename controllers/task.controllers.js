const { sendResponse, AppError } = require("../helpers/utils.js");
const mongoose = require("mongoose");
const Task = require("../models/Task.js");
const User = require("../models/User.js");
const { validationResult } = require("express-validator");
const taskController = {};

//Create a Task
taskController.createTask = async (req, res, next) => {
  // post input validation
  const allowData = ["name", "description", "status", "assignee"];
  const result = validationResult(req);

  try {
    //validate name, description existence and assignee format
    if (!result.isEmpty()) {
      const errors = result.array();
      errors.map((error) => {
        const errorMessage = `${error.msg}. Error type: ${error.type}. Location: ${error.location}. Path: ${error.path}. Value: ${error.value}`;
        throw new AppError(400, errorMessage, "Create Task Error");
      });
    }

    const newTaskInput = req.body;
    const newTaskInputKeys = Object.keys(newTaskInput);

    //find task input keys that are not allowed
    newTaskInputKeys.map((key) => {
      if (!allowData.includes(key))
        throw new AppError(
          400,
          `Key ${key} is not allowed`,
          "Create Task Error"
        );
    });
    if (!newTaskInput)
      throw new AppError(400, "Missing New Task", "Create Task Error");

    //Check if assignee id is valid

    if (newTaskInput.assignee) {
      const targetAssignee = await User.findById(newTaskInput.assignee);
      if (!targetAssignee) {
        throw new AppError(
          404,
          "Assignee Not Found in Users collection",
          "Create Task Error"
        );
      }
    }

    const newTask = newTaskInput.assignee
      ? {
          name: newTaskInput.name,
          description: newTaskInput.description,
          status: newTaskInput.status || "pending",
          assignee: new mongoose.Types.ObjectId(newTaskInput.assignee),
        }
      : {
          name: newTaskInput.name,
          description: newTaskInput.description,
          status: newTaskInput.status || "pending",
        };

    //mongoose query
    const created = await Task.create(newTask);

    // If there is an Assignee, add new task _id to Assignee's task list
    if (created.assignee) {
      //Check if User is already having Task list in User document
      const targetAssignee = await User.findById(newTaskInput.assignee);
      //If yes => push
      if (targetAssignee.tasks) {
        targetAssignee.tasks = targetAssignee.tasks.push(created._id);
      } else {
        //If not => create new
        targetAssignee.tasks = [created._id];
      }

      await User.findByIdAndUpdate(
        targetAssignee._id.toString(),
        targetAssignee
      );
      // await targetAssignee.save();
    }
    //send response
    sendResponse(
      res,
      200,
      true,
      { data: created },
      null,
      "Create New Task Successfully"
    );
  } catch (err) {
    next(err);
  }
};

//Get all tasks
// filter - userId, search, status,
taskController.getTasks = async (req, res, next) => {
  //get input validation
  const allowedFilter = ["search", "status", "sort", "assigneeId"];
  const allowSortFilter = [
    "createdAt:asc",
    "createdAt:desc",
    "updatedAt:asc",
    "updatedAt:desc",
  ];
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    //mongoose filter
    const filter = {};

    //allow search, status, createdAtStart, createdAtEnd, updatedAtStart, updatedAtEnd, assigneeId, page and limit query only
    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        throw new AppError(
          400,
          `Query key ${key} is not allowed`,
          "Get Tasks Error"
        );
      }
      if (!filterQuery[key]) delete filterQuery[key];
      if (allowedFilter.includes(key)) {
        if (key === "search") {
          filter.$or = [
            { name: { $regex: filterQuery[key], $options: "i" } },
            { description: { $regex: filterQuery[key], $options: "i" } },
          ];
        } else if (key === "assigneeId") {
          filter.assignee = new mongoose.Types.ObjectId(filterQuery[key]);
        } else if (key === "status") {
          filter[key] = filterQuery[key];
        }
      }
    });

    //processing logic
    //Number of items skip for selection
    let offset = limit * (page - 1);

    let listOfFound;
    let total;

    //process sort filter
    let { sort } = req.query;

    if (!sort) {
      //mongoose query
      listOfFound = await Task.find(filter);
      total = listOfFound.length;
    } else if (sort) {
      sort = sort.split(",");
      let sortObj = {};

      sort.forEach((sortQuery) => {
        //check if sort query is accepted
        if (!allowSortFilter.includes(sortQuery))
          throw new AppError(
            400,
            `Sort Filter ${sortQuery} is not Allowed!`,
            "Get Tasks Error"
          );

        //convert sort array to sort object
        const sortKey = sortQuery.split(":")[0];
        const sortValue =
          sortQuery.split(":")[1] === "asc"
            ? 1
            : sortQuery.split(":")[1] === "desc"
            ? -1
            : 0;

        if (sortObj[sortKey]) {
          throw new AppError(
            400,
            `Duplicated Sort Filter Key ${sortKey}`,
            "Get Tasks Error"
          );
        } else if (!sortObj[sortKey]) {
          sortObj[sortKey] = sortValue;
        }
      });

      console.log(sortObj);

      //mongoose query
      listOfFound = await Task.find(filter).sort(sortObj);
      total = listOfFound.length;
    }

    //select number of result by offset
    listOfFound = listOfFound.slice(offset, offset + limit);

    //send response
    sendResponse(
      res,
      200,
      true,
      {
        tasks: listOfFound,
        page: page,
        total: total,
      },
      null,
      "Get Task List Successfully!"
    );
  } catch (err) {
    next(err);
  }
};

//Get a task by Id
taskController.getTaskById = async (req, res, next) => {
  //validate params
  const result = validationResult(req);
  try {
    if (!result.isEmpty()) {
      const errors = result.array();
      errors.map((error) => {
        const errorMessage = `${error.msg}. Error type: ${error.type}. Location: ${error.location}. Path: ${error.path}. Value: ${error.value}`;
        throw new AppError(400, errorMessage, "Get Task By Id Error");
      });
    }

    //check if task exists in DB
    const { taskId } = req.params;
    const targetTask = await Task.findById(taskId);

    if (!targetTask) {
      throw new AppError(404, "Task Not Found", "Get Task By Id Error");
    }

    //send response
    sendResponse(
      res,
      200,
      true,
      { data: targetTask },
      null,
      "Get Task By Id Successfully!"
    );
  } catch (err) {
    next(err);
  }
};

//Edit a task
taskController.updateTask = async (req, res, next) => {
  const allowData = ["name", "description", "status", "assignee"];
  //validate params
  const result = validationResult(req);
  try {
    if (!result.isEmpty()) {
      const errors = result.array();
      errors.map((error) => {
        const errorMessage = `${error.msg}. Error type: ${error.type}. Location: ${error.location}. Path: ${error.path}. Value: ${error.value}`;
        throw new AppError(400, errorMessage, "Update Task Error");
      });
    }

    //check if task exists in DB
    const { taskId } = req.params;
    const targetTask = await Task.findById(taskId);
    if (!targetTask) {
      throw new AppError(404, "Task Not Found", "Update Task Error");
    }

    //find update keys that are not allowed
    const taskUpdateInput = req.body;
    const taskUpdateInputKeys = Object.keys(taskUpdateInput);

    taskUpdateInputKeys.map((key) => {
      if (!allowData.includes(key)) {
        throw new AppError(
          400,
          `Update key ${key} is not allowed`,
          "Update Task Error"
        );
      }
    });

    //if there is a new assignee, validate assignee id
    if (taskUpdateInput.assignee) {
      const targetAssignee = await User.findById(taskUpdateInput.assignee);
      if (!targetAssignee) {
        throw new AppError(404, "Assignee Not Found", "Update Task Error");
      }
    }

    //update status rule - previous status = 'done' => only available option is 'archive'
    const previousStatus = targetTask.status;
    if (previousStatus === "done") {
      if (!["done", "archive"].includes(taskUpdateInput.status))
        throw new AppError(
          400,
          `Status ${taskUpdateInput.status} is not allowed! Only "archive" option is allowed when task status was done!`,
          "Update Task Error"
        );
    }

    //Updated task
    let updatedTask =
      !taskUpdateInput.assignee && !targetTask.assignee
        ? {
            name: taskUpdateInput.name || targetTask.name,
            description: taskUpdateInput.description || targetTask.description,
            status: taskUpdateInput.status || targetTask.status,
          }
        : {
            name: taskUpdateInput.name || targetTask.name,
            description: taskUpdateInput.description || targetTask.description,
            status: taskUpdateInput.status || targetTask.status,
            assignee: taskUpdateInput.assignee || targetTask.assignee,
          };

    //mongoose query
    // const updated = await Task.findByIdAndUpdate(taskId, updatedTask, {
    //   new: true,
    // });

    let updated;
    //update task status in User collection
    if (updatedTask.assignee) {
      //check targetAsignee available
      const targetAssignee = await User.findById(updatedTask.assignee);
      if (targetAssignee) {
        //check if user already has tasks in User document
        //if yes, check no duplicate => add
        if (targetAssignee.tasks) {
          if (!targetAssignee.tasks.includes(updated._id)) {
            targetAssignee.tasks.push(updated._id);
          }
        } else {
          //if not, create
          targetAssignee.tasks = [updated._id];
        }

        //mongoose query
        updated = await Task.findByIdAndUpdate(taskId, updatedTask, {
          new: true,
        });
        targetAssignee.save();
      } else {
        updated = await Task.findByIdAndUpdate(
          taskId,
          { $unset: { assignee: 1 } },
          { new: true }
        );
      }
    }

    //send response
    sendResponse(
      res,
      200,
      true,
      { data: updated },
      null,
      "Update Task Successfully"
    );
  } catch (err) {
    next(err);
  }
};

//Soft Delete a task
taskController.softDeleteTask = async (req, res, next) => {
  //validate params
  const result = validationResult(req);
  try {
    if (!result.isEmpty()) {
      const errors = result.array();
      errors.map((error) => {
        const errorMessage = `${error.msg}. Error type: ${error.type}. Location: ${error.location}. Path: ${error.path}. Value: ${error.value}`;
        throw new AppError(400, errorMessage, "Soft Delete Task Error");
      });
    }

    //Check if taskId exists in DB
    const { taskId } = req.params;
    const targetTask = await Task.findById(taskId);
    if (!targetTask) {
      throw new AppError(404, "Task Not Found", "Soft Delete Task Error");
    }

    //if there is assignee, delete task in user collection
    if (targetTask.assignee) {
      const targetAssignee = await User.findById(targetTask.assignee);
      if (targetAssignee) {
        if (targetAssignee.tasks) {
          if (targetAssignee.tasks.includes(targetTask._id)) {
            const index = targetAssignee.tasks.indexOf(targetTask._id);
            targetAssignee.tasks.splice(index, 1);
          }
        }

        if (targetAssignee.tasks.length < 1) {
          await User.findByIdAndUpdate(targetTask.assignee, {
            $unset: { tasks: 1 },
          });
        } else {
          targetAssignee.save();
        }
      }
    }

    //mongoose query
    const updated = await Task.findByIdAndUpdate(
      taskId,
      { isDeleted: true },
      { new: true }
    );

    //send response
    sendResponse(res, 200, true, { data: updated }, null),
      "Soft Delete Task Successfully!";
  } catch (err) {
    next(err);
  }
};

//Hard Delete a task
taskController.hardDeleteTask = async (req, res, next) => {
  //validate params
  const result = validationResult(req);
  try {
    if (!result.isEmpty()) {
      const errors = result.array();
      errors.map((error) => {
        const errorMessage = `${error.msg}. Error type: ${error.type}. Location: ${error.location}. Path: ${error.path}. Value: ${error.value}`;
        throw new AppError(400, errorMessage, "Hard Delete Task Error");
      });
    }

    //Check if taskId exists in DB
    const { taskId } = req.params;
    const targetTask = await Task.findById(taskId);
    if (!targetTask) {
      throw new AppError(404, "Task Not Found", "Hard Delete Task Error");
    }

    //if there is assignee, delete task in user collection
    if (targetTask.assignee) {
      const targetAssignee = await User.findById(targetTask.assignee);
      if (targetAssignee) {
        if (targetAssignee.tasks) {
          if (targetAssignee.tasks.includes(targetTask._id)) {
            const index = targetAssignee.tasks.indexOf(targetTask._id);
            targetAssignee.tasks.splice(index, 1);
          }
        }

        if (targetAssignee.tasks.length < 1) {
          await User.findByIdAndUpdate(targetTask.assignee, {
            $unset: { tasks: 1 },
          });
        } else {
          targetAssignee.save();
        }
      }
    }

    //mongoose query
    const updated = await Task.findByIdAndDelete(taskId, { new: true });

    //send response
    sendResponse(res, 200, true, { data: updated }, null),
      "Hard Delete Task Successfully!";
  } catch (err) {
    next(err);
  }
};

//Delete Assignee of a Task
taskController.deleteTaskAssignee = async (req, res, next) => {
  //validate task Id
  const result = validationResult(req);
  try {
    if (!result.isEmpty()) {
      const errors = result.array();
      errors.map((error) => {
        const errorMessage = `${error.message}. Error type: ${error.type}. Location: ${error.location}. Path: ${error.path}. Value: ${error.value}`;
        throw new AppError(400, errorMessage, "Delete Task Assignee Error");
      });
    }

    //Check if taskId exists in DB
    const { taskId } = req.params;

    const targetTask = await Task.findById(taskId);
    if (!targetTask) {
      throw new AppError(404, "Task Not Found", "Delete Task Assignee Error");
    }

    //if there is assignee, delete task in user collection
    if (targetTask.assignee) {
      const targetAssignee = await User.findById(targetTask.assignee);
      if (targetAssignee) {
        if (targetAssignee.tasks) {
          if (targetAssignee.tasks.includes(targetTask._id)) {
            const index = targetAssignee.tasks.indexOf(targetTask._id);
            targetAssignee.tasks.splice(index, 1);
          }
        }

        if (targetAssignee.tasks.length < 1) {
          await User.findByIdAndUpdate(targetTask.assignee, {
            $unset: { tasks: 1 },
          });
        } else {
          targetAssignee.save();
        }
      }
    }

    //mongoose query
    const updated = await Task.findByIdAndUpdate(
      taskId,
      {
        $unset: { assignee: 1 },
      },
      { new: true }
    );

    //send response
    sendResponse(
      res,
      200,
      true,
      { data: updated },
      null,
      "Delete Task Assignee Successfully!"
    );
  } catch (err) {
    next(err);
  }
};

module.exports = taskController;
