module.exports = {
    //appends cancel! to array
    departmentNames : (department) => { // creates a array of department names for users to choose from
        let choiceArray = [];
        for (let i = 0; i < department.length; i++) {
            choiceArray.push(`${department[i].name}`);
        }
        choiceArray.push("Cancel");
        return choiceArray;
    },

    //appends cancel! to array
    roleNames : (role) => { // creates an array of role names for users to choose from
        let choiceArray = [];
        for (let i = 0; i < role.length; i++) {
            choiceArray.push(`${role[i].title}`);
        }
        choiceArray.push("Cancel");
        return choiceArray;
    },
    
    //appends cancel! to array
    employeeNames : (employee) => { // creates and array of employee names for users to choose from
        let choiceArray = [];
        for (let i = 0; i < employee.length; i++) {
            choiceArray.push(`${employee[i].first_name} ${employee[i].last_name}`);
        }
        choiceArray.push("Cancel");
        return choiceArray;
    }

};