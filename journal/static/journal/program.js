// Initialize program view containers
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

/*
================================================================================
        <--------------- Program Related Functions --------------->
================================================================================
*/

// Loads all the user's programs into a list. Clicking on a list element loads
// the particular workout
function pv_loadAllPrograms() {
    fetch('program/all/')
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            emptyProgramView();
            pvButtons.append(returnButton("info", "Add Program", function () {
                pv_displayAddProgramForm();
            }))

            // Update Header
            pvHeader.textContent = "Your Programs";

            // Initialize program container
            const program_container = document.createElement('div');
            program_container.classList.add("card", "program-card");
            program_container.setAttribute("data-bs-theme", "dark");

            // Initialize program list containers
            const list_container = document.createElement('div');
            list_container.classList.add("list-group", "list-group-flush");

            // Add programs to the list
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

                // Add click listener to load the program when clicked
                programItem.addEventListener('click', function () {
                    pv_loadProgram(this.getAttribute("program-id"));
                })
                list_container.append(programItem);
            })

            // Append programs to page
            program_container.append(list_container);
            pvContent.append(program_container);
        }
    })
}


// Empties the program view and displays the given program's workouts through the week
// as a tables
function pv_loadProgram(pId) {
    fetch(`program/?id=${pId}`)
    
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            emptyProgramView();

            const program = data["program"]

            pvHeader.textContent = program.name;    // update header

            const pDescription = document.createElement('div');
            pDescription.classList.add("pvProgramDescription");
            pDescription.textContent = program.description;

            // Back button which returns to the program view
            pvDescription.append(pDescription);
            const backButton = returnButton("info", "Back", function() {
                loadProgramView();
            });
            backButton.classList.add("col");

            // Allow editing program name and description using an edit button
            const editButton = returnButton("info", "Edit", function() {
                pv_loadProgramEditForm(program);
            })
            editButton.classList.add("col");

            const btnCont = document.createElement('div');
            btnCont.classList.add("row");
            btnCont.append(editButton, backButton);
            pvButtons.append(btnCont);


            // Create the rest of the containers needed
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

            // load all the workouts within the program
            pv_loadWorkouts(pId);
        }
    })
}


/*
====================================
--> Program Form Related Functions
====================================
*/

// Displays a form to add a new program to the user
function pv_displayAddProgramForm() {
    emptyProgramView();                                     // empty view

    pvHeader.textContent = "Add a Program";                 // update header
    
    const programForm = document.createElement('form');     // initialize form
    
    // Initialize Input Fields
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

    // Initialize buttons
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

    // Append to form and display
    programForm.append(nameInput, descriptionInput, btnCont);
    pvForms.append(programForm);
}


// Submits the add program and reloads the program view with the updated data
function pv_submitAddProgramForm() {
    // Fetch input field values
    const program_name = pvForms.querySelector('#program-name').value;
    const program_description = pvForms.querySelector('#program-description').value;

    // Program name can't be empty
    if (program_name == "") {
        pvForms.querySelector('#program-name').classList.add("is-invalid");
        return;
    }

    // Attempt to submit form
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
        } else {    // Load program view if successful
            loadProgramView();
            displayMessage(data.message, true);
        }
    })
}


// Loads an edit program form pre-populated with the program's current details.
function pv_loadProgramEditForm(program) {
    emptyProgramView();                                 // empty view

    pvHeader.textContent = "Edit " + program.name;      // update header
    
    const programForm = document.createElement('form');
    
    // Initialize input fields
    const nameInput = returnTextInputField(
        "Program Name", 
        "program-name", 
        "Edit the program name (60 characters long)", 
        false,
        program.name
    );

    nameInput.dataset.id = program.id;                  // set program ID for submission

    const descriptionInput = returnTextInputField(
        "Program Description", 
        "program-description", 
        "Edit program description (2000 characters long)", 
        true, 
        program.description
    );

    // Initialize buttons
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

    // Append to view
    programForm.append(nameInput, descriptionInput, btnCont);
    pvForms.append(programForm);
}


// Submits the edit program form and reloads the updated program data
function pv_submitEditProgramForm() {
    // Fetch form values
    program_id = pvForms.querySelector('#program-name').parentNode.dataset.id;
    program_name = pvForms.querySelector('#program-name').value;
    program_description = pvForms.querySelector('#program-description').value;

    // Attempt to submit data
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
        } else {    // if successful, load program with updated data
            pv_loadProgram(program_id);
            displayMessage(data.message, true);
        }
    })
}

// Deletes the given program and loads the program view
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



/*
================================================================================
        <--------------- Workout Related Functions --------------->
================================================================================
*/

// Loads all the workouts in a given program on a week table with each row corresponding
// to a day of the week. Erases any existing elements inside the "#pvWorkoutContainer".
function pv_loadWorkouts(programId) {
    fetch(`program/${programId}/workouts`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            const workouts = data["workouts"];

            // clear container
            const workoutContainer = document.querySelector('#pvWorkoutContainer');
            workoutContainer.innerHTML = "";

            // create header and append
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

            // fetch workout table and append it
            const table = pv_returnWorkoutTable(workouts);
            table.setAttribute("id", "pv-workout-table");
            workoutContainer.append(table);

        }
    });
}


// return a table populated with the given workouts where each row corresponds
// to a day of the week. Also add listeners to rows so that clicking on a row
// displays all the exercises for that day's workout. If a workout does not exist,
// allow the user to either select from the existing ones or create a new workout
function pv_returnWorkoutTable(workouts) {
    // Initialize table
    const table = document.createElement('table');
    const head = document.createElement('thead');
    const body = document.createElement('tbody');

    table.classList.add("table", "table-hover");
    body.classList.add("accordion", "accordion-flush");
    body.setAttribute("id", "workoutTable");

    // initialize table header
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

    // Listenr for when an empty row is clicked
    var rowEmptyClicked = function (event) {
        pv_displayWorkoutForms(this, workouts, days);
    }

    
    var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    // first, initialize table as blank
    for (var i = 0; i < 7; i++) {
        row = document.createElement('tr');
        row.setAttribute("id", "row-" + i);
        row.dataset.day = i;

        // set day column
        const day = document.createElement('td');
        day.textContent = days[i];

        // set workout column
        const workout = document.createElement('td');
        workout.setAttribute("id", "row-workout-" + i);
        workout.classList.add("text-center");
        workout.innerHTML = `<small><em>Add a workout</em></small>`;

        row.append(day, workout);

        // set the empty row listener
        row.addEventListener('click', rowEmptyClicked);
        body.append(row);
    }

    // then, put each workout in the row it belongs
    workouts.forEach(workout => {
        workout["days"].forEach(day => {    // a workout can be on multiple days
            row = body.querySelector('#row-' + day["dayNum"]);
            row.dataset.workoutId = workout["id"];
            row.querySelector('#row-workout-' + day["dayNum"]).textContent = workout["name"];
            
            // remove the empty row listener
            row.removeEventListener('click', rowEmptyClicked);

            // add new listener to display exercises for a populated row
            row.addEventListener('click', function () {
                pv_displayWorkoutExercises(this, days);
            })
        })
    });

    table.append(body);
    return table;

}


// Display all the exercises in a workout as a list-group. Erases any existing
// elements inside the "#pvExerciseContainer".
// The parameter "row" is passed by the eventListener while the "days" argument
// is simply an array with days of the week as strings
function pv_displayWorkoutExercises(row, days) {
    // extract needed data from the passed row
    const day = row.dataset.day;
    const workoutId = row.dataset.workoutId;
    const workoutName = row.querySelector('#row-workout-' + day).textContent;

    // update container to wipe any previous entries
    const exerciseContainer = document.querySelector('#pvExerciseContainer');
    exerciseContainer.innerHTML = `
        <div id="exerciseContainerHeader" class="row d-flex">
        <div class="display-6 col">${workoutName} workout on ${days[day]}:</div>
        </div>
        <p>Below is a list of all the exercises in the workout:</p>`;
    
    // edit button to allow the user to edit a workout's name
    const editButton = returnButton(
        "info",
        "Edit",
        function () { pv_displayEditWorkoutForm(row, days) }
        );
    editButton.classList.add("col-2", "justify-content-end");
    document.querySelector('#exerciseContainerHeader').append(editButton);

    // Fetch all the exercises from the server
    fetch(`workout/${workoutId}/exercises`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            const exercises = data["exercises"];
            
            // Initialize list group
            const listGroup = document.createElement('ol');
            listGroup.classList.add("list-group", "list-group-numbered");

            // Add exercise entries to list
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


/*
====================================
--> Workout Form Related Functions
====================================
*/

// Desplay the edit workout form to allow the user to change a workout's name or
// delete the workout. Also empties the "#pvExerciseContainer" removing any existing
// workout exercises.
// The parameter "row" is passed by the eventListener and corresponds to the currently
// active workout's row in the workout table. "Days" is the same day of the week
// array mentioned in previous functions
function pv_displayEditWorkoutForm(row, days) {
    // extract data from the currently active workout's row
    const day = row.dataset.day;
    const workoutId = row.dataset.workoutId;
    const workoutName = row.querySelector('#row-workout-' + day).textContent;

    // empty the exercise container and append a header
    const exerciseContainer = document.querySelector('#pvExerciseContainer');
    exerciseContainer.innerHTML = `
        <div id="exerciseContainerHeader" class="row d-flex">
        <div class="display-6 col">Edit ${workoutName} workout on ${days[day]}:</div>
        </div>`;

    // Initialize edit workout form
    const form = document.createElement('form');
    form.classList.add("form-control");
    form.setAttribute("id", "editWorkoutForm");
    form.dataset.workoutId = workoutId;

    const nameField = returnTextInputField(
        "Workout Name",
        "workout-name",
        "New workout name (60 characters long):",
        false,
        workoutName
    )

    // Initialize buttons
    const deleteButton = returnButton("danger", "Delete Workout", function () {
        pv_deleteWorkout(workoutId, row, days);
    })

    const submitButton = returnButton("info", "Submit", function () {
        pv_submitEditWorkoutForm(row, days);
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


// Deletes the given workout and reloads the workout exercises table
function pv_deleteWorkout(workoutId, row, days) {
    if (workoutId == "") {
        displayMessage("Workout ID cannot be empty", false);
        return;
    }

    fetch(`workout/?id=${workoutId}`, {
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
            document.querySelector('#pvExerciseContainer').innerHTML = "";
            pv_loadWorkouts(document.querySelector('#pvWorkoutContainer').dataset.programId);
            displayMessage(data.message, true);
        }
    })
}


// Submits the edit workout form and refreshes the workout table and header data
function pv_submitEditWorkoutForm(row, days) {
    const workoutId = row.dataset.workoutId;
    const nameField = document.querySelector('#workout-name');
    const workoutName = nameField.value;

    if (workoutName == "") {
        nameField.classList.add("is-invalid");
    }

    fetch(`workout/`, {
        method: 'PUT',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            id: workoutId,
            name: workoutName
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {    // submitting an edit form reloads the workout Tables
            pv_loadWorkouts(document.querySelector('#pvWorkoutContainer').dataset.programId);
            document.querySelector('#row-workout-' + row.dataset.day).textContent = workoutName;
            pv_displayWorkoutExercises(document.querySelector(`#row-` + row.dataset.day), days);
            displayMessage(data.message, true);
        }
    })
}


// Display a form when the user clicks on an empty row in the workout table.
// Presents the user with two forms: one where they can select an existing
// workout to fill the slot, or add a new workout altogether. Also empties the
// "#pvExerciseContainer" removing any existing exercises.
// The parameter "row" is passed by the eventListener and corresponds to the currently
// active workout's row in the workout table. "Days" is the same day of the week array
// mentioned in previous functions. "Workouts" is the workout data previously fetched
// from the server. It is used to populate the options in the select field.
function pv_displayWorkoutForms(row, workouts, days) {
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

    // Default option
    var row = document.createElement('option');
    row.setAttribute("selected", "true");
    row.textContent = "Select an existing workout";

    selectField.append(row);

    var counter = 0;
    workouts.forEach(workout => {   // Append all existing workouts as options
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


// Submits the add workout form and reloads the workout table data
function pv_submitAddWorkoutForm(day) {
    // Fetch form values
    const nameField = document.querySelector('#workout-name');
    const programId = document.querySelector('#pvWorkoutContainer').dataset.programId;
    const workoutName = nameField.value;

    // Empty workout name is invalid
    if (workoutName == "") {
        nameField.classList.add("is-invalid");
        return;
    }

    // Attempt to submit data
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
            displayMessage(data.error, false);
        } else {    // if successful, reload workout table data
            pv_loadWorkouts(programId);
            displayMessage(data.message, true);
            document.querySelector('#pvExerciseContainer').innerHTML = "";
        }
    })
}


// Submits the workout select field form and reloads the updated program data
function pv_submitWorkoutSelectFieldForm() {
    const selectField = document.querySelector('#workoutSelectMenu');
    
    // Default option is invalid
    if (selectField.selectedIndex == 0) {
        selectField.classList.add("is-invalid");
        return;
    }

    // Fetch form values
    const workout = selectField.options[selectField.selectedIndex];
    const id = workout.dataset.workoutId;
    const dayNum =  workout.dataset.day;

    // Attemp to submit data
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
        } else {    // If successfull, reload updated program data
            pv_loadProgram(document.querySelector('#pvWorkoutContainer').dataset.programId);
            displayMessage(data.message, true);
        }
    })
}