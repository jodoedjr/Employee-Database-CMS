const mysql = require("mysql");
const inqurier = require("inquirer");
const cTable = require("console.table");
const inquirer = require("inquirer");

const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "employee_db"
});

connection.connect(function(err){
    if (err) throw err;
    //connection open - get data and prompt user
    promptUser();
});

function promptUser(){
    inquirer.prompt({
        name: "action",
        type: "list", 
        message: "Please select an action:",
        choices: [
            "Add Department",
            "Add Role",
            "Add Employee",
            "View Departments",
            "View Roles",
            "View Employees",
            "Update Employee Role", 
            "Exit"
        ]
    }).then(function(response){
        switch (response.action) {
            case "Add Department":
                addDepartment();
                break;
            case "Add Role":
                addRole();
                break;
            case "Add Employee":
                addEmployee();
                break;
            case "View Departments":
                viewDepartments();
                break;
            case "View Roles":
                viewRoles();
                break;
            case "View Employees":
                viewEmployees();
                break;
            case "Update Employee Role":
                updateEmployeeRole();
                break;
            case "Exit":
                connection.end();
                return;
        }
    });
}

function viewDepartments(){
    connection.query("SELECT * from department", function(err, res){
        if (err) throw err;
        console.table(res);
        promptUser();
    });
}

function viewRoles(){
    connection.query("SELECT * from role", function(err, res){
        if (err) throw err;
        console.table(res);
        promptUser();
    });
}

function viewEmployees(){
    connection.query("SELECT * from employee", function(err, res){
        if (err) throw err;
        console.table(res);
        promptUser();
    })
}