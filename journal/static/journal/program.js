var pvHeader, pvButtons, pvDescription, pvForms, pvContent;
document.addEventListener('DOMContentLoaded', function() {
    pvHeader = document.querySelector('#program-view-header');
    pvButtons = document.querySelector('#program-view-buttons');
    pvDescription = document.querySelector('#program-view-description');
    pvForms = document.querySelector('#program-view-form-container');
    pvContent = document.querySelector('#program-view-content');
});

function loadProgramView() {
    clearMessages();
    // display program view
    toggleView(PROGRAM_VIEW);

    emptyProgramView();
    pv_loadAllPrograms();
}

function emptyProgramView() {
    pvHeader.innerHTML = "";
    pvButtons.innerHTML = "";
    pvDescription.innerHTML = "";
    pvForms.innerHTML = "";
    pvContent.innerHTML = "";
}


function pv_loadAllPrograms() {
    fetch('program/all/')
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.log(data.error);
        } else {
            emptyProgramView();
            pvButtons.append(returnButton("info", "Add Program", function () {
                pv_addProgramForm();
            }))
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
            emptyProgramView();

            const program = data["program"]

            pvHeader.textContent = program.name;

            const pDescription = document.createElement('div');
            pDescription.classList.add("pvProgramDescription");
            pDescription.textContent = program.description;

            pvDescription.append(pDescription);
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

            const workoutContainer = document.createElement('div');
            workoutContainer.setAttribute("id", "pvWorkoutContainer");
            workoutContainer.dataset.programId = pId;

            pvContent.append(workoutContainer);

            const exerciseContainer = document.createElement('div');
            exerciseContainer.setAttribute("id", "pvExerciseContainer");

            const exContMessageContainer = document.createElement('div');
            exContMessageContainer.setAttribute("id", "exerciseContainerMessage");

            exerciseContainer.append(exContMessageContainer);
            pvContent.append(exerciseContainer);

            pv_loadWorkouts(pId);
        }
    })
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
        pv_submitAddProgramForm();
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

    if (program_name == "") {
        pvForms.querySelector('#program-name').classList.add("is-invalid");
        return;
    }

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
    

    const deleteButton = returnButton("danger", "Delete Program", function() {
        pv_deleteProgram(program.id);
    });
    

    const cancelButton = returnButton("info", "Cancel", function () {
        pv_loadProgram(program.id)
    });
    

    const btnCont = document.createElement('div');
    btnCont.classList.add("row");

    const delCont = document.createElement('div');
    delCont.classList.add("col", "float-left");
    delCont.append(deleteButton);

    const rightbtns = document.createElement('div');
    rightbtns.classList.add("col", "d-flex", "justify-content-end");
    rightbtns.append(submitButton, cancelButton);
    btnCont.append(delCont, rightbtns);

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
    return fetch(`program/${programId}/workouts`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            
            const workouts = data["workouts"]
            const workoutContainer = document.querySelector('#pvWorkoutContainer');
            workoutContainer.innerHTML = "";

            const workoutHeader = document.createElement('div');
            workoutHeader.classList.add('row');
            const heading = document.createElement('div');
            heading.classList.add("display-6","col-9");
            heading.textContent = "Workouts:";

            workoutHeader.append(heading);
            workoutContainer.append(workoutHeader);

            const helptext= document.createElement('div');
            helptext.innerHTML = "<p>Each day in your program corresponds to a workout. "
                + "Each workout, then, has a bunch of exercises in it. "
                + "Here's a table of all the workouts in this program. "
                + "Click on a row to look at all the exercises within the workout.</p>";
            
            workoutContainer.append(helptext);

            const table = pv_returnWorkoutTable(workouts);
            table.setAttribute("id", "pv-workout-table");
            workoutContainer.append(table);

        }
    });
}

function pv_returnWorkoutTable(workouts) {
    const table = document.createElement('table');
    const head = document.createElement('thead');
    const body = document.createElement('tbody');

    table.classList.add("table", "table-hover");
    body.classList.add("accordion", "accordion-flush");
    body.setAttribute("id", "workoutTableAccordion");

    var row = document.createElement('tr');
    var header = document.createElement('th');
    header.setAttribute('scope', 'col');
    header.textContent = "Day";

    row.appendChild(header);
    
    header = document.createElement('th');
    header.setAttribute('scope', 'col');
    header.classList.add("text-center");
    header.textContent = "Workout"

    row.appendChild(header);

    head.appendChild(row);
    table.appendChild(head);

    var rowEmptyClicked = function (event) {
        pv_displayWorkoutForm(this, workouts, days);
    }

    
    var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    for (var i = 0; i < 7; i++) {
        row = document.createElement('tr');
        row.setAttribute("id", "row-" + i);
        row.dataset.day = i;

        const day = document.createElement('td');
        day.textContent = days[i];

        const workout = document.createElement('td');
        workout.setAttribute("id", "row-workout-" + i);
        workout.classList.add("text-center");
        workout.innerHTML = `<small><em>Add a workout</em></small>`;

        row.append(day, workout);

        row.addEventListener('click', rowEmptyClicked);
        body.append(row);
    }

    workouts.forEach(workout => {
        workout["days"].forEach(day => {
            row = body.querySelector('#row-' + day["dayNum"]);
            row.dataset.workoutId = workout["id"];
            row.querySelector('#row-workout-' + day["dayNum"]).textContent = workout["name"];
            row.removeEventListener('click', rowEmptyClicked);
            row.addEventListener('click', function () {
                pv_displayWorkoutExercises(this, days);
            })
        })
    });

    table.append(body);
    return table;

}


function pv_displayWorkoutExercises(row, days) {
    const day = row.dataset.day;
    const workoutId = row.dataset.workoutId;
    const workoutName = row.querySelector('#row-workout-' + day).textContent;
    const exerciseContainer = document.querySelector('#pvExerciseContainer');
    exerciseContainer.innerHTML = `
        <div id="exerciseContainerHeader" class="row d-flex">
        <div class="display-6 col">${workoutName} workout on ${days[day]}:</div>
        </div>
        <p>Below is a list of all the exercises in the workout:</p>`;
    
    const editButton = returnButton(
        "info",
        "Edit",
        function () { pv_displayEditWorkoutForm(row, days) }
        );
    editButton.classList.add("col-2", "justify-content-end");
    document.querySelector('#exerciseContainerHeader').append(editButton);

    fetch(`workout/${workoutId}/exercises`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            const exercises = data["exercises"];
            const listGroup = document.createElement('ol');
            listGroup.classList.add("list-group", "list-group-numbered");

            exercises.forEach(exercise => {
                const item = document.createElement('li');
                item.classList.add(
                    "list-group-item", 
                    "d-flex", 
                    "justify-content-between", 
                    "align-items-start"
                );

                item.innerHTML = `
                    <div class="ms-2 me-auto">
                    <div class="fw-bold">${exercise.name}</div>
                    ${exercise.description}
                    </div>
                `;
                listGroup.append(item);
            })

            exerciseContainer.append(listGroup);
        }
    })
}


function pv_displayEditWorkoutForm(row, days) {
    const day = row.dataset.day;
    const workoutId = row.dataset.workoutId;
    const workoutName = row.querySelector('#row-workout-' + day).textContent;

    const exerciseContainer = document.querySelector('#pvExerciseContainer');
    exerciseContainer.innerHTML = `
        <div id="exerciseContainerHeader" class="row d-flex">
        <div class="display-6 col">Edit ${workoutName} workout on ${days[day]}:</div>
        </div>`;

    const form = document.createElement('form');
    form.classList.add("form-control");
    form.setAttribute("id", "editWorkoutForm");
    form.dataset.workoutId = workoutId;

    const nameField = returnTextInputField(
        "Workout Name",
        "workout-name",
        "New workout name (60 characters long):",
        false,
        ""
    )

    const deleteButton = returnButton("danger", "Delete Workout", function () {
        pv_deleteWorkout(workoutId);
    })

    const submitButton = returnButton("info", "Submit", function () {
        pv_submitEditWorkoutForm();
    })

    const cancelButton = returnButton("info", "Cancel", function () {
        pv_displayWorkoutExercises(row, days);
    })

    const btnCont = document.createElement('div');
    btnCont.classList.add("row");

    const delCont = document.createElement('div');
    delCont.classList.add("col", "float-left");
    delCont.append(deleteButton);

    const rightbtns = document.createElement('div');
    rightbtns.classList.add("col", "d-flex", "justify-content-end");
    rightbtns.append(submitButton, cancelButton);
    btnCont.append(delCont, rightbtns);

    form.append(nameField, btnCont);
    exerciseContainer.append(form);
}


function pv_displayWorkoutForm(row, workouts, days) {
    const day = row.dataset.day;
    const exerciseContainer = document.querySelector('#pvExerciseContainer');
    exerciseContainer.innerHTML = `
        <div class="display-6">Add Workout on ${days[day]}:</div>
        Choose from an existing workout:
        `;

    const main_container = document.createElement('div');

    // a select field where the user can pick an existing workout
    const sl_Container = document.createElement('form');
    sl_Container.classList.add("form-control");

    const sl_label = document.createElement('label');
    sl_label.classList.add("form-label");
    sl_label.setAttribute("for", "workoutSelectMenu");
    sl_label.textContent = "Workout:";

    const selectField = document.createElement('select');
    selectField.classList.add("form-select");
    selectField.setAttribute("aria-label", "Workout selection drop-down");
    selectField.setAttribute("id", "workoutSelectMenu");

    var row = document.createElement('option');
    row.setAttribute("selected", "true");
    row.textContent = "Select an existing workout";

    selectField.append(row);

    var counter = 0;
    workouts.forEach(workout => {
        row = document.createElement('option');
        row.setAttribute("value", counter);
        row.textContent = workout["name"];
        row.dataset.workoutId = workout["id"];
        row.dataset.day = day;

        selectField.append(row);
        counter++;
    });

    const submitWorkoutButton = returnButton("info", "Add Workout", function () {
        pv_submitWorkoutSelectFieldForm();
    });

    sl_Container.append(sl_label, selectField, submitWorkoutButton);
    main_container.append(sl_Container);
    
    // a form to add a new workout to the program on the selected day

    const workoutForm = document.createElement('form');
    workoutForm.classList.add("form-control");

    workoutForm.append(returnTextInputField(
        "Workout Name:",
        "workout-name",
        "Give your workout a name (60 characters long)",
        false,
        ""
    ))

    workoutForm.append(returnButton(
        "info", 
        "Add New Workout",
        function() {
            pv_submitAddWorkoutForm(day);
        }
    ))

    main_container.append("Or add a new workout:", workoutForm);
    exerciseContainer.append(main_container);
}


function pv_submitAddWorkoutForm(day) {
    const nameField = document.querySelector('#workout-name');
    const programId = document.querySelector('#pvWorkoutContainer').dataset.programId;
    const workoutName = nameField.value;

    if (workoutName == "") {
        nameField.classList.add("is-invalid");
        return;
    }

    fetch(`workout/`, {
        method: 'POST',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            name: workoutName,
            program: programId,
            day: day
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false, '#exerciseContainerMessage');
        } else {
            pv_loadWorkouts(programId)
            .then(() => displayMessage(data.message, true, '#exerciseContainerMessage'));
            
        }
    })
}


function pv_submitWorkoutSelectFieldForm() {
    const selectField = document.querySelector('#workoutSelectMenu');
    if (selectField.selectedIndex == 0) {
        selectField.classList.add("is-invalid");
        return;
    }

    const workout = selectField.options[selectField.selectedIndex];
    const id = workout.dataset.workoutId;
    const dayNum =  workout.dataset.day;

    fetch(`workout/${id}/add_day`, {
        method: 'POST',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            day: dayNum
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            pv_loadProgram(document.querySelector('#pvWorkoutContainer').dataset.programId).then(
            displayMessage(data.message, true));
        }
    })
}