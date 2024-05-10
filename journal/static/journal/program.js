var pvHeader, pvButtons, pvForms, pvContent;
document.addEventListener('DOMContentLoaded', function() {
    pvHeader = document.querySelector('#program-view-header');
    pvButtons = document.querySelector('#program-view-buttons');
    pvForms = document.querySelector('#program-view-form-container');
    pvContent = document.querySelector('#program-view-content');
});

function loadProgramView() {
    const message_container = document.querySelector('#message');
    // Clear any previous messages
    message_container.innerHTML = "";
    // display program view
    toggleView(PROGRAM_VIEW);

    emptyProgramView();
    pv_loadAllPrograms();
    pvButtons.append(returnButton("info", "Add Program", function () {
        pv_addProgramForm();
    }))
}

function emptyProgramView() {
    pvHeader.innerHTML = "";
    pvButtons.innerHTML = "";
    pvForms.innerHTML = "";
    pvContent.innerHTML = "";
}

function pv_addProgramForm() {
    emptyProgramView();
    pvHeader.textContent = "Add a Program";
    const programForm = document.createElement('form');
    
    const nameInput = returnTextInputField(
        "Program Name", 
        "program-name", 
        "Give your program a name (60 characters long)", 
        false,
        ""
    );

    const descriptionInput = returnTextInputField(
        "Program Description", 
        "program-description", 
        "Add a brief description of your program (2000 characters long)", 
        true, 
        ""
    );

    const submitButton = returnButton("info", "Submit", function () {
        pv_submitAddProgramForm()
    });
    submitButton.classList.add("align-self-end");

    const cancelButton = returnButton("info", "Cancel", function () {
        loadProgramView();
    });
    cancelButton.classList.add("align-self-end");

    const btnCont = document.createElement('div');
    btnCont.append(submitButton, cancelButton);

    programForm.append(nameInput, descriptionInput, btnCont);
    pvForms.append(programForm);
}

function pv_submitAddProgramForm() {
    const program_name = pvForms.querySelector('#program-name').value;
    const program_description = pvForms.querySelector('#program-description').value;

    fetch(`program/`, {
        method: 'POST',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            name: program_name,
            description: program_description
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            loadProgramView();
            displayMessage(data.message, true);
        }
    })
}

function pv_loadAllPrograms() {
    fetch('program/all/')
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.log(data.error);
        } else {
            pvHeader.textContent = "Your Programs";
            const program_container = document.createElement('div');
            program_container.classList.add("card", "program-card");
            program_container.setAttribute("data-bs-theme", "dark");

            const list_container = document.createElement('div');
            list_container.classList.add("list-group", "list-group-flush");

            data["programs"].forEach(program => {
                const programItem = document.createElement('div');
                programItem.classList.add("list-group-item", "list-group-item-action");
                programItem.setAttribute("program-id", program["id"]);

                const programHeading = document.createElement('div');
                programHeading.classList.add("d-flex", "w-100", "justify-content-between");
                programHeading.innerHTML = `<h5 class="mb-1">${program["name"]}</h5>`;

                const programContent = document.createElement('p');
                programContent.classList.add("mb-1");
                programContent.innerHTML = program["description"];

                programItem.append(programHeading);
                programItem.append(programContent);

                programItem.addEventListener('click', function () {
                    pv_loadProgram(this.getAttribute("program-id"));
                })
                list_container.append(programItem);
            })

            program_container.append(list_container);
            pvContent.append(program_container);
        }
    })
}

function pv_loadProgram(pId) {
    fetch(`program/?id=${pId}`)
    
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            const message_container = document.querySelector('#message');
            // Clear any previous messages
            message_container.innerHTML = "";
            emptyProgramView();

            const program = data["program"]

            pvHeader.textContent = program.name;

            const pDescription = document.createElement('div');
            pDescription.classList.add("pvProgramDescription");
            pDescription.textContent = program.description;

            pvContent.append(pDescription);
            const backButton = returnButton("info", "Back", function() {
                loadProgramView();
            });
            backButton.classList.add("col");

            const editButton = returnButton("info", "Edit", function() {
                pv_loadProgramEditForm(program);
            })
            editButton.classList.add("col");

            const btnCont = document.createElement('div');
            btnCont.classList.add("row");
            btnCont.append(editButton, backButton);
            pvButtons.append(btnCont);

            pv_loadWorkouts(pId);
        }
    })
}

function pv_loadProgramEditForm(program) {
    emptyProgramView();
    pvHeader.textContent = "Edit " + program.name;
    const programForm = document.createElement('form');
    
    const nameInput = returnTextInputField(
        "Program Name", 
        "program-name", 
        "Edit the program name (60 characters long)", 
        false,
        program.name
    );

    nameInput.dataset.id = program.id;

    const descriptionInput = returnTextInputField(
        "Program Description", 
        "program-description", 
        "Edit program description (2000 characters long)", 
        true, 
        program.description
    );

    const submitButton = returnButton("info", "Submit", function () {
        pv_submitEditProgramForm()
    });
    submitButton.classList.add("align-self-end", "col-2");

    const deleteButton = returnButton("danger", "Delete Program", function() {
        pv_deleteProgram(program.id);
    });
    deleteButton.classList.add("align-self-end", "col-3");

    const cancelButton = returnButton("info", "Cancel", function () {
        pv_loadProgram(program.id)
    });
    cancelButton.classList.add("align-self-end", "col-2");

    const btnCont = document.createElement('div');
    btnCont.classList.add("row", "justify-content-end");
    btnCont.append(submitButton, deleteButton, cancelButton);

    programForm.append(nameInput, descriptionInput, btnCont);
    pvForms.append(programForm);
}

function pv_submitEditProgramForm() {
    program_id = pvForms.querySelector('#program-name').parentNode.dataset.id;
    program_name = pvForms.querySelector('#program-name').value;
    program_description = pvForms.querySelector('#program-description').value;

    fetch(`program/`, {
        method: 'PUT',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            id: program_id,
            name: program_name,
            description: program_description
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            pv_loadProgram(program_id);
            displayMessage(data.message, true);
        }
    })
}

function pv_deleteProgram(id) {
    fetch(`program/?id=${id}`, {
        method: 'DELETE',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            emptyProgramView();
            pv_loadAllPrograms();
            displayMessage(data.message, true);
        }
    })
}

function pv_loadWorkouts(programId) {
    fetch(`program/${programId}/workouts`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            const workouts = data["workouts"]
            const workoutContainer = document.createElement('div');
            
            const workoutHeader = document.createElement('div');
            workoutHeader.classList.add('row');
            const heading = document.createElement('div');
            heading.classList.add("display-6","col-9");
            heading.textContent = "Workouts:";

            const addWorkoutButton = returnButton("info", "Add Workout", function () {

            });
            addWorkoutButton.classList.add("col-3", "align-self-end");

            workoutHeader.append(heading, addWorkoutButton);
            workoutContainer.append(workoutHeader);

            const helptext= document.createElement('div');
            helptext.textContent = "Each day in your program corresponds to a workout. "
                + "Each workout, then, has a bunch of exercises in it. "
                + "Here's a table of all the workouts in this program. "
                + "Click on a row to look at all the exercises within the workout.";
            
            workoutContainer.append(helptext);

            const table = returnWorkoutTable(workouts);
            table.setAttribute("id", "pv-workout-table");
            workoutContainer.append(table);

            pvContent.append(workoutContainer);
        }
    });
}

function returnWorkoutTable(workouts) {
    const table = document.createElement('table');
    const head = document.createElement('thead');
    const body = document.createElement('tbody');

    table.classList.add("table", "table-hover");

    var row = document.createElement('tr');
    var header = document.createElement('th');
    header.setAttribute('scope', 'col');
    header.textContent = "Day";

    row.appendChild(header);
    
    header = document.createElement('th');
    header.setAttribute('scope', 'col');
    header.textContent = "Workout";

    row.appendChild(header);

    head.appendChild(row);
    table.appendChild(head);

    
    var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    for (var i = 0; i < 7; i++) {
        row = document.createElement('tr');
        row.setAttribute("id", "row-" + i);

        const day = document.createElement('td');
        day.textContent = days[i];

        const workout = document.createElement('td');
        workout.setAttribute("id", "row-workout-" + i);
        workout.textContent = "----";

        row.append(day, workout);
        body.append(row);
    }

    workouts.forEach(workout => {
        workout["days"].forEach(day => {
            row = body.querySelector('#row-' + day["dayNum"]);
            row.dataset.workoutId = workout["id"];
            row.querySelector('#row-workout-' + day["dayNum"]).textContent = workout["name"];
        })
    });

    table.append(body);
    return table;

}