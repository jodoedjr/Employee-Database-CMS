/////////////////////////////////////////////////////////////
// Requires and Global Vars
/////////////////////////////////////////////////////////////
const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");

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
    }).then(function (response) {
        switch (response.action) {// determine user action, call appropriate function
            //ADD
            case "Add Department":
                addDepartment();
                break;
            case "Add Role":
                addRole();
                break;
            case "Add Employee":
                addEmployee();
                break;

            //DELETE
            case "Delete Department":
                deleteDepartment();
                break;
            case "Delete Role":
                deleteRole();
                break;
            case "Delete Employee":
                deleteEmployee();
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
    });
}

/////////////////////////////////////////////////////////////
// ADD DEPARTMENT, ROLE, OR EMPLOYEE
/////////////////////////////////////////////////////////////
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
                [response.department], //user response
                async function (err) { // async anonymous function to await updateLocalDepartment() promise
                    if (err) throw err;
                    await updateLocalDepartment(); // update the local department tables
                    viewDepartments(); //viewDepartments will call promptUser() after displaying departments
                });
        }
    });
}

function addRole() {
    inquirer.prompt([ // prompt user for role title, role salary, and to select an existing department
        {
            name: "title",
            type: "input",
            message: "Input new role title, or X to cancel:",
        },
        {
            name: "salary",
            type: "input",
            message: "Input new role salary, or 0 to cancel:",
            validate: async function (input) {
                if (isNaN(input)){//typeof input !== "number") {
                    return "Please enter a number";
                }
                return true;
            },
        },
        {
            name: "department",
            type: "list",
            message: "Select a department for this role:",
            choices: function () { // creates a array of department names for users to choose from
                let choiceArray = [];
                for (let i = 0; i < department.length; i++) {
                    choiceArray.push(`${department[i].name}`);
                }
                choiceArray.push("Cancel");
                return choiceArray;
            }
        }
    ]).then(function (response) { // response is user response
        if (response.name == "X" || response.salary == 0 || response.department == "Cancel") { // if user wants to escape, call promptUser()
            console.log("Returning to Main Menu");
            promptUser();
        } else {
            let selectedDepartment = department.find(item => item.name === response.department) // find where user response === the name of a department
            connection.query( // insert new role in role table
                `INSERT INTO role (title, salary, department_id)
                            VALUES (?, ?, ?);`,
                [response.title, response.salary, selectedDepartment.id], //user response, use the id of the selectedDepartment as the foreign key in the role table
                async function (err) { // async anonymous function to await updateLocalRole() promise
                    if (err) throw err;
                    await updateLocalRole(); // update the local role table from the database
                    viewRoles(); // view roles will call promptUser() after displaying roles
                });
        }
    });
}

function addEmployee() {
    inquirer.prompt([ // prompt for new employee first name, last name, role from existing roles, manager from existing employees
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
            let selectedRole = role.find(item => item.title === response.role) // role object where user role object title === user response.role
            let selectedManagerID = null; // default to no manager for new employee
            if (response.manager != "null") { // if user response for manager was not "null"
                let managerName = response.manager.split(" "); // split response manager name into "first_name" and "last_name"
                selectedManager = employee.find(item => { // find employee id of employee who's name matches the user input
                    if ((item.first_name === managerName[0]) && (item.last_name === managerName[1])) {
                        console.log(`${managerName} = ${item.first_name} + ${item.last_name}`);
                        return true;
                    }
                });
            }
            connection.query(
                `INSERT INTO employee (first_name, last_name, role_id, manager_id)
                            VALUES (?, ?, ?, ?);`,
                [response.first.trim(), response.last.trim(), selectedRole.id, selectedManager.id],//selectedManagerID], //user response
                async function (err) { // async anonymous function to await updating local tables                  
                    if (err) throw err;
                    await updateLocalEmployee(); // updateLocalEmployee() will update local employee tables
                    viewEmployees(); //viewDepartments will call promptUser() after displaying departments
                });
        }
    });
}

/////////////////////////////////////////////////////////////
// DELETE DEPARTMENT, ROLE, OR EMPLOYEE
/////////////////////////////////////////////////////////////
async function deleteDepartment() {
    // prompt for department name to delete
    const departmentNameResponse = await inquirer.prompt([
        {
            name: "name",
            type: "list",
            message: "Which department would you like to delete?",
            choices: function () {
                let choiceArray = [];
                for (let i = 0; i < department.length; i++) {
                    choiceArray.push(department[i].name);
                }
                return choiceArray;
            }
        }
    ]);
    // check if department has any roles assigned
    const selectedDepartment = department.find(item => item.name === departmentNameResponse.name);
    connection.query( // find any roles that belong to the selected department
        `
        SELECT department.name AS department, role.title as role
        FROM role
        INNER JOIN department
        ON department.id = role.department_id AND ?;
        `,
        [{ department_id: selectedDepartment.id }],
        async function (err, res) {
            if (err) throw err;
            if (res.length > 0) { // if the department has roles assigned to it, inform the user and exit delete function
                // if department has roles, prompt user with info, and inform them to delete roles first
                console.table(res);
                console.log(`!!!! Please delete these roles before deleting ${selectedDepartment.name} !!!!`);
                promptUser(); // prompt user for next action
            } else { // department has 0 roles assigned to it, and is ok to delete
                // if department has no roles, delete department
                const confirmation = await inquirer.prompt([
                    {
                        name: "confirm",
                        type: "confirm",
                        message: `${selectedDepartment.name} has 0 roles assigned to it. Would you like to continue?`
                    }
                ]);
                if (confirmation.confirm) {
                    console.log(`Deleting ${selectedDepartment.name} department`);
                    connection.query(
                        `
                    DELETE 
                    FROM department
                    WHERE ?
                    `,
                        [{ id: selectedDepartment.id }],
                        async function (err, res) {
                            if (err) throw err;
                            console.log(`${res.affectedRows} rows affected`);
                            await updateLocalDepartment();
                        }
                    );
                } else {
                    console.log("Exiting Delete Department");
                    promptUser();// prompt user for next action
                }// confirmation
            }// # of department roles check
        }
    );
}

async function deleteRole() {
    //prompt for role to delete
    const roleNameResponse = await inquirer.prompt([
        {
            name: "name",
            type: "list",
            message: "Which role would you like to delete?",
            choices: function () {
                let choiceArray = [];
                for (let i = 0; i < role.length; i++) {
                    choiceArray.push(role[i].title);
                }
                return choiceArray;
            }
        }
    ]);

    let selectedRole = role.find(item => item.title === roleNameResponse.name);
    connection.query(// finds employees with the role that will be deleted
        `
        SELECT CONCAT(employee.first_name, " ", employee.last_name) AS employee, role.title AS role
        FROM role
        INNER JOIN employee
        ON employee.role_id = role.id AND role.id = ? ;
        `,
        [selectedRole.id], // select only the table entries with the role.id matching the user-selected role title
        async function (err, res) {
            if (err) throw err;
            let confirmationMessage = ``;
            if (res.length == 0) {// zero employees effected by deleting this role
                confirmationMessage = `Deleting this role will affect 0 employees.\nDo you want to continue deleting ${roleNameResponse.name}?`;
            } else {
                console.table(res); // log query results to user terminal - empoyees who will be affected by deleting this role
                confirmationMessage = `The roles of the employees above will be set to null.\nDo you want to continue deleting the ${roleNameResponse.name}?`;
            }
            const confirmation = await inquirer.prompt([
                {
                    name: "confirm",
                    type: "confirm",
                    message: confirmationMessage
                }
            ])
            if (confirmation.confirm) { // if user confirms deletion
                console.log(`Deleting ${roleNameResponse.name}`);
                connection.query(
                    `
                    DELETE
                    FROM role
                    WHERE ?
                    `,
                    [{ id: selectedRole.id }], // delete the role with this id
                    async function (err, res) {
                        if (err) throw err;
                        console.log(`${res.affectedRows} rows affected`);
                        await updateLocalRole(); // update local tables
                        await updateLocalEmployee(); // update local tables
                    }
                )
            } else {
                console.log("Canceling Role Delete");
                promptUser();
            }
        }
    )
}

async function deleteEmployee() {
    //prompt to employee to delete
    const employeeNameResponse = await inquirer.prompt([
        {
            name: "name",
            type: "list",
            message: "Which employee would you like to delete?",
            choices: function () {
                let choiceArray = [];
                for (let i = 0; i < employee.length; i++) {
                    choiceArray.push(`${employee[i].first_name} ${employee[i].last_name}`);
                }
                return choiceArray;
            }
        }
    ]);
    //prompt for confirmation
    const confirmation = await inquirer.prompt([
        {
            name: "confirm",
            type: "confirm",
            message: `Are you sure you want to delete ${employeeNameResponse.name}?`
        }
    ]);
    if (confirmation.confirm === true) {
        let employeeName = employeeNameResponse.name.split(" "); // split into first and last names
        let selectedEmployee = employee.find(item => item.first_name === employeeName[0] && item.last_name === employeeName[1]);
        connection.query( // query deletes selected employee by id
            `
            DELETE 
            FROM employee
            WHERE ?;
            `,
            [{ id: selectedEmployee.id }],
            async function (err, res) { // async to await local table update
                if (err) throw err;
                console.log(`${res.affectedRows} rows affected`);
                await updateLocalEmployee(); // update local tables
                promptUser(); // prompt user for next input
            }
        )
    } else {
        console.log("Canceling Employee Delete");
        promptUser();
    }
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
    promptUser();
}

function viewRoles() {
    console.table(roleView);
    promptUser();
}

function viewEmployees() {
    console.table(employeeView);
    promptUser();
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

