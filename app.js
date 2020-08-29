const mysql = require("mysql");
const inqurier = require("inquirer");
const cTable = require("console.table");
const inquirer = require("inquirer");

const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "employee_db",
    multipleStatements: true // allows for multiple SELECT statements in 1 query
});

connection.connect(function (err) {
    if (err) throw err;
    //connection open - get data and prompt user
    promptUser();
});

function promptUser() {
    inquirer.prompt({
        name: "action",
        type: "list",
        message: "Please select an action:",
        choices: [
            "Add Department",
            "Add Role",
            "Add Employee",
            "View Departments",
            "View Roles",
            "View Employees",
            "Update Employee Role",
            "Exit"
        ]
    }).then(function (response) {
        switch (response.action) {
            case "Add Department":
                addDepartment();
                break;
            case "Add Role":
                addRole();
                break;
            case "Add Employee":
                addEmployee();
                break;
            case "View Departments":
                viewDepartments();
                break;
            case "View Roles":
                viewRoles();
                break;
            case "View Employees":
                viewEmployees();
                break;
            case "Update Employee Role":
                updateEmployeeRole();
                break;
            case "Exit":
                connection.end();
                return;
        }
    });
}

function addDepartment() {// asks user for new department name, then adds department to database, and shows departments
    inquirer.prompt({
        name: "department",
        type: "input",
        message: "Input new department name, or X to cancel:",
    }).then(function (response) {
        if (response.department == "X") { // if user wants to escape, call promptUser()
            promptUser();
        } else {
            connection.query(
                `INSERT INTO department (name)
                VALUES (?);`,
                [response.department], //user reponse
                function (err) {
                    if (err) throw err;
                    viewDepartments(); //viewDepartments will call promptUser() after displaying departments
                });
        }
    });
}

function addRole() {
    connection.query(
        `SELECT * FROM department`,
        function (err, department) {
            if (err) throw err;
            inquirer.prompt([
                {
                    name: "title",
                    type: "input",
                    message: "Input new role title, or X to cancel:",
                },
                {
                    name: "salary",
                    type: "number",
                    message: "Input new role salary, or 0 to cancel:",
                },
                {
                    name: "department",
                    type: "list",
                    message: "Select a department for this role:",
                    choices: function () {
                        let choiceArray = [];
                        for (let i = 0; i < department.length; i++) {
                            choiceArray.push(`${department[i].name}`);
                        }
                        choiceArray.push("Cancel");
                        return choiceArray;
                    }
                }
            ]).then(function (response) {
                if (response.name == "X" || response.salary == 0 || response.department == "Cancel") { // if user wants to escape, call promptUser()
                    console.log("Returning to Main Menu");
                    promptUser();
                } else {
                    let selectedDepartment = department.find(item => item.name === response.department)
                    connection.query(
                        `INSERT INTO role (title, salary, department_id)
                            VALUES (?, ?, ?);`,
                        [response.title, response.salary, selectedDepartment.id], //user reponse
                        function (err) {
                            if (err) throw err;
                            viewRoles(); // view roles will call promptUser() after diplaying roles
                        });
                }
            });
        });
}

function addEmployee() {
    connection.query(
        `SELECT * FROM role;
        SELECT * FROM employee;`,
        function (err, res) {
            let role = res[0];
            let employee = res[1];
            if (err) throw err;
            inquirer.prompt([
                {
                    name: "first",
                    type: "input",
                    message: "Enter Employee First Name",
                },
                {
                    name: "last",
                    type: "input",
                    message: "Enter Employee Last Name",
                },
                {
                    name: "role",
                    type: "list",
                    message: "Select a role for this employee:",
                    choices: function () {
                        let choiceArray = [];
                        for (let i = 0; i < role.length; i++) {
                            choiceArray.push(`${role[i].title}`);
                        }
                        choiceArray.push("Cancel");
                        return choiceArray;
                    }
                },
                {
                    name: "manager",
                    type: "list",
                    message: "Select a manager for this employee (or null/blank):",
                    choices: function () {
                        let choiceArray = ["null"]; // first choice is null
                        for (let i = 0; i < employee.length; i++) {
                            choiceArray.push(`${employee[i].first_name} ${employee[i].last_name}`);
                        }
                        return choiceArray;
                    }
                }
            ]).then(function (response) {
                if (response.first == "X" || response.last == "X" || response.role == "Cancel") { // if user wants to escape, call promptUser()
                    console.log("Returning to Main Menu");
                    promptUser();
                } else {
                    let selectedRole = role.find(item => item.title === response.role)
                    let selectedManagerID = null; // default to no manager for new employee
                    if (response.manager != "null") { // if user response for manager was not "null"
                        selectedManagerID = employee.find(item => { // find employee id of employee who's name matches the user input
                            if (item.name === response.manager) {
                                return item.id; // returns item.id to selectedManagerID
                            }
                        });
                    }
                    connection.query(
                        `INSERT INTO employee (first_name, last_name, role_id, manager_id)
                            VALUES (?, ?, ?, ?);`,
                        [response.first, response.last, selectedRole.id, selectedManagerID], //user reponse
                        function (err) {
                            if (err) throw err;
                            viewEmployees(); //viewDepartments will call promptUser() after displaying departments
                        });
                }
            });
        });
}

function viewDepartments() {
    connection.query(
        `SELECT department.id, department.name AS department
         FROM department`,
        function (err, res) {
            if (err) throw err;
            console.table(res);
            promptUser();
        });
}

function viewRoles() {
    connection.query(
        `SELECT role.id, role.title, role.salary, department.name AS department
        FROM role
        LEFT OUTER JOIN department #LEFT OUTER JOINS will show all rows in the left (employee) table, even if there isn't a match to the joined table (i.e. employee has a null field)
        ON role.department_id = department.id`,
        function (err, res) {
            if (err) throw err;
            console.table(res);
            promptUser();
        });
}

function viewEmployees() {
    connection.query(
        `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(m.first_Name, " ", m.last_Name) AS manager
        FROM employee
        LEFT OUTER JOIN role #LEFT OUTER JOINS will show all rows in the left (employee) table, even if there isn't a match to the joined table (i.e. employee has a null field)
        ON employee.role_id = role.id
        LEFT OUTER JOIN department
        ON role.department_id = department.id
        LEFT OUTER JOIN employee m #This uses a table alias 'm' to refer to the employee table. Tables cannot appear twice in a query under the same name.
        ON employee.manager_id = m.id;`,
        function (err, res) {
            if (err) throw err;
            console.table(res);
            promptUser();
        });
}

function updateEmployeeRole() {
    connection.query(
        `SELECT * FROM role;
        SELECT * FROM employee;`, //grabs everything from the role and employee tables
        function (err, res) {
            let role = res[0];
            let employee = res[1];
            inquirer.prompt([
                {
                    name: "employee",
                    type: "list",
                    message: "Who's role would you like to change?",
                    choices: function () {
                        let choiceArray = [];
                        for (let i = 0 ; i < employee.length; i++){
                            choiceArray.push(`${employee[i].first_name} ${employee[i].last_name}`);
                        }
                        return choiceArray;
                    }
                },
                {
                    name: "role",
                    type: "list",
                    message: "What role would you like to assign?",
                    choices: function () {
                        let choiceArray = [];
                        for (let i = 0; i < role.length; i++){
                            choiceArray.push(`${role[i].title}`);
                        }
                        choiceArray.push("Cancel"); // give user option to cancel
                        return choiceArray;
                    }
                }
            ]).then(function (response) {
                if (response.role === "Cancel"){ // cancel process and re-prompt main menu if user decides to cancel
                    console.log("Returning to Main Menu");
                    promptUser();
                } else {
                    let employeeName = response.employee.split(" ");
                    let selectedEmployee = employee.find(item => (item.first_name === employeeName[0]) && (item.last_name === employeeName[1]));
                    let selectedRole = role.find(item => item.title === response.role)// find the role selected by the user (this is a role object, with ID and title)
                    connection.query(
                        `UPDATE employee
                        SET ?
                        WHERE ?`,
                        [{role_id: selectedRole.id},{id: selectedEmployee.id}],
                        function(err, res){
                            if (err) throw err;
                            console.log(`${response.employee} assigned role: ${response.role}`);
                            viewEmployees();
                    });
                }
            })
        }
    )
}