const inquirer = require("inquirer");
const {departmentNames, roleNames, employeeNames} = require("./utils"); // helper functions

/////////////////////////////////////////////////////////////
// UPDATE EMPLOYEE ROLE
/////////////////////////////////////////////////////////////
function updateEmployeeRole(connection, role, employee) {
    return new Promise(async function (resolve, reject) {
        const employeePrompt = await inquirer.prompt([
            {
                name: "employee",
                type: "list",
                message: "Who's role would you like to change?",
                choices: employeeNames(employee)
            }]);
        if (employeePrompt.employee === "Cancel") { // cancel process and re-prompt main menu if user decides to cancel
            console.log("Canceling Update Employee Role");
            return resolve(false);
        }

        const rolePrompt = await inquirer.prompt([
            {
                name: "role",
                type: "list",
                message: "What role would you like to assign?",
                choices: roleNames(role)
            }]);
        if (rolePrompt.role === "Cancel") { // cancel process and re-prompt main menu if user decides to cancel
            console.log("Canceling Update Employee Role");
            return resolve(false);
        } else {
            let employeeName = employeePrompt.employee.split(" "); // [ "first", "last" ]
            //find object in employee table that matches first and last name
            let selectedEmployee = employee.find(item => (item.first_name === employeeName[0]) && (item.last_name === employeeName[1]));
            //find object in role table that matches new role
            let selectedRole = role.find(item => item.title === rolePrompt.role)// find the role selected by the user (this is a role object, with ID and title)
            connection.query(
                `UPDATE employee
                SET ?
                WHERE ?`,
                [{ role_id: selectedRole.id }, { id: selectedEmployee.id }], // update employee role id in db
                function (err, res) {
                    if (err) throw err;
                    console.log(`${res.affectedRows} rows affected`);
                    if(res.affectedRows === 1) console.log(`${employeePrompt.employee} assigned role: ${rolePrompt.role}\n`);
                    return resolve(true);
                }
            );
        }
    });
}

/////////////////////////////////////////////////////////////
// UPDATE EMPLOYEE MANAGER
/////////////////////////////////////////////////////////////
function updateEmployeeManager(connection, employee) {
    return new Promise(async function (resolve, reject) {
        let employeeNameArray = employeeNames(employee);

        const employeePrompt = await inquirer.prompt([ // prompt for employee to be updated
            {
                name: "name",
                type: "list",
                message: "Who's manager would you like to change?",
                choices: employeeNameArray
            }]);

        if (employeePrompt.name === "Cancel") { // exit function if cancel selected
            console.log("Canceling Update Employee Manager");
            return resolve(false);
        } else {
            employeeNameArray.splice(employeeNameArray.indexOf(employeePrompt.name), 1); // removes the employee name from the employee list
        }

        const managerPrompt = await inquirer.prompt([ // prompt for new manager
            {
                name: "name",
                type: "list",
                message: "What manager would you like to assign?",
                choices: employeeNameArray
            }]);

        if (managerPrompt.name === "Cancel") { // cancel process and re-prompt main menu if user decides to cancel
            console.log("Canceling Update Employee Manager");
            return resolve(false);
        } else {
            let employeeName = employeePrompt.name.split(" "); // split name string in to [ "First", "Last"] names
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
                    console.log(`${res.affectedRows} rows affected`);
                    if(res.affectedRows === 1) console.log(`${employeePrompt.name} assigned manager: ${managerPrompt.name}\n`);
                    return resolve(true); // return true, resolve promise
                }
            );
        }
    })
}

module.exports = {
    updateEmployeeRole,
    updateEmployeeManager
}