# CourseLoad - Complete Web + C++ Project

## What is included
- `docs/`: the redesigned responsive HTML, CSS and JavaScript website.
- `cpp_version/CourseLoad.cpp` : the original C++ console version, kept as an alternative implementation.
- `diagrams/` : editable Mermaid diagram source files.
- `Project_Overview.md` : project explanation, scope and design notes.
- `Test_Cases.txt` : manual test checklist. Record the actual result after running each test.

## Run the website
1. Extract the ZIP folder.
2. Open the `docs` folder.
3. Double-click `index.html` to open it in Chrome, Edge or Firefox.
4. Click **Add a task**, enter a title, course, due date and estimated hours.
5. Try checking a task as complete, editing/deleting it, changing the daily hour limit and testing an overloaded date.

No installation, server, database or internet connection is required for the core functions. The Google font may fall back to system fonts if offline.

## Important: how the website stores data
The website saves tasks in the browser's `localStorage`. This means data stays in that browser on that device. It is not a cloud account or shared database. Clearing browser data can remove saved tasks. Use the C++ program separately if you want to demonstrate the console implementation.

## Run the C++ version
Open `cpp_version/CourseLoad.cpp` in Visual Studio as a C++ Console App, or compile it with a C++17 compiler. It is a separate standalone implementation; the browser website does not call the C++ program.

## Project limitations
- The date field checks browser date validity, but the project does not send reminders or sync across devices.
- Workload is grouped by task deadline date, not by a detailed study timetable.
- Estimated hours are entered by the student.
- The prototype has no login, cloud backup, or database.