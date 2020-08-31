USE employee_db;
SELECT department.name AS department, SUM(role.salary) AS "Salary Total"
FROM employee
LEFT OUTER JOIN role #LEFT OUTER JOINS will show all rows in the left (employee) table, even if there isn't a match to the joined table (i.e. employee has a null field)
ON employee.role_id = role.id
LEFT OUTER JOIN department
ON role.department_id = department.id
GROUP BY department.name;