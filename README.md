# Requirements

## User

[x] Create a new user with user's name. The default role is employee.
[x] Get all users with filters. You can decide yourself which queries you allow in the request based on the User schema
[x] Search for an employee by name
[x] Get all tasks of 1 user (Decide which one is better: by name or by id?)

## Task

[x] Create a task with the required information.
[x] Browse your tasks with filter allowance (name, status, createdAt,…). The following attributes are required to help filtering tasks by status, and help sorting by createdAt, updatedAt

### status x

### createdAt updatedAt

[x] Get a single task by id
[x] Assign a task to a user or unassign them
[x] Update the status of a task - There's a rule for updating task status: when the status is set to done, it can't be changed to other value except archive
[x] Soft delete a task. Remember how you did this in previous assignments?
[x] Research and Apply: In backend development, input validation is an important step. This time, you are required to research on express-validator and apply further API request input control:

Create user request must check body for : existence, including name , name's value is a valid string.
Create task request must check body for : existence, and other requirements per task schema.
All routes that require \_id , must be checked for its existence and whether it is a mongo object id.
