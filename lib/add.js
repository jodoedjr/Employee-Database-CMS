const inquirer = require("inquirer");
/////////////////////////////////////////////////////////////
// ADD DEPARTMENT, ROLE, OR EMPLOYEE
/////////////////////////////////////////////////////////////
function addDepartment(connection) {// asks user for new department name, then adds department to database, and shows departments
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
                    console.log(`${response.department} department added!`)
                    //await updateLocalDepartment(); // update the local department tables
                    //viewDepartments(); //viewDepartments will call promptUser() after displaying departments
                });
        }
    });
}

function addRole(connection) {
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
            validate: function (input) {
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
            return; //promptUser();
        } else {
            let selectedDepartment = department.find(item => item.name === response.department) // find where user response === the name of a department
            connection.query( // insert new role in role table
                `INSERT INTO role (title, salary, department_id)
                            VALUES (?, ?, ?);`,
                [response.title, response.salary, selectedDepartment.id], //user response, use the id of the selectedDepartment as the foreign key in the role table
                function (err) { // async anonymous function to await updateLocalRole() promise
                    if (err) throw err;
                    console.log(`${response.title} role added!`);
                    return;
                    //await updateLocalRole(); // update the local role table from the database
                    //viewRoles(); // view roles will call promptUser() after displaying roles
                });
        }
    });
}

function addEmployee(connection) {
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




module.exports ={
    addDepartment,
    addRole,
    addEmployee
}