#include <iostream>
#include <fstream>
#include <string>
#include <iomanip>
using namespace std;

struct Task {
    string title, course, date;
    double hours;
    bool completed;
};

Task tasks[100];
int taskCount = 0;

void loadTasks() {
    ifstream file("tasks.txt");
    taskCount = 0;
    while (taskCount < 100 && getline(file, tasks[taskCount].title, '|')) {
        getline(file, tasks[taskCount].course, '|');
        getline(file, tasks[taskCount].date, '|');
        file >> tasks[taskCount].hours;
        file.ignore();
        file >> tasks[taskCount].completed;
        file.ignore();
        taskCount++;
    }
}
void saveTasks() {
    ofstream file("tasks.txt");
    for (int i = 0; i < taskCount; i++) {
        file << tasks[i].title << "|" << tasks[i].course << "|"
             << tasks[i].date << "|" << tasks[i].hours << "\n"
             << tasks[i].completed << "\n";
    }
}
void addTask() {
    if (taskCount == 100) { cout << "Task limit reached.\n"; return; }
    cout << "Task title: "; getline(cin, tasks[taskCount].title);
    cout << "Course: "; getline(cin, tasks[taskCount].course);
    cout << "Due date (YYYY-MM-DD): "; getline(cin, tasks[taskCount].date);
    cout << "Estimated hours: "; cin >> tasks[taskCount].hours; cin.ignore();
    tasks[taskCount].completed = false;
    taskCount++;
    saveTasks();
    cout << "Task saved.\n";
}
void viewTasks() {
    if (taskCount == 0) { cout << "No tasks yet.\n"; return; }
    for (int i = 0; i < taskCount; i++) {
        cout << i + 1 << ". " << tasks[i].title << " [" << tasks[i].course << "] "
             << tasks[i].date << " | " << tasks[i].hours << " hours | "
             << (tasks[i].completed ? "Completed" : "Pending") << "\n";
    }
}
void markCompleted() {
    viewTasks();
    if (taskCount == 0) return;
    int number;
    cout << "Enter task number: "; cin >> number; cin.ignore();
    if (number < 1 || number > taskCount) { cout << "Invalid number.\n"; return; }
    tasks[number - 1].completed = true;
    saveTasks();
    cout << "Task marked completed.\n";
}
void checkWorkload() {
    double limit;
    cout << "Daily study-hour limit: "; cin >> limit; cin.ignore();
    for (int i = 0; i < taskCount; i++) {
        if (tasks[i].completed) continue;
        bool alreadyShown = false;
        for (int j = 0; j < i; j++)
            if (!tasks[j].completed && tasks[j].date == tasks[i].date) alreadyShown = true;
        if (alreadyShown) continue;
        double total = 0;
        for (int j = 0; j < taskCount; j++)
            if (!tasks[j].completed && tasks[j].date == tasks[i].date) total += tasks[j].hours;
        cout << tasks[i].date << ": " << total << " hours";
        if (total > limit) cout << "  ** OVERLOADED **";
        cout << "\n";
    }
}
int main() {
    loadTasks();
    int choice;
    do {
        cout << "\n========== COURSELOAD ==========\n"
             << "1. Add task\n2. View tasks\n3. Check workload\n"
             << "4. Mark task completed\n0. Exit\nChoose: ";
        cin >> choice; cin.ignore();
        if (choice == 1) addTask();
        else if (choice == 2) viewTasks();
        else if (choice == 3) checkWorkload();
        else if (choice == 4) markCompleted();
        else if (choice != 0) cout << "Invalid choice.\n";
    } while (choice != 0);
    saveTasks();
    cout << "Good luck with your studies!\n";
    return 0;
}
