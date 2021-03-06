/////////////////////////////////////////////////////////////
// Requires and Global Vars
/////////////////////////////////////////////////////////////
const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");
const add = require("./lib/add.js");
const del = require("./lib/delete");
const update = require("./lib/update");
const view = require("./lib/view");

//local versions of DB tables
let department = [];
let departmentView = [];
let role = [];
let roleView = [];
let employee = [];
let employeeView = [];

/////////////////////////////////////////////////////////////
// CREATE CONNECTION TO MySQL DATABASE
/////////////////////////////////////////////////////////////
const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "employee_db",
    multipleStatements: true // allows for multiple SELECT statements in 1 query
});


/////////////////////////////////////////////////////////////
// CONNECT TO MySQL DATABASE
/////////////////////////////////////////////////////////////
connection.connect(async function (err) {
    if (err) throw err; // if there's an error connecting to the database, throw error here
    //ascii art splash - with escaped escape characters!
    console.log(`
    $$$$$$$$\\                         $$\\                                          
    $$  _____|                        $$ |                                         
    $$ |      $$$$$$\\$$$$\\   $$$$$$\\  $$ | $$$$$$\\  $$\\   $$\\  $$$$$$\\   $$$$$$\\   
    $$$$$\\    $$  _$$  _$$\\ $$  __$$\\ $$ |$$  __$$\\ $$ |  $$ |$$  __$$\\ $$  __$$\\  
    $$  __|   $$ / $$ / $$ |$$ /  $$ |$$ |$$ /  $$ |$$ |  $$ |$$$$$$$$ |$$$$$$$$ | 
    $$ |      $$ | $$ | $$ |$$ |  $$ |$$ |$$ |  $$ |$$ |  $$ |$$   ____|$$   ____| 
    $$$$$$$$\\ $$ | $$ | $$ |$$$$$$$  |$$ |\\$$$$$$  |\\$$$$$$$ |\\$$$$$$$\\ \\$$$$$$$\\  
    \\________|\\__| \\__| \\__|$$  ____/ \\__| \\______/  \\____$$ | \\_______| \\_______| 
                            $$ |                    $$\\   $$ |                     
                            $$ |                    \\$$$$$$  |                     
                            \\__|                     \\______/                      
    $$$$$$$\\             $$\\               $$\\                                     
    $$  __$$\\            $$ |              $$ |                                    
    $$ |  $$ | $$$$$$\\ $$$$$$\\    $$$$$$\\  $$$$$$$\\   $$$$$$\\   $$$$$$$\\  $$$$$$\\  
    $$ |  $$ | \\____$$\\\\_$$  _|   \\____$$\\ $$  __$$\\  \\____$$\\ $$  _____|$$  __$$\\ 
    $$ |  $$ | $$$$$$$ | $$ |     $$$$$$$ |$$ |  $$ | $$$$$$$ |\\$$$$$$\\  $$$$$$$$ |
    $$ |  $$ |$$  __$$ | $$ |$$\\ $$  __$$ |$$ |  $$ |$$  __$$ | \\____$$\\ $$   ____|
    $$$$$$$  |\\$$$$$$$ | \\$$$$  |\\$$$$$$$ |$$$$$$$  |\\$$$$$$$ |$$$$$$$  |\\$$$$$$$\\ 
    \\_______/  \\_______|  \\____/  \\_______|\\_______/  \\_______|\\_______/  \\_______|                                                           
    `);
    // grab tables (and pretty, joined View-able versions of tables) and store them locally
    // these local tables will be used when a user requests to view a table, instead of querying the database
    // these local tables will be updated when the user updates or inserts in the database
    await updateLocalDepartment();
    await updateLocalRole();
    await updateLocalEmployee();
    // call promptUser() to get the user's input, and call the appropriate function
    promptUser();
});

/////////////////////////////////////////////////////////////
// Update Local Stored Datatables
/////////////////////////////////////////////////////////////

function updateLocalDepartment() {
    // this query returns an array of two items: 1. array of department objects, 2. array of department objects with column heading "department" instead of "name"
    let queryString =
        `
            #0 - department
                SELECT * FROM department;
            #1 - department views - readable table
                SELECT department.id, department.name AS department 
                FROM department;
            `;
    return new Promise(function (resolve, reject) {
        connection.query(queryString,
            function (err, res) {
                if (err) { // if issue, inform user and throw error
                    console.log("Check that your MySQL server is running, and has the employee_db schema");
                    reject();
                    throw err;
                }
                department = res[0]; // res is an array of objects returned from the query: [0] is department, [1] is departmentView, 
                departmentView = res[1];
                resolve();
            });
    });

}

function updateLocalRole() {
    // this query returns an array of two items: 1. array of role objects, 2. array of role objects with department table foreign key info
    let queryString =
        `
        #2 - roles
            SELECT * FROM role; 
        #3 - roles view
            SELECT role.id, role.title, role.salary, department.name AS department 
            FROM role
            LEFT OUTER JOIN department 
            #LEFT OUTER JOINS will show all rows in the left (employee) table, even if there isn't a match to the joined table (i.e. employee has a null field)
            ON role.department_id = department.id;
        `;
    return new Promise(function (resolve, reject) {
        connection.query(queryString,
            function (err, res) {
                if (err) { // if issue, inform user and throw error
                    console.log("Check that your MySQL server is running, and has the employee_db schema");
                    reject();
                    throw err;
                }
                // update global table variables
                role = res[0]; // res is an array of objects returned from the query: [0] is role, [1] is roleView, 
                roleView = res[1];
                resolve();
            });
    });

}

function updateLocalEmployee() {
    // this query returns an array of two items: 1. array of employee objects, 2. array of employee objects with department, role, and employee (manager) foreign key info
    let queryString =
        `
        #4  - employee
            SELECT * FROM employee;
        #5 - employee view - 3 joins to department, role, and employee tables
            SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(m.first_Name, " ", m.last_Name) AS manager
            FROM employee
            LEFT OUTER JOIN role #LEFT OUTER JOINS will show all rows in the left (employee) table, even if there isn't a match to the joined table (i.e. employee has a null field)
            ON employee.role_id = role.id
            LEFT OUTER JOIN department
            ON role.department_id = department.id
            LEFT OUTER JOIN employee m #This uses a table alias 'm' to refer to the employee table. Tables cannot appear twice in a query under the same name.
            ON employee.manager_id = m.id
        `;
    return new Promise(function (resolve, reject) {
        connection.query(queryString,
            function (err, res) {
                if (err) { // if issue, inform user and throw error
                    console.log("Check that your MySQL server is running, and has the employee_db schema");
                    reject();
                    throw err;
                }
                // update global table variables
                employee = res[0]; // res is an array of objects returned from the query: [0] is employee, [1] is employeeView, 
                employeeView = res[1];
                resolve();
            });
    });

}

/////////////////////////////////////////////////////////////
// Prompt User for Input
/////////////////////////////////////////////////////////////
async function promptUser() { // prompts the user for an action: add, delete, update, view, exit 
    while (true) { // loop until user exits 
        console.log(); //new line
        const response = await inquirer.prompt({
            name: "action",
            type: "list",
            message: "Please select an action:",
            choices: [
                new inquirer.Separator("----Add----"),
                "Add Department",
                "Add Role",
                "Add Employee",
                new inquirer.Separator("---Delete--"),
                "Delete Department",
                "Delete Role",
                "Delete Employee",
                new inquirer.Separator("---Update--"),
                "Update Employee Role",
                "Update Employee Manager",
                new inquirer.Separator("----View---"),
                "View Departments",
                "View Roles",
                "View Employees",
                "View Employees by manager",
                "View Department Salary Totals",
                new inquirer.Separator("----EXIT---"),
                "Exit"
            ]
        });
        let result; // instantiate result, true result means function completed
        switch (response.action) {// determine user action, call appropriate function
            //ADD
            case "Add Department":
                result = await add.addDepartment(connection);
                if (result) {
                    await updateLocalDepartment();
                }
                break;
            case "Add Role":
                result = await add.addRole(connection, department);
                if (result) {
                    await updateLocalRole();
                }
                break;
            case "Add Employee":
                result = await add.addEmployee(connection, role, employee);
                if (result) {
                    await updateLocalEmployee();
                }
                break;

            //DELETE
            case "Delete Department":
                result = await del.deleteDepartment(connection, department);
                if (result) { // if department deleted
                    await updateLocalDepartment();
                }
                break;
            case "Delete Role":
                result = await del.deleteRole(connection, role);
                if (result) {
                    await updateLocalRole();
                    await updateLocalEmployee();
                }
                break;
            case "Delete Employee":
                result = await del.deleteEmployee(connection, employee);
                if (result) {
                    await updateLocalEmployee();
                }
                break;

            //UPDATE
            case "Update Employee Role":
                result = await update.updateEmployeeRole(connection, role, employee);
                if (result) {
                    await updateLocalEmployee();
                }
                break;
            case "Update Employee Manager":
                result = await update.updateEmployeeManager(connection, employee);
                if (result) {
                    await updateLocalEmployee();
                }
                break;

            //VIEW
            case "View Departments":
                view.viewDepartments(departmentView);
                break;
            case "View Roles":
                view.viewRoles(roleView);
                break;
            case "View Employees":
                view.viewEmployees(employeeView);
                break;
            case "View Employees by manager":
                result = await view.viewEmployeesByManager(connection);
                break;
            case "View Department Salary Totals":
                result = await view.viewDepartmentsSalaryTotal(connection);
                break;

            //EXIT
            case "Exit":
                connection.end();
                console.log("Goodbye!");
                return;
        }
    }
}

