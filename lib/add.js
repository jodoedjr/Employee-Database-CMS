const inquirer = require("inquirer");
const {departmentNames, roleNames, employeeNames} = require("./utils"); // helper functions

/////////////////////////////////////////////////////////////
// ADD DEPARTMENT
/////////////////////////////////////////////////////////////
function addDepartment(connection) {// asks user for new department name, then adds department to database, and shows departments
    return new Promise(async function (resolve, reject) { // return a promise that encapsulates our async inquirer prompt and db query
        await inquirer.prompt({
            name: "department",
            type: "input",
            message: "Input new department name, or X to cancel:",
        }).then(function (response) {
            if (response.department == "X") { // if user wants to escape
                console.log("Canceling Add Department");
                return resolve(false);
            } else {
                connection.query(
                    `INSERT INTO department (name)
                    VALUES (?);`,
                    [response.department], //user response
                    function (err, res) { // async anonymous function to await updateLocalDepartment() promise
                        if (err) throw err;
                        console.log(`${res.affectedRows} rows affected`);
                        if (res.affectedRows === 1) console.log(`${response.department} added!`);
                        return resolve(true);
                    }
                );
            }
        });
    });
}

/////////////////////////////////////////////////////////////
// ADD ROLE
/////////////////////////////////////////////////////////////
function addRole(connection, department) {
    return new Promise(async function (resolve, reject) { // return a promise that encapsulates our async inquirer prompt and db query
        const titlePrompt = await inquirer.prompt([ // prompt user for role title, role salary, and to select an existing department
            {
                name: "title",
                type: "input",
                message: "Input new role title, or X to cancel:",
            }]);
        if (titlePrompt.title === "X") { // if user wants to escape, call promptUser()
            console.log("Exiting add role");
            return resolve(false); // resolve the promise
        }

        const salaryPrompt = await inquirer.prompt([
            {
                name: "salary",
                type: "input",
                message: "Input new role salary, or 0 to cancel:",
                validate: function (input) {
                    if (isNaN(input)) {//typeof input !== "number") {
                        return "Please enter a number";
                    }
                    return true;
                },
            }]);
        if (parseInt(salaryPrompt.salary) === 0) { // if user wants to escape, call promptUser()
            console.log("Exiting add role");
            return resolve(false); // resolve the promise
        }

        const departmentPrompt = await inquirer.prompt([
            {
                name: "department",
                type: "list",
                message: "Select a department for this role:",
                choices: departmentNames(department)
            }]);
        if (departmentPrompt.department === "Cancel") { // if user wants to escape, call promptUser()
            console.log("Exiting add role");
            return resolve(false); // resolve the promise
        } else { // user does not want to exit
            let selectedDepartment = department.find(item => item.name === departmentPrompt.department) // find where user response === the name of a department
            connection.query( // insert new role in role table
                `INSERT INTO role (title, salary, department_id)
                            VALUES (?, ?, ?);`,
                [titlePrompt.title, salaryPrompt.salary, selectedDepartment.id], //user response, use the id of the selectedDepartment as the foreign key in the role table
                function (err, res) { // async anonymous function to await updateLocalRole() promise
                    if (err) throw err;
                    console.log(`${res.affectedRows} rows affected`);
                    if (res.affectedRows === 1) console.log(`${titlePrompt.title} added!`);
                    return resolve(true); // resolve the promise
                }
            );
        }

    });
}

/////////////////////////////////////////////////////////////
// ADD EMPLOYEE
/////////////////////////////////////////////////////////////
function addEmployee(connection, role, employee) {
    return new Promise(async function (resolve, reject) { // return a promise that encapsulates our async inquirer prompt and db query
        const firstPrompt = await inquirer.prompt([ // prompt for new employee first name, last name, role from existing roles, manager from existing employees
            {
                name: "first",
                type: "input",
                message: "Enter Employee First Name, or X to cancel",
            }]);
        if (firstPrompt.first == "X") {
            console.log("Canceling Add Employee");
            return resolve(false);
        }

        const lastPrompt = await inquirer.prompt([
            {
                name: "last",
                type: "input",
                message: "Enter Employee Last Name, or X to cancel",
            }]);
        if (lastPrompt.last == "X") {
            console.log("Canceling Add Employee");
            return resolve(false);
        }

        const rolePrompt = await inquirer.prompt([
            {
                name: "role",
                type: "list",
                message: "Select a role for this employee:",
                choices: roleNames(role) // returns an array of existing role names
            }]);
        if (rolePrompt.role == "Cancel") {
            console.log("Canceling Add Employee");
            return resolve(false);
        }

        let employeeNameArray = employeeNames(employee);
        employeeNameArray.pop(); // removes "Cancel" from end of array
        employeeNameArray.unshift("null"); //adds null to beginning of array
        const managerPrompt = await inquirer.prompt([
            {
                name: "manager",
                type: "list",
                message: "Select a manager for this employee (or null/blank):",
                choices: employeeNameArray
            }]);

        let selectedRole = role.find(item => item.title === rolePrompt.role) // role object where user role object title === user response.role
        let selectedManager; // instantiate variable for later
        if (managerPrompt.manager != "null") { // if user response for manager was not "null"
            let managerName = managerPrompt.manager.split(" "); // split response manager name into "first_name" and "last_name"
            selectedManager = employee.find(item => { // find employee object of employee who's name matches the user input
                if ((item.first_name === managerName[0]) && (item.last_name === managerName[1])) {
                    return true;
                }
            });
        }
        if (typeof selectedManager === "undefined") { // employee object matching managerName was not found, or is purposely null
            selectedManager = { id: null }; // setup selectedManager to give a null manager id
            console.log(`Warning: Setting employee manager to 'null'`);
        }

        connection.query( // insert new employee (first, last, role, manager)
            `INSERT INTO employee (first_name, last_name, role_id, manager_id)
                            VALUES (?, ?, ?, ?);`,
            [firstPrompt.first.trim(), lastPrompt.last.trim(), selectedRole.id, selectedManager.id], //user response
            function (err, res) { // async anonymous function to await updating local tables                  
                if (err) throw err;
                console.log(`${res.affectedRows} rows affected`);
                if (res.affectedRows === 1) console.log(`${firstPrompt.first} ${lastPrompt.last}, ${rolePrompt.role} added!`);
                return resolve(true);
            }
        );

    });
};

module.exports = {
    addDepartment,
    addRole,
    addEmployee
}