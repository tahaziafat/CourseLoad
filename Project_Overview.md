# CourseLoad - Project Overview

## Problem statement
Students often manage assignments, quizzes, reports and projects across different courses. When several deadlines fall on the same date, the workload can become difficult to notice until it is too late.

## Proposed solution
CourseLoad is a small academic workload planner. A student enters a task, its course, deadline and estimated effort in hours. The dashboard lists tasks, tracks completion and adds the estimated hours for each deadline date. If the total is above the student's chosen daily limit, the dashboard displays a warning.

## Main features
1. Add a task with course, title, due date and estimated hours.
2. View and filter tasks.
3. Mark tasks as completed.
4. Edit or delete tasks.
5. Group pending task hours by deadline date.
6. Set a daily study-hour limit and show an overload warning.
7. Save tasks in the browser using localStorage.

## Technology
- Front end: HTML for structure, CSS for design and responsive layout, JavaScript for interaction and calculations.
- Alternative implementation: C++ console application.
- Browser storage: localStorage.

## SDLC model
An incremental approach is suitable for this small prototype: build the task entry first, then add the task list, completion controls, workload calculation and visual polish in separate increments.

## Scope and limitations
This is a local prototype for one student on one browser/device. It has no account system, remote database, automatic reminders or cross-device synchronisation. Workload is grouped by deadline date; it does not create a day-by-day study timetable.

## Stakeholders
- Primary: university students.
- Secondary: instructors who may review the prototype and its documentation.

## Requirements
### Functional
- The system shall allow a student to add, view, edit and delete tasks.
- The system shall allow a task to be marked completed.
- The system shall calculate total pending estimated hours for each due date.
- The system shall warn when a due date's total exceeds the selected daily limit.
- The system shall save and reload tasks in the same browser.

### Non-functional
- The interface should be understandable to a beginner user.
- The website should adapt to desktop and mobile screen sizes.
- Common actions should respond immediately.
- The app should not require an account or server for the prototype.

## Assumptions and constraints
- The student enters accurate due dates and hour estimates.
- The user opens the website in a modern browser with JavaScript enabled.
- Data is local to the browser and can be lost if browser storage is cleared.
- The prototype is limited to one user's local data.

## Testing
See `Test_Cases.txt`. Execute each test manually and record the observed result before submission.
