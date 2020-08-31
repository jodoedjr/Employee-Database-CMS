USE employee_db;
#SELECT * FROM employee;
SELECT role.id, role.title, role.salary, department.name AS department
FROM role
LEFT OUTER JOIN department #LEFT OUTER JOINS will show all rows in the left (employee) table, even if there isn't a match to the joined table (i.e. employee has a null field)
ON role.department_id = department.id