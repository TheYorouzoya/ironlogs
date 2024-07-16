// Initialize program view containers
let pvHeader, pvButtons, pvDescription, pvForms, pvContent, days;
function pv_init() {
    pvHeader = document.querySelector('#program-view-header');
    pvButtons = document.querySelector('#program-view-buttons');
    pvDescription = document.querySelector('#program-view-description');
    pvForms = document.querySelector('#program-view-form-container');
    pvContent = document.querySelector('#program-view-content');
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
}

async function loadProgramView() {
    clearMessages();
    // display program view
    toggleView(PROGRAM_VIEW);

    emptyProgramView();
    await pv_loadAllPrograms();
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
async function pv_loadAllPrograms() {
    const apiResponse = await fetch('program/all/')
    const data = await apiResponse.json();
    
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    emptyProgramView();
    pvButtons.append(returnButton("info", "Add Program", function () {
        history.pushState(
            {
                "view": PROGRAM_VIEW,
                "addProgram": true,
            },
            '',
            '#program/add'
        )
        pv_displayAddProgramForm();
    }));

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
        if (program.isCurrent) {
            programItem.classList.add("active");
        }
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
            history.pushState(
                {
                    "view": PROGRAM_VIEW,
                    "program": this.getAttribute("program-id")
                },
                '',
                `#program/${this.firstChild.textContent}`
            )
            pv_loadProgram(this.getAttribute("program-id"));
        })
        list_container.append(programItem);
    })

    // Append programs to page
    program_container.append(list_container);
    pvContent.append(program_container);
}


// Empties the program view and displays the given program's workouts through the week
// as a tables
async function pv_loadProgram(pId) {
    await fetch(`program/?id=${pId}`)
    
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
            
            pvDescription.append(pDescription);

            // Allow editing program name and description using an edit button
            const editButton = returnButton("info", "Edit", function() {
                history.pushState(
                    {
                        "view": PROGRAM_VIEW,
                        "editProgram": program
                    },
                    '',
                    `#program/${program.name}/edit`
                )
                pv_loadProgramEditForm(program);
            })
            editButton.classList.add("col");

            const btnCont = document.createElement('div');
            btnCont.append(editButton);
            pvButtons.append(btnCont);

            const badgeWrapper = document.createElement('div');
            badgeWrapper.classList.add("row");
            badgeWrapper.setAttribute("style", "font-size: 1rem");

            const currentProgramBadge = document.createElement('span');
            currentProgramBadge.classList.add("col-auto", "badge", "rounded-pill");
            currentProgramBadge.addEventListener('click', async function() {
                await pv_currentProgramBadgeListener(this);
            });
            if (program["isCurrent"]) {
                currentProgramBadge.classList.add("text-bg-success");
                currentProgramBadge.textContent = "Current Program";
                currentProgramBadge.dataset.current = true;
            } else {
                currentProgramBadge.classList.add("text-bg-secondary")
                currentProgramBadge.textContent = "Set as current program";
                currentProgramBadge.dataset.current = false;
            }
            badgeWrapper.append(currentProgramBadge);
            pvHeader.append(badgeWrapper);


            // Create the rest of the containers needed
            const workoutContainer = document.createElement('div');
            workoutContainer.setAttribute("id", "pvWorkoutContainer");
            workoutContainer.dataset.programId = pId;
            workoutContainer.dataset.programName = program.name;

            pvContent.append(workoutContainer);

            const exerciseContainer = document.createElement('div');
            exerciseContainer.setAttribute("id", "pvExerciseContainer");

            const exContMessageContainer = document.createElement('div');
            exContMessageContainer.setAttribute("id", "exerciseContainerMessage");

            exerciseContainer.append(exContMessageContainer);
            pvContent.append(exerciseContainer);

            // // load all the workouts within the program
            // pv_loadWorkouts(pId);
        }
    })
    await pv_loadWorkouts(pId);
}


async function pv_currentProgramBadgeListener(target) {
    const isCurrent = target.dataset.current;
    const pId = document.querySelector('#pvWorkoutContainer').dataset.programId;

    if (isCurrent === "true") {
        const apiResponse = await fetch('program/current/', {
            method: 'DELETE',
            headers: {
                "X-CSRFToken": CSRF_TOKEN
            },
            credentials: 'same-origin'
        });
        const data = await apiResponse.json();
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            target.classList.remove('text-bg-success');
            target.classList.add('text-bg-secondary');
            target.textContent = "Set as Current Program";
            target.dataset.current = false;
        }
    } else {
        const apiResponse = await fetch('program/current/', {
            method: 'POST', 
            headers: {
                "X-CSRFToken": CSRF_TOKEN
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                "id": pId
            })
        });
        const data = await apiResponse.json();
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            target.classList.remove('text-bg-secondary');
            target.classList.add('text-bg-success');
            target.textContent = "Current Program";
            target.dataset.current= true;
        }
    }
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
        history.pushState(
            {
                "view": PROGRAM_VIEW,
            },
            '',
            '#program'
        );
        pv_submitAddProgramForm();
    });
    submitButton.classList.add("align-self-end");

    const cancelButton = returnButton("info", "Cancel", function () {
        history.pushState(
            {
                "view": PROGRAM_VIEW,
            },
            '',
            '#program'
        )
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
        history.pushState(
            {
                "view": PROGRAM_VIEW,
                "program": program.id
            },
            '',
            `#program/${program.name}`
        )
        pv_submitEditProgramForm();
    });
    

    const deleteButton = returnButton("danger", "Delete Program", function() {
        history.replaceState(
            {
                "view": PROGRAM_VIEW
            },
            '',
            '#program'
        )
        pv_deleteProgram(program.id);
    });
    

    const cancelButton = returnButton("info", "Cancel", function () {
        history.pushState(
            {
                "view": PROGRAM_VIEW,
                "program": program.id
            },
            '',
            `#program/${program.name}`
        )
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
async function pv_loadWorkouts(programId) {
    await fetch(`program/${programId}/workouts`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            const workouts = data["workouts"];

            // clear container
            const workoutContainer = document.querySelector('#pvWorkoutContainer');
            workoutContainer.innerHTML = "";

            const exerciseContainer = document.querySelector('#pvExerciseContainer');
            exerciseContainer.innerHTML = "";

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

    const pId = document.querySelector('#pvWorkoutContainer').dataset.programId;
    const pName = document.querySelector('#pvWorkoutContainer').dataset.programName;

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
        if (!window.location.href.endsWith('add-workout')) {
            history.pushState(
                {
                    "view": PROGRAM_VIEW,
                    "program": pId,
                    "addWorkout": {
                        "row": this.getAttribute("id"),
                        "workouts": workouts
                    }
                },
                '',
                `#program/${pName}/add-workout`
            )
        }
        pv_displayWorkoutForms(this, workouts);
    }

    // first, initialize table as blank
    for (var i = 0; i < 7; i++) {
        row = document.createElement('tr');
        row.setAttribute("id", "row-" + i);
        row.dataset.day = i;
        row.dataset.dayName = days[i];

        // set day column
        const day = document.createElement('td');
        day.textContent = days[i];

        // set workout column
        const workout = document.createElement('td');
        workout.setAttribute("id", "row-workout-" + i);
        workout.classList.add("text-center");
        workout.innerHTML = ADD_BUTTON_SVG;

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
            const column = row.querySelector('#row-workout-' + day["dayNum"]);
            column.textContent = workout["name"];

            const removeButton = document.createElement('span');
            removeButton.innerHTML = REMOVE_BUTTON_SVG;
            removeButton.addEventListener('click', function (event) {
                history.replaceState(
                    {
                        "view": PROGRAM_VIEW,
                        "program": pId
                    },
                    '',
                    `#program/${pName}`
                )
                event.stopPropagation();
                pv_removeWorkoutFromTable(this);
            });
            column.append(removeButton);

            // remove the empty row listener
            row.removeEventListener('click', rowEmptyClicked);

            // add new listener to display exercises for a populated row
            row.addEventListener('click', function () {
                let workoutName = this.childNodes[1].textContent.trim();
                if (!(decodeURI(window.location.href).endsWith(workoutName))) {
                    history.pushState(
                        {
                            "view": PROGRAM_VIEW,
                            "program": pId,
                            "workout": this.getAttribute("id")
                        },
                        '',
                        `#program/${pName}/${workoutName}`
                    )
                }
                pv_displayWorkoutExercises(this);
            })
        })
    });

    table.append(body);
    return table;

}


function pv_removeWorkoutFromTable(button) {
    const row = button.parentNode.parentNode;
    const workoutId = row.dataset.workoutId;
    const dayNum = row.dataset.day;
    
    fetch(`workout/${workoutId}/day`, {
        method: 'DELETE',
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
            pv_loadWorkouts(document.querySelector('#pvWorkoutContainer').dataset.programId);
            displayMessage(data.message, true);
        }
    })
}


// Display all the exercises in a workout as a list-group. Erases any existing
// elements inside the "#pvExerciseContainer".
// The parameter "row" is passed by the eventListener while the "days" argument
// is simply an array with days of the week as strings
function pv_displayWorkoutExercises(row) {
    // extract needed data from the passed row
    const day = row.dataset.day;
    const workoutId = row.dataset.workoutId;
    const workoutName = row.querySelector('#row-workout-' + day).childNodes[0].textContent;

    // update container to wipe any previous entries
    const exerciseContainer = document.querySelector('#pvExerciseContainer');
    exerciseContainer.dataset.workoutId = workoutId;
    exerciseContainer.innerHTML = `
        <div id="exerciseContainerHeader" class="row d-flex">
        <div class="display-6 col">${workoutName} workout on ${days[day]}:</div>
        </div>
        <p>Below is a list of all the exercises in the workout:</p>`;
    
    // edit button to allow the user to edit a workout's name
    const editButton = returnButton(
        "info",
        "Edit",
        function () { 
            const pId = document.querySelector('#pvWorkoutContainer').dataset.programId;
            const pName = document.querySelector('#pvWorkoutContainer').dataset.programName;
            history.pushState(
                {
                    "view": PROGRAM_VIEW,
                    "program": pId,
                    "editWorkout": row.getAttribute("id")
                },
                '',
                `#program/${pName}/${workoutName}/edit`
            )
            pv_displayEditWorkoutForm(row);
        }
        );
    editButton.classList.add("col-2", "justify-content-end");
    document.querySelector('#exerciseContainerHeader').append(editButton);

    exerciseContainer.append(pv_returnAddExerciseForm(row));

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
            listGroup.setAttribute("id", "pvExerciseList");

            // Add exercise entries to list
            exercises.forEach(exercise => {
                const item = document.createElement('li');
                item.classList.add(
                    "list-group-item", 
                    "d-flex", 
                    "justify-content-between", 
                    "align-items-start"
                );

                const wrapper = document.createElement('div');
                wrapper.classList.add("ms-2", "me-auto");

                const exDiv = document.createElement('div');
                exDiv.classList.add("fw-bold");
                exDiv.textContent = exercise.name;
                exDiv.addEventListener('click', function () {
                    history.pushState(
                        {
                            "view": EXERCISES_VIEW,
                            "exercise": exercise["id"]
                        },
                        '',
                        `#exercises/${exercise.name}`
                    )
                    toggleView(EXERCISES_VIEW);
                    emptyExerciseView();
                    ev_loadExercise(exercise["id"]);
                });

                wrapper.append(exDiv, exercise.description);
                item.append(wrapper);

                item.dataset.exerciseId = exercise["id"];
                const removeButton = document.createElement('span');
                removeButton.classList.add("badge", "btn-sm", "btn", "btn-outline-danger", "rounded-pill");
                removeButton.textContent = "Remove";
                removeButton.addEventListener('click', function () {
                    pv_removeExerciseFromWorkout(this);
                });
                item.append(removeButton);
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
function pv_displayEditWorkoutForm(row) {
    // extract data from the currently active workout's row
    const day = row.dataset.day;
    const workoutId = row.dataset.workoutId;
    const workoutName = row.querySelector('#row-workout-' + day).childNodes[0].textContent;

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

    const pId = document.querySelector('#pvWorkoutContainer').dataset.programId;
    const pName = document.querySelector('#pvWorkoutContainer').dataset.programName;

    // Initialize buttons
    const deleteButton = returnButton("danger", "Delete Workout", function () {
        history.replaceState(
            {
                "view": PROGRAM_VIEW,
                "program": pId,
            },
            '',
            `#program/${pName}`
        )
        pv_deleteWorkout(workoutId);
    })

    const submitButton = returnButton("info", "Submit", function () {
        history.pushState(
            {
                "view": PROGRAM_VIEW,
                "program": pId,
                "workout": row.getAttribute("id")
            },
            '',
            `#program/${pName}/${workoutName}`
        )
        pv_submitEditWorkoutForm(row);
    })

    const cancelButton = returnButton("info", "Cancel", function () {
        history.pushState(
            {
                "view": PROGRAM_VIEW,
                "program": pId,
                "workout": row.getAttribute("id")
            },
            '',
            `#program/${pName}/${workoutName}`
        )
        pv_displayWorkoutExercises(row);
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
function pv_deleteWorkout(workoutId) {
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
function pv_submitEditWorkoutForm(row) {
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
            pv_loadWorkouts(document.querySelector('#pvWorkoutContainer').dataset.programId)
            .then(() => {
                pv_displayWorkoutExercises(document.querySelector(`#row-` + row.dataset.day));
                displayMessage(data.message, true);
            });
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
function pv_displayWorkoutForms(clickedRow, workouts) {
    const day = clickedRow.dataset.day;
    const rowId = clickedRow.getAttribute("id");
    const exerciseContainer = document.querySelector('#pvExerciseContainer');
    exerciseContainer.innerHTML = `
        <div class="display-6">Add Workout on ${clickedRow.dataset.dayName}:</div>
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

    const pId = document.querySelector('#pvWorkoutContainer').dataset.programId;
    const pName = document.querySelector('#pvWorkoutContainer').dataset.programName;
    const submitWorkoutButton = returnButton("info", "Add Workout", async function () {
        let workoutName = selectField.options[selectField.selectedIndex].textContent.trim();
        await pv_submitWorkoutSelectFieldForm(rowId);
        history.replaceState(
            {
                "view": PROGRAM_VIEW,
                "program": pId,
                "workout": rowId
            },
            '',
            `#program/${pName}/${workoutName}`
        )
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
        async function() {
            let workoutName = document.querySelector('#workout-name').value.trim();
            await pv_submitAddWorkoutForm(day);
            history.replaceState(
                {
                    "view": PROGRAM_VIEW,
                    "program": pId,
                    "workout": rowId
                },
                '',
                `#program/${pName}/${workoutName}`
            )
        }
    ))

    main_container.append("Or add a new workout:", workoutForm);
    exerciseContainer.append(main_container);
}


// Submits the add workout form and reloads the workout table data
async function pv_submitAddWorkoutForm(day) {
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
    await fetch(`workout/`, {
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
            pv_loadWorkouts(programId).then(() => {
                displayMessage(data.message, true);
                document.querySelector('#pvExerciseContainer').innerHTML = "";
            });
        }
    })
}


// Submits the workout select field form and reloads the updated program data
async function pv_submitWorkoutSelectFieldForm(rowId) {
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
    await fetch(`workout/${id}/day`, {
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
            pv_loadProgram(document.querySelector('#pvWorkoutContainer').dataset.programId)
            .then(() => {
                displayMessage(data.message, true);
                pv_displayWorkoutExercises(document.getElementById(rowId));
            });
        }
    })
}


function pv_returnAddExerciseForm(row) {
    const container = document.createElement('div');
    container.setAttribute("id", "pvAddExerciseFormContainer");

    const searchBar = util_returnAutocompleteExerciseSearchForm(
        'pvExerciseSearchBar', 
        async function (target) {
            const exerciseId = target.dataset.exerciseId;
            const workoutId = document.querySelector('#pvExerciseContainer').dataset.workoutId;
            await fetch(`exercise/`, {
                method: 'PUT',
                headers: {
                    "X-CSRFToken": CSRF_TOKEN
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    workoutId: workoutId,
                    exerciseId: exerciseId,
                    editFlag: true
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    displayMessage(data.error, false);
                } else {
                    pv_displayWorkoutExercises(row);
                    displayMessage(data.message, true);
                }
            })
        }
    );
    searchBar.style.display = "none";


    const exerciseForms = document.createElement('div');
    exerciseForms.classList.add("row");
    exerciseForms.setAttribute("id", "pvExerciseForms");

    var bodypartList;

    fetch(`bodypart/all`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        }
        bodypartList = data["bodyparts"];
    });

    const submitButton = returnButton("info", "Submit", function () {
        pv_submitAddExerciseForm(row);
    });
    submitButton.style.display = "none";

    const cancelButton = returnButton("info", "Cancel", function () {
        exerciseForms.innerHTML = "";
        submitButton.style.display = "none";
        cancelButton.style.display = "none";
        searchBar.style.display = "none";
    })
    cancelButton.style.display = "none";

    const addButton = returnButton("info", "Add an Exercise", function () {
        const formContainer = document.createElement('form');
        formContainer.classList.add("exercise-form", "form-control");
        const exName = returnTextInputField(
            "Exercise Name",
            "exercise-name",
            "Give your exercise a suitable name (upto 200 character long)",
            false,
            ""
        )
        
        const bodypartSelectField = pv_returnBodypartChecklist(bodypartList, "pvBodypartChecklist");

        const exDescription = returnTextInputField(
            "Exercise Description",
            "exercise-description",
            "Give a suitable description for the exercise (upto 2000 characters long)",
            true,
            ""
        )
        formContainer.append(exName, bodypartSelectField, exDescription);
        exerciseForms.prepend(formContainer);
        submitButton.style.display = "inline-block";
        cancelButton.style.display = "inline-block";
        searchBar.style.display = "flex";
    });

    container.append(addButton, searchBar, exerciseForms, submitButton, cancelButton);
    return container;
}

function pv_returnBodypartChecklist(bodypartList, containerId) {
    const container = document.createElement('div');
    container.setAttribute("id", containerId);
    container.innerHTML = "<p>Pick bodypart(s):</p>";

    bodypartList.forEach(bodypart => {
        const wrapper = document.createElement('div');
        wrapper.classList.add("form-check", "form-check-inline");

        const inBox = document.createElement('input');
        inBox.classList.add("form-check-input");
        inBox.setAttribute("type", "checkbox");
        inBox.setAttribute("id", bodypart["id"]);
        inBox.setAttribute("value", bodypart["name"]);

        const label = document.createElement('label');
        label.classList.add("form-check-label");
        label.setAttribute("for", bodypart["id"]);
        label.textContent = bodypart["name"];
        wrapper.append(inBox, label);

        container.append(wrapper);
    })

    return container;
}


function pv_submitAddExerciseForm(row) {
    const container = document.querySelector('#pvExerciseForms');
    const forms = container.querySelectorAll('.exercise-form');
    const workoutId = document.querySelector('#pvExerciseContainer').dataset.workoutId;

    var exercises = [];

    forms.forEach(form => {
        var exercise = new Object();
        const name = form.querySelector('#exercise-name').value;
        if (name == '') {
            form.querySelector('#exercise-name').classList.add('is-invalid');
            displayMessage("Exercise name cannot be empty!", false);
            return;
        }
        exercise.name = name;

        const description = form.querySelector('#exercise-description').value;
        exercise.description = description;

        var checked = false;
        var bodyparts = [];
        const checklist = form.querySelectorAll('.form-check-input');
        checklist.forEach(item => {
            if (item.checked) {
                checked = true;
                bodyparts.push(item.getAttribute('id'));
            }
        })
        if (!checked) {
            form.classList.add('is-invalid');
            displayMessage("You must select at least one bodypart!", false);
            return;
        }
        exercise.bodyparts = bodyparts;
        exercises.push(exercise);
    });

    fetch(`exercises/add/`, {
        method: 'POST',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            workoutId: workoutId,
            exercises: exercises
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            pv_displayWorkoutExercises(row);
            displayMessage(data.message, true);
        }
    })

}

function pv_removeExerciseFromWorkout(target) {
    const parent = target.parentNode;
    const exerciseId = parent.dataset.exerciseId;
    const workoutId = document.querySelector('#pvExerciseContainer').dataset.workoutId;
    
    fetch(`workout/exercise/add`, {
        method: 'PUT',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            workoutId: workoutId,
            exerciseId: exerciseId,
            editFlag: false
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            parent.parentNode.removeChild(parent);
            displayMessage(data.message, true);
        }
    })
}