USE employee_db;
SELECT CONCAT(employee.first_name, " ", employee.last_name) AS employee, role.title AS role
FROM role
INNER JOIN employee
ON employee.role_id = role.id AND role.id =3;
