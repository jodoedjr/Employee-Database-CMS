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
const { createPromptModule } = require("inquirer");

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
function promptUser() { // prompts the user for an action: add, delete, update, view, exit 
    inquirer.prompt({
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
    }).then(async function (response) {
        let result; // instantiate result, true result means function completed
        switch (response.action) {// determine user action, call appropriate function
            //ADD
            case "Add Department":
                await add.addDepartment(connection);
                await updateLocalDepartment();
                viewDepartments();
                break;
            case "Add Role":
                await add.addRole(connection, department);
                await updateLocalRole();
                viewRoles();
                break;
            case "Add Employee":
                await add.addEmployee(connection, role, employee);
                await updateLocalEmployee();
                viewEmployees();
                break;

            //DELETE
            case "Delete Department":
                result = await del.deleteDepartment(connection, department);
                if (result) { // if department deleted
                    await updateLocalDepartment();
                    viewDepartments();
                }
                break;
            case "Delete Role":
                result = await del.deleteRole(connection, role);
                if (result) {
                    await updateLocalRole();
                    viewRoles();
                }                
                break;
            case "Delete Employee":
                result = await del.deleteEmployee(connection, employee);
                if (result) {
                    await updateLocalEmployee();
                    viewEmployees();
                }
                break;

            //UPDATE
            case "Update Employee Role":
                updateEmployeeRole();
                break;
            case "Update Employee Manager":
                updateEmployeeManager();
                break;

            //VIEW
            case "View Departments":
                viewDepartments();
                break;
            case "View Roles":
                viewRoles();
                break;
            case "View Employees":
                viewEmployees();
                break;
            case "View Employees by manager":
                viewEmployeesByManager();
                break;
            case "View Department Salary Totals":
                viewDepartmentsSalaryTotal();
                break;

            //EXIT
            case "Exit":
                connection.end();
                console.log("Goodbye!");
                return;
        }
        promptUser();// bad, but only in use for this version
    });
}





/////////////////////////////////////////////////////////////
// UPDATE EMPLOYEE ROLE OR MANAGER
/////////////////////////////////////////////////////////////
function updateEmployeeRole() {
    inquirer.prompt([
        {
            name: "employee",
            type: "list",
            message: "Who's role would you like to change?",
            choices: function () {
                let choiceArray = [];
                for (let i = 0; i < employee.length; i++) {
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
                for (let i = 0; i < role.length; i++) {
                    choiceArray.push(`${role[i].title}`);
                }
                choiceArray.push("Cancel"); // give user option to cancel
                return choiceArray;
            }
        }
    ]).then(function (response) {
        if (response.role === "Cancel") { // cancel process and re-prompt main menu if user decides to cancel
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
                [{ role_id: selectedRole.id }, { id: selectedEmployee.id }], // update employee role id in db
                async function (err, res) {
                    if (err) throw err;
                    console.log(`${response.employee} assigned role: ${response.role}\n`);
                    await updateLocalEmployee(); // update local employee tables
                    promptUser();
                });
        }
    });
}

async function updateEmployeeManager() {
    let employeeList = [];
    for (let i = 0; i < employee.length; i++) {
        employeeList.push(`${employee[i].first_name} ${employee[i].last_name}`);
    }
    const employeePrompt = await inquirer.prompt([
        {
            name: "name",
            type: "list",
            message: "Who's manager would you like to change?",
            choices: function () {
                return [...employeeList, "Cancel"];
            }
        }]);
    if (employeePrompt.name === "Cancel") {
        console.log("Returning to Main Menu");
        promptUser();
        return;
    } else {
        employeeList.splice(employeeList.indexOf(employeePrompt.name), 1); // removes the employee name from the employee list
    }
    const managerPrompt = await inquirer.prompt([
        {
            name: "name",
            type: "list",
            message: "What manager would you like to assign?",
            choices: function () {
                return [...employeeList, "Cancel"];
            }
        }]);
    if (managerPrompt.name === "Cancel") { // cancel process and re-prompt main menu if user decides to cancel
        console.log("Returning to Main Menu");
        promptUser();
        return;
    } else {
        let employeeName = employeePrompt.name.split(" ");
        let selectedEmployee = employee.find(item => (item.first_name === employeeName[0]) && (item.last_name === employeeName[1]));
        let managerName = managerPrompt.name.split(" ");
        let selectedManager = employee.find(item => (item.first_name === managerName[0]) && (item.last_name === managerName[1]));// find the role selected by the user (this is a role object, with ID and title)
        connection.query(
            `UPDATE employee
                        SET ?
                        WHERE ?`,
            [{ manager_id: selectedManager.id }, { id: selectedEmployee.id }], // update employee manger id in db
            async function (err, res) {
                if (err) throw err;
                console.log(`${employeeName} assigned manager: ${managerName}\n`);
                await updateLocalEmployee(); // update local employee tables
                viewEmployees();
            });
    }
}

/////////////////////////////////////////////////////////////
// VIEW DEPARTMENT, ROLE, EMPLOYEE, EMPLOYEE BY MANAGER, OR DEPARTMENT SALARY TOTALS
/////////////////////////////////////////////////////////////
function viewDepartments() {
    console.table(departmentView);
    //promptUser();
}

function viewRoles() {
    console.table(roleView);
    //promptUser();
}

function viewEmployees() {
    console.table(employeeView);
    //promptUser();
}

function viewEmployeesByManager() {
    connection.query(
        `
        SELECT CONCAT(employee.first_name, " ", employee.last_name) AS employee, CONCAT(m.first_name, " ", m.last_name) AS "reports to"
        FROM employee
        LEFT OUTER JOIN employee m #This uses a table alias 'm' to refer to the employee table. Tables cannot appear twice in a query under the same name.
        ON employee.manager_id = m.id
        ORDER BY CONCAT(m.first_Name, " ", m.last_Name)  
        `,
        function (err, res) {
            if (err) throw err;
            console.table(res);
            promptUser();
        }
    )
}

function viewDepartmentsSalaryTotal() {
    connection.query(// this query returns a table of department names and total salaries for those departments
        `
        SELECT department.name AS department, SUM(role.salary) AS "salary total"
        FROM employee
        LEFT OUTER JOIN role
        ON employee.role_id = role.id
        LEFT OUTER JOIN department
        ON role.department_id = department.id
        GROUP BY department.name;
        `, // each employee, join to their role, join their role to their department, group by department names, sum the role salaries
        function (err, res) {
            if (err) throw err;
            console.table(res); // display results
            promptUser();
        }
    );
}

