/////////////////////////////////////////////////////////////
// VIEW DEPARTMENT, ROLE, OR EMPLOYEE
/////////////////////////////////////////////////////////////
function viewDepartments(departmentView) {
    console.table(departmentView);
}

function viewRoles(roleView) {
    console.table(roleView);
}

function viewEmployees(employeeView) {
    console.table(employeeView);
}

/////////////////////////////////////////////////////////////
// VIEW EMPLOYEE BY MANAGER
/////////////////////////////////////////////////////////////

function viewEmployeesByManager(connection) {
    return new Promise(function (resolve, reject) {
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
                return resolve(true); // no changes made
            }
        )
    });
}


/////////////////////////////////////////////////////////////
// VIEW DEPARTMENT SALARY TOTALS
/////////////////////////////////////////////////////////////
function viewDepartmentsSalaryTotal(connection) {
    return new Promise(function (resolve, reject) {
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
                return resolve(true); // no changes made
            }
        );
    });
}

module.exports = {
    viewDepartments,
    viewRoles,
    viewEmployees,
    viewEmployeesByManager,
    viewDepartmentsSalaryTotal
}