const inquirer = require("inquirer");
const {departmentNames, roleNames, employeeNames} = require("./utils"); // helper functions

/////////////////////////////////////////////////////////////
// DELETE DEPARTMENT, ROLE, OR EMPLOYEE
/////////////////////////////////////////////////////////////
function deleteDepartment(connection, department) {

    return new Promise(async function (resolve, reject) { // return a promise that encapsulates our async inquirer prompt and db query
        // prompt for department name to delete
        const departmentNameResponse = await inquirer.prompt([
            {
                name: "name",
                type: "list",
                message: "Which department would you like to delete?",
                choices: departmentNames(department)
            }
        ]);
        // check if department has any roles assigned. If department has roles, prevent deletion
        if (departmentNameResponse.name === "Cancel") {
            console.log("Canceling Delete Department");
            return resolve(false);
        }
        //get department object
        const selectedDepartment = department.find(item => item.name === departmentNameResponse.name);
        connection.query( // find any roles that belong to the selected department
            `
            SELECT department.name AS department, role.title as role
            FROM role
            INNER JOIN department
            ON department.id = role.department_id AND ?;
            `,
            [{ department_id: selectedDepartment.id }],
            async function (err, res) { // when query is finished
                if (err) throw err;
                if (res.length === 0) {// department has 0 roles assigned to it, and is ok to delete
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
                                return resolve(true);
                                //await updateLocalDepartment();
                            }
                        );
                    } else {
                        console.log("Canceling Delete Department");
                        return resolve(false);
                        //promptUser();// prompt user for next action
                    }// confirmation
                } else {//  (res.length > 0)  // if the department has roles assigned to it, inform the user and exit delete function
                    // if department has roles, prompt user with info, and inform them to delete roles first
                    console.table(res); // displays department roles to user
                    console.log(`!!!! Please delete these roles before deleting ${selectedDepartment.name} !!!!`);
                    return resolve(false); // resolve the returned promise
                }
            });
    });
}

function deleteRole(connection, role) {
    return new Promise(async function (resolve, reject) {
        //prompt for role to delete
        const roleNameResponse = await inquirer.prompt([
            {
                name: "name",
                type: "list",
                message: "Which role would you like to delete?",
                choices: roleNames(role)
            }
        ]);
        if (roleNameResponse.name === "Cancel") {
            console.log("Canceling Delete Role");
            return resolve(false); // return/ resolve promise if user wants to cancel
        }
        let selectedRole = role.find(item => item.title === roleNameResponse.name); // get selected role object
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
                    console.table(res); // log query results to user terminal - employees who will be affected by deleting this role
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
                    connection.query( // query to delete
                        `
                    DELETE
                    FROM role
                    WHERE ?
                    `,
                        [{ id: selectedRole.id }], // delete the role with this id
                        function (err, res) {
                            if (err) { resolve(false); throw err; } // if failed, resolve and throw err
                            console.log(`${res.affectedRows} rows affected`);
                            return resolve(true);
                        }
                    )
                } else {
                    console.log("Canceling Delete Role");
                    return resolve(false); // did not delete role
                }
            }
        )
    });
}

function deleteEmployee(connection, employee) {
    return new Promise(async function (resolve, reject) {
        //prompt to employee to delete
        const employeeNameResponse = await inquirer.prompt([
            {
                name: "name",
                type: "list",
                message: "Which employee would you like to delete?",
                choices: employeeNames(employee)
            }
        ]);
        if (employeeNameResponse.name === "Cancel") {
            console.log("Canceling Delete Employee");
            return resolve(false);
        }
        //prompt for confirmation
        const confirmation = await inquirer.prompt([
            {
                name: "confirm",
                type: "confirm",
                message: `Are you sure you want to delete ${employeeNameResponse.name}?`
            }
        ]);
        if (confirmation.confirm) {
            let employeeName = employeeNameResponse.name.split(" "); // split into first and last names
            //get employee object
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
                    if (res.affectedRows === 1) console.log(`${employeeNameResponse.name} removed!`);
                    return resolve(true); // employee deleted
                }
            )
        } else {
            console.log("Canceling Delete Employee");
            return resolve(false);
            //promptUser();
        }
    });
}

module.exports = {
    deleteDepartment,
    deleteRole,
    deleteEmployee
}