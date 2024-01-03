const { AppError, sendResponse } = require("../helpers/utils");
const User = require("../models/User.js");
const { validationResult } = require("express-validator");
const userController = {};

//Create a user using Express Validator
userController.createUser = async (req, res, next) => {
  const allowData = ["name"];
  try {
    //validate missing body content - name
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = result.array();
      errors.map((error) => {
        const errorMessage = `${error.msg}. Error type: ${error.type}. Location: ${error.location}. Path: ${error.path}. Value: ${error.value}`;
        throw new AppError(400, errorMessage, "Create User Error");
      });
    }

    // validate unallowed data
    const userInput = req.body;
    const userInputKey = Object.keys(userInput);

    userInputKey.map((key) => {
      if (!allowData.includes(key)) {
        throw new AppError(
          400,
          `Key ${key} is not allowed!`,
          "Create User Error"
        );
      }
    });

    // new User
    const newUser = {
      name: userInput.name,
      role: "Employee", //Default role when created is Employee
    };
    //mongoose query
    const created = await User.create(newUser);

    //send response
    sendResponse(
      res,
      200,
      true,
      { data: created },
      null,
      "Create New User Successfully!"
    );
  } catch (err) {
    next(err);
  }
};

//Get all user
userController.getUsers = async (req, res, next) => {
  //input validation
  const allowedFilter = ["search", "role"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    //mongoose filter
    const filter = {};

    //allow search, role, page and limit query only
    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        throw new AppError(
          400,
          `Query key ${key} is not allowed`,
          "Get Users Error"
        );
      }
      if (!filterQuery[key]) delete filterQuery[key];
      if (allowedFilter.includes(key)) {
        if (key === "search") {
          filter.name = { $regex: filterQuery[key], $options: "i" };
        }

        if (key === "role") {
          let queryResult = filterQuery[key].toLowerCase();
          queryResult =
            queryResult.slice(0, 1).toUpperCase() + queryResult.slice(1);
          filter.role = queryResult;
        }
      }
    });

    //processing logic
    //Number of items skip for selection
    let offset = limit * (page - 1);

    //mongoose query
    let listOfFound = await User.find(filter).populate("tasks");
    const totalPages = Math.ceil(listOfFound.length / limit);
    //select number of result by offset
    listOfFound = listOfFound.slice(offset, offset + limit);

    //send response
    sendResponse(
      res,
      200,
      true,
      {
        users: listOfFound,
        page: page,
        totalPages: totalPages,
      },
      null,
      "Get User List Successfully!"
    );
  } catch (err) {
    next(err);
  }
};

//Update a user
userController.updateUser = async (req, res, next) => {
  // put input validation
  const allowData = ["name", "role"];
  const allowedRoles = ["Employee", "Manager"];
  const { userId: targetUserId } = req.params;
  let userUpdateInput = req.body;
  const userUpdateInputKeys = Object.keys(userUpdateInput);
  const options = { new: true };
  const result = validationResult(req);

  try {
    //validate missing and mongoId userId

    if (!result.isEmpty()) {
      const errors = result.array();
      console.log(errors);
      errors.map((error) => {
        const errorMessage = `${error.msg}. Error type: ${error.type}. Location: ${error.location}. Path: ${error.path}. Value: ${error.value}`;
        throw new AppError(400, errorMessage, "Edit User Error");
      });
    }

    //check if user exists in DB
    const selectedUser = await User.findById(targetUserId);

    if (!selectedUser)
      throw new AppError(404, "User Not Found", "Update User Error");

    // find update keys that are not allowed
    userUpdateInputKeys.map((key) => {
      if (!allowData.includes(key))
        throw new AppError(
          400,
          `Update key ${key} is not allowed`,
          "Update User Error"
        );
    });

    //working with role updates
    if (userUpdateInput.role) {
      //reformat to capitalize 1st letter
      let roleResult = userUpdateInput.role.toLowerCase();
      roleResult = roleResult.slice(0, 1).toUpperCase() + roleResult.slice(1);

      //Check if role input is allowed
      if (!allowedRoles.includes(roleResult))
        throw new AppError(
          400,
          `Role input ${roleResult} is not allowed`,
          "Update User Error"
        );

      //update role result to userUpdateInput
      userUpdateInput.role = roleResult;
    }

    //mongoose query
    const updated = await User.findByIdAndUpdate(
      targetUserId,
      userUpdateInput,
      options
    );

    //send response
    sendResponse(
      res,
      200,
      true,
      { data: updated },
      null,
      "Update User Successfully!"
    );
  } catch (err) {
    next(err);
  }
};

//Delete a user
userController.deleteUser = async (req, res, next) => {
  const { userId: targetUserId } = req.params;

  const options = { new: true };
  const result = validationResult(req);

  try {
    //validate missing and mongoId userId

    if (!result.isEmpty()) {
      const errors = result.array();
      console.log(errors);
      errors.map((error) => {
        const errorMessage = `${error.msg}. Error type: ${error.type}. Location: ${error.location}. Path: ${error.path}. Value: ${error.value}`;
        throw new AppError(400, errorMessage, "Delete User Error");
      });
    }

    const selectedUser = await User.findById(targetUserId);
    if (!selectedUser)
      throw new AppError(404, "User Not Found", "Delete User Error");

    // mongoose query
    const updated = await User.findByIdAndDelete(targetUserId, options);

    //send response
    sendResponse(
      res,
      200,
      true,
      { data: updated },
      null,
      "Delete User Successfully!"
    );
  } catch (err) {
    next(err);
  }
};

module.exports = userController;
