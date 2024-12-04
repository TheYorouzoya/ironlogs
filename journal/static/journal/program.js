/**
 * A Program object representing a workout program sent by the server.
 * @typedef {Object} Program
 * @property {String} id - UUID string representing database ID of the program
 * @property {String} name - name of the program
 * @property {String} description - an extended description of the program
 */

// Initialize program view containers
let pvContainer, pvHeader, pvButtons, pvDescription, pvForms, pvContent, days;

/**
 * Initializes all the Program View main container variables and a days array containing
 * the 7 days of the week as strings.
 */
function pv_init() {
    pvContainer = document.querySelector('#pv-content-container');
    pvHeader = document.querySelector('#program-view-header');
    pvButtons = document.querySelector('#program-view-buttons');
    pvDescription = document.querySelector('#program-view-description');
    pvForms = document.querySelector('#program-view-form-container');
    pvContent = document.querySelector('#program-view-content');
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
}


/**
 * Toggles the visibility of the Program View, empties it, and loads a list of all
 * user programs.
 */
async function loadProgramView() {
    emptyProgramView();
    await pv_loadAllPrograms();

    // display program view
    toggleView(PROGRAM_VIEW);
}


/**
 * Empties all the major Program view containers.
 */
function emptyProgramView() {
    pvHeader.innerHTML = "";
    pvButtons.innerHTML = "";
    pvDescription.innerHTML = "";
    pvForms.innerHTML = "";
    pvContent.innerHTML = "";
}

function hideProgramView() {
    pvContainer.style.display = "none";
}

function showProgramView() {
    pvContainer.style.display = "block";
}

function togglePvExerciseContainer(flag) {
    let display = "none";

    if (flag) display = "block";

    document.querySelector('#pvExerciseContainerWrapper').style.display = display;
}

/*
================================================================================
        <--------------- Program Related Functions --------------->
================================================================================
*/

/**
 * Loads all the user's programs into a list. Clicking on a list element loads the
 * particular workout.
 * 
 * Programs are displayed in a Bootstrap List Group element with the current
 * program marked as active.
 */
async function pv_loadAllPrograms() {
    // fetch all programs
    const apiResponse = await fetch('program/all/')
    const data = await apiResponse.json();
    
    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    emptyProgramView();

    // add an "Add Program" button to allow the user to add programs
    pvButtons.append(util_returnButton("info", "Add New Program", function () {
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

    if (data["programs"] == "") {
        pvDescription.textContent = "You have no programs. Click the 'Add New Program' " +
                                    "button to create a new program.";
        return;
    }

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
        // mark the currently active program
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
    pvDescription.append(program_container);
}


/**
 * Empties the program view and displays the given program's workouts throughout
 * the week in a table.
 * 
 * @param {String} pId program UUID as a string
 */
async function pv_loadProgram(pId) {
    // fetch program details
    const apiResponse =  await fetch(`program/?id=${pId}`);
    const data = await apiResponse.json();

    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    emptyProgramView();

    const program = data["program"]

    pvHeader.textContent = program.name;    // update header

    const pDescription = document.createElement('div');
    pDescription.classList.add("pvProgramDescription");
    pDescription.textContent = program.description;
    // update program description    
    pvDescription.append(pDescription);

    // Allow editing program name and description using an edit button
    const editButton = util_returnButton("info", "Edit", function() {
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

    // add current program badge
    const badgeWrapper = document.createElement('div');
    badgeWrapper.classList.add("row");

    const currentProgramBadge = document.createElement('span');
    currentProgramBadge.classList.add("col-auto", "badge", "rounded-pill");
    currentProgramBadge.addEventListener('click', async function() {
        // clicking the badge sets/removes this program as the current program
        await pv_currentProgramBadgeListener(this);
    });

    // set current badge state
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

    // a workout container to store workout tables
    const workoutContainer = document.createElement('div');
    workoutContainer.setAttribute("id", "pvWorkoutContainer");
    workoutContainer.dataset.programId = pId;
    workoutContainer.dataset.programName = program.name;

    const workoutContainerWrapper = document.createElement('div');
    workoutContainerWrapper.classList.add("col");
    workoutContainerWrapper.append(workoutContainer);

    // exercise container to store exercises within a workout
    const exerciseContainer = document.createElement('div');
    exerciseContainer.setAttribute("id", "pvExerciseContainer");

    const exerciseContainerWrapper = document.createElement('div');
    exerciseContainerWrapper.setAttribute("id", "pvExerciseContainerWrapper");
    exerciseContainerWrapper.setAttribute("style", "display: none;");
    exerciseContainerWrapper.classList.add("col-lg-8");
    exerciseContainerWrapper.append(exerciseContainer);

    const pvContentWrapper = document.createElement('div');
    pvContentWrapper.classList.add("row");

    pvContentWrapper.append(workoutContainerWrapper, exerciseContainerWrapper);

    pvContent.append(pvContentWrapper);

    // // load all the workouts within the program
    await pv_loadWorkouts(pId);
}

/**
 * Toggles the provided program's status as the currently active program.
 * 
 * If the provided program is the current program, remove it as current. Otherwise,
 * set it as the currently active program.
 * 
 * @param {HTMLElement} target the program badge being clicked
 */
async function pv_currentProgramBadgeListener(target) {
    // fetch relevant program details
    const isCurrent = target.dataset.current;
    const pId = document.querySelector('#pvWorkoutContainer').dataset.programId;

    // toggle program state on the server
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
            // update badge on success
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
            // update badge on success
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

/**
 * Empties the program view and displays a form to add a new program to the user.
 */
function pv_displayAddProgramForm() {
    emptyProgramView();                                     // empty view

    pvHeader.textContent = "Add a Program";                 // update header
    
    const programForm = document.createElement('form');     // initialize form
    
    // Initialize Input Fields
    const nameInput = util_returnTextInputField(
        "Program Name", 
        "program-name", 
        "Give your program a name (60 characters long)", 
        false,
        ""
    );

    const descriptionInput = util_returnTextInputField(
        "Program Description", 
        "program-description", 
        "Add a brief description of your program (2000 characters long)", 
        true, 
        ""
    );

    // Initialize buttons
    const submitButton = util_returnButton("info", "Submit", async function () {
        // submit the form
        if (await pv_submitAddProgramForm()) {   // on successful submission
            history.pushState(
                {
                    "view": PROGRAM_VIEW,
                },
                '',
                '#program'
            );
            loadProgramView();
        }
    });

    const cancelButton = util_returnButton("danger", "Cancel", function () {
        // return to program view if user clicks Cancel
        history.pushState(
            {
                "view": PROGRAM_VIEW,
            },
            '',
            '#program'
        )
        loadProgramView();
    });

    const btnCont = document.createElement('div');
    btnCont.classList.add("row");
    
    const submitWrapper = document.createElement('div');
    submitWrapper.classList.add("col");
    submitWrapper.append(submitButton);
    
    const cancelWrapper = document.createElement('div');
    cancelWrapper.classList.add("col", "d-flex", "justify-content-end");
    cancelWrapper.append(cancelButton);

    btnCont.append(submitWrapper, cancelWrapper);

    // Append to form and display
    programForm.append(nameInput, descriptionInput, btnCont);
    pvForms.append(programForm);
}

/**
 * Attempts to submit the add program form.
 * 
 * @returns {Boolean} `true` upon successful submission, `false` otherwise
 */
async function pv_submitAddProgramForm() {
    // Fetch input field values
    const program_name = pvForms.querySelector('#program-name').value;
    const program_description = pvForms.querySelector('#program-description').value;

    // Program name can't be empty
    if (program_name == "") {
        pvForms.querySelector('#program-name').classList.add("is-invalid");
        return false;
    }

    // Attempt to submit form
    const apiResponse = await fetch(`program/`, {
        method: 'POST',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            name: program_name,
            description: program_description
        })
    });
    const data = await apiResponse.json();

    if (data.error) {   // on failure
        displayMessage(data.error, false);
        return false;
    } else {            // on success
        displayMessage(data.message, true);
        return true;
    }
}

/**
 * Empties the program view and loads an Edit Program form, pre-populated with 
 * the program's current details.
 * 
 * @param {Program} program the program to be edited as an object
 */
function pv_loadProgramEditForm(program) {
    emptyProgramView();                                 // empty view

    pvHeader.textContent = "Edit " + program.name;      // update header
    
    const programForm = document.createElement('form');
    
    // Initialize input fields
    const nameInput = util_returnTextInputField(
        "Program Name", 
        "program-name", 
        "Edit the program name (60 characters long)", 
        false,
        program.name
    );

    nameInput.dataset.id = program.id;                  // set program ID for submission

    const descriptionInput = util_returnTextInputField(
        "Program Description", 
        "program-description", 
        "Edit program description (2000 characters long)", 
        true, 
        program.description
    );

    // Submit button
    const submitButton = util_returnButton("info", "Submit", async function () {
        // reload the program on successful submission
        if (await pv_submitEditProgramForm()) {
            history.pushState(
                {
                    "view": PROGRAM_VIEW,
                    "program": program.id
                },
                '',
                `#program/${program.name}`
            )
            pv_loadProgram(program.id);
        }
    });
    
    // Delete button
    const deleteButton = util_returnButton("danger", "Delete Program", async function() {
        // return to default program view state on successful deletion
        if (await pv_deleteProgram(program.id)) {
            history.replaceState(
                {
                    "view": PROGRAM_VIEW
                },
                '',
                '#program'
            )
            emptyProgramView();
            pv_loadAllPrograms();
        }
    });
    
    // Cancel button
    const cancelButton = util_returnButton("info", "Cancel", function () {
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
    
    // intialize button wrappers
    const btnCont = document.createElement('div');
    btnCont.classList.add("row");

    const delCont = document.createElement('div');
    delCont.classList.add("col", "float-left");
    delCont.append(deleteButton);

    const rightbtns = document.createElement('div');
    rightbtns.classList.add("col", "d-flex", "justify-content-end");
    rightbtns.append(submitButton);
    pvButtons.append(cancelButton);
    btnCont.append(delCont, rightbtns);

    // Append everything to view
    programForm.append(nameInput, descriptionInput, btnCont);
    pvForms.append(programForm);
}

/**
 * Attempts to submit the edit program form.
 * 
 * @returns {Boolean} `true` upon successful submission, `false` otherwise.
 */
async function pv_submitEditProgramForm() {
    // Fetch form values
    program_id = pvForms.querySelector('#program-name').parentNode.dataset.id;
    program_name = pvForms.querySelector('#program-name').value;
    program_description = pvForms.querySelector('#program-description').value;

    if (program_name.trim() == "") {
        pvForms.querySelector('#program-name').classList.add("is-invalid");
        displayMessage("Program name cannot be empty!", false);
        return false;
    }

    // Attempt to submit data
    const apiResponse = await fetch(`program/`, {
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
    });
    const data = await apiResponse.json();

    if (data.error) {   // on failure
        displayMessage(data.error, false);
        return false;
    } else {            // on success
        displayMessage(data.message, true);
        return true;
    }
}

// Deletes the given program and loads the program view
async function pv_deleteProgram(id) {
    // sent delete request to server
    const apiResponse = await fetch(`program/?id=${id}`, {
        method: 'DELETE',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin'
    });
    const data = await apiResponse.json();

    if (data.error) {   // on failure
        displayMessage(data.error, false);
        return false;
    } else {            // on success
        displayMessage(data.message, true);
        return true;
    }
}

/*
================================================================================
        <--------------- Workout Related Functions --------------->
================================================================================
*/

/**
 * Loads all the workouts in the given program on a workout table.
 * 
 * Erases any existing elements inside the "pvWorkoutContainer" container.
 * 
 * @param {String} programId UUID string of the parent program
 * @see {@link pv_returnWorkoutTable} for how the workout table is constructed
 */
async function pv_loadWorkouts(programId) {
    // fetch workout data from server
    const apiResponse = await fetch(`program/${programId}/workouts`);
    const data = await apiResponse.json();

    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    const workouts = data["workouts"];

    // clear containers
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
    helptext.classList.add("pv-workout-description");
    helptext.innerHTML = "<p>Each day in your program corresponds to a workout. "
        + "Each workout, then, has a bunch of exercises in it. "
        + "Click on a row to look at all the exercises within the workout.</p>";
    
    workoutContainer.append(helptext);

    // generate workout table and append it
    const table = pv_returnWorkoutTable(workouts);
    table.setAttribute("id", "pv-workout-table");

    const tableWrapper = document.createElement("div");
    tableWrapper.classList.add("workout-table");

    tableWrapper.append(table);
    workoutContainer.append(tableWrapper);

    togglePvExerciseContainer(false);
}

/**
 * A day object sent by the server.
 * @typedef {Object} Day
 * @property {String} day - A string denoting what day of the week this is
 * @property {Number} dayNum - day number (0-6) according to python datetime
 */

/**
 * A workout object sent by the server.
 * 
 * @typedef {Object} Workout
 * @property {String} id - UUID string for the workout
 * @property {String} name - workout name
 * @property {Day[]} days - all the days the workout is on
 */

/**
 * Returns a table populated with the given workouts.
 * 
 * Each row in the table corresponds to a day of the week. Also, adds listeners to
 * rows so that clicking on a row displays all the exercises for that workout. If
 * a workout does not exist, allow the user to add one instead.
 * 
 * @param {Workout[]} workouts an array of workout objects
 * @returns {HTMLElement} the finished workout table assembly as described
 */
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

    // fetch program details for updating history state
    const pId = document.querySelector('#pvWorkoutContainer').dataset.programId;
    const pName = document.querySelector('#pvWorkoutContainer').dataset.programName;


    // Listener for when an empty row is clicked
    var rowEmptyClicked = function () {
        // prevent duplicate history pushes
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

    // first, initialize a blank table
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
        workout.querySelector('svg').classList.add("add-workout-button");

        row.append(day, workout);

        // set the empty row listener
        row.addEventListener('click', rowEmptyClicked);
        body.append(row);
    }

    // then, put each workout in the row it belongs to
    workouts.forEach(workout => {
        workout["days"].forEach(day => {    // a workout can be on multiple days
            // select appropriate row
            row = body.querySelector('#row-' + day["dayNum"]);
            // set workout field
            row.dataset.workoutId = workout["id"];
            
            // replace empty column with the workout
            const column = row.querySelector('#row-workout-' + day["dayNum"]);
            column.textContent = workout["name"];

            var rowFullClicked = function () {
                let workoutName = this.childNodes[1].textContent.trim();
                // prevent duplicate history pushes
                if (!(decodeURI(window.location.href).endsWith(workoutName))) {
                    history.pushState(
                        {
                            "view": PROGRAM_VIEW,
                            "program": pId,
                            "workout": this.getAttribute("id")
                        },
                        '',
                        `#program/${pName}/${workoutName}`
                    );
                }
                pv_displayWorkoutExercises(this);
            }

            // add button to remove workout from the program
            const removeButton = document.createElement('span');
            removeButton.innerHTML = REMOVE_BUTTON_SVG;
            removeButton.querySelector('svg').classList.add("remove-workout-button");
            removeButton.addEventListener('click', function (event) {
                // stop event propagation so that the row listener doesn't activate
                event.stopImmediatePropagation();

                const currentRow = this.parentNode.parentNode;

                if (pv_removeWorkoutFromTable(this)) {  // on successful removal
                    // remove workout listener
                    currentRow.removeEventListener('click', rowFullClicked);
                    // add empty row listener
                    currentRow.addEventListener('click', rowEmptyClicked);
                    // erase dataset from row
                    currentRow.removeAttribute('data-workout-id');
                    // replace column with add button
                    this.parentNode.innerHTML = ADD_BUTTON_SVG;
                }
            });
            column.append(removeButton);

            // remove the empty row listener
            row.removeEventListener('click', rowEmptyClicked);

            // add new listener to display exercises for a populated row
            row.addEventListener('click', rowFullClicked)
        })
    });

    table.append(body);
    return table;

}

/**
 * Attempts to remove the given button's workout from the workout table.
 * 
 * Removal from the table amounts to removing a particular day from the workout.
 * 
 * @param {HTMLElement} button the remove button which the user clicked
 * @returns {Boolean} `true` upon successful submission, `false` otherwise
 */
async function pv_removeWorkoutFromTable(button) {
    // fetch workout ID and day
    const row = button.parentNode.parentNode;
    const workoutId = row.dataset.workoutId;
    const dayNum = row.dataset.day;

    const exerciseContainer = document.querySelector('#pvExerciseContainer');
    currentWorkoutId = exerciseContainer.dataset.workoutId;
    currentWorkoutDay = exerciseContainer.dataset.day;
    
    // submit delete day request to server
    const apiResponse = await fetch(`workout/${workoutId}/day`, {
        method: 'DELETE',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            day: dayNum
        })
    });
    const data = await apiResponse.json();

    if (data.error) {   // on failure
        displayMessage(data.error, false);
        return false;
    }
    // on success
    displayMessage(data.message, true);

    if (workoutId === currentWorkoutId && dayNum === currentWorkoutDay) {
        togglePvExerciseContainer(false);
    }

    return true;

}


/**
 * Displays all the exercises in a workout as a list-group.
 * 
 * Erases any existing elements inside the 'pvExerciseContainer'.
 * 
 * @param {HTMLElement} row the workout row whose exercises need to be loaded
 */
async function pv_displayWorkoutExercises(row) {
    // extract needed data from the passed row
    const day = row.dataset.day;
    const workoutId = row.dataset.workoutId;
    const workoutName = row.querySelector('#row-workout-' + day).childNodes[0].textContent;

    // update container to wipe any previous entries
    const exerciseContainer = document.querySelector('#pvExerciseContainer');
    exerciseContainer.dataset.workoutId = workoutId;
    exerciseContainer.dataset.day = day;
    exerciseContainer.innerHTML = `
        <div id="exerciseContainerHeader" class="row">
            <div class="display-6 col">${workoutName} workout on ${days[day]}:</div>
        </div>
        <div class="workout-helptext">
            <p>Below is a list of all the exercises in the workout. Click on an exercise to go to
                the exercise's page.</p>
        </div>`;
    
    // edit button to allow the user to edit a workout's name
    const editButton = util_returnButton(
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

    const editButtonWrapper = document.createElement('div');
    editButtonWrapper.classList.add("workout-edit-button", "col-2", "justify-content-end", "d-flex");
    editButtonWrapper.append(editButton);
    document.querySelector('#exerciseContainerHeader').append(editButtonWrapper);

    // exerciseContainer.append(pv_returnAddExerciseForm(row));

    // Fetch all the exercises from the server
    const apiResponse = await fetch(`workout/${workoutId}/exercises`);
    const data = await apiResponse.json();
    
    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

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
        exDiv.classList.add("fw-bold", "pvWorkoutExerciseLink");
        exDiv.textContent = exercise.name;

        // clicking on an exercise in the list takes the user to the exercise page
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
            ex_loadExercise(exercise["id"]);
        });

        wrapper.append(exDiv, exercise.description);
        item.append(wrapper);

        item.dataset.exerciseId = exercise["id"];

        // initialize remove button
        const removeButton = document.createElement('span');
        removeButton.classList.add("badge", "btn-sm", "btn", "btn-outline-danger", "rounded-pill");
        removeButton.textContent = "Remove";

        // clicking on the remove button removes the exercise from the workout
        removeButton.addEventListener('click', function () {
            pv_removeExerciseFromWorkout(this);
        });
        item.append(removeButton);
        listGroup.append(item);
    })

    exerciseContainer.append(listGroup, pv_returnAddExerciseForm(row));
    togglePvExerciseContainer(true);
}


/*
====================================
--> Workout Form Related Functions
====================================
*/

/**
 * Display the edit workout form to allow the user to change a workout's name or
 * delete the workout. Also empties the 'pvExerciseContainer' removing any
 * existing workout exercises.
 * 
 * The parameter `row` is passed by the eventListener and coresponds to the
 * currently active workout's row in the workout table.
 * 
 * @param {HTMLElement} row the current workout row that the user clicked
 */
function pv_displayEditWorkoutForm(row) {
    // extract data from the currently active workout's row
    const day = row.dataset.day;
    const workoutId = row.dataset.workoutId;
    const workoutName = row.querySelector('#row-workout-' + day).childNodes[0].textContent;

    // empty the exercise container and append a header
    const exerciseContainer = document.querySelector('#pvExerciseContainer');
    exerciseContainer.innerHTML = `
        <div id="exerciseContainerHeader" class="row d-flex">
        <div class="display-6 col">Edit ${workoutName} workout:</div>
        </div>`;

    // Initialize edit workout form
    const form = document.createElement('form');
    form.classList.add("form-control");
    form.setAttribute("id", "editWorkoutForm");
    form.dataset.workoutId = workoutId;

    const nameField = util_returnTextInputField(
        "Workout Name",
        "workout-name",
        "New workout name (60 characters long):",
        false,
        workoutName
    )

    const pId = document.querySelector('#pvWorkoutContainer').dataset.programId;
    const pName = document.querySelector('#pvWorkoutContainer').dataset.programName;

    // Initialize buttons
    const deleteButton = util_returnButton("danger", "Delete Workout", async function () {
        // successful deletion reloads the workouts
        if (await pv_deleteWorkout(workoutId)) {
            history.replaceState(
                {
                    "view": PROGRAM_VIEW,
                    "program": pId,
                },
                '',
                `#program/${pName}`
            )
            document.querySelector('#pvExerciseContainer').innerHTML = "";
            pv_loadWorkouts(pId);
        }        
    })

    const submitButton = util_returnButton("info", "Submit", async function () {
        // successful submission reloads the workouts table and the workout
        if (await pv_submitEditWorkoutForm(row)) {
            history.pushState(
                {
                    "view": PROGRAM_VIEW,
                    "program": pId,
                    "workout": row.getAttribute("id")
                },
                '',
                `#program/${pName}/${workoutName}`
            );
            await pv_loadWorkouts(pId);
            pv_displayWorkoutExercises(document.querySelector(`#row-` + row.dataset.day));
        }
    })

    const cancelButton = util_returnButton("info", "Cancel", function () {
        // clicking Cancel shows the workout's exercises again
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
    rightbtns.setAttribute("id", "pvWkEdFrmRBtns");
    rightbtns.classList.add("col", "d-flex", "justify-content-end");
    rightbtns.append(submitButton, cancelButton);
    btnCont.append(delCont, rightbtns);

    form.append(nameField, btnCont);

    const formWrapper = document.createElement('div');
    formWrapper.setAttribute("id", "pvWorkoutEditFormWrapper");
    formWrapper.append(form);
    exerciseContainer.append(formWrapper);
}


/**
 * Attempts to delete the given workout from the server.
 * 
 * @param {String} workoutId UUID string of the workout to be deleted
 * @returns {Boolean} `true` upon successful deletion, `false` otherwise.
 */
async function pv_deleteWorkout(workoutId) {
    if (workoutId == "") {
        displayMessage("Workout ID cannot be empty", false);
        return false;
    }

    // attempt deletion
    const apiResponse = await fetch(`workout/?id=${workoutId}`, {
        method: 'DELETE',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin'
    });
    const data = await apiResponse.json();

    if (data.error) {   // on failure
        displayMessage(data.error, false);
        return false;
    } else {            // on success
        displayMessage(data.message, true);
        return true;
    }
}


/**
 * Attempts to submit the edit workout form to the server.
 * 
 * @param {HTMLElement} row the workout's row in the workout table
 * @returns {Boolean} `true` upon successful submission, `false` otherwise
 */
async function pv_submitEditWorkoutForm(row) {
    const workoutId = row.dataset.workoutId;
    const nameField = document.querySelector('#workout-name');
    const workoutName = nameField.value;

    if (workoutName == "") {
        nameField.classList.add("is-invalid");
        return false;
    }

    // attempt to submit
    const apiResponse = await fetch(`workout/`, {
        method: 'PUT',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            id: workoutId,
            name: workoutName
        })
    });
    const data = await apiResponse.json();

    if (data.error) {   // on failure
        displayMessage(data.error, false);
        return false;
    } else {            // on success
        displayMessage(data.message, true);
        return true;
    }
}


/**
 * Displays a pair of workout forms to the user to add a new workout to the
 * program. Empties the 'pvExerciseContainer' removing any existing elements.
 * 
 * The first form allows the user to select an existing workout to fill the day
 * slot while the second one allows adding a new workout.
 * 
 * The parameter `clickedRow` is passed by the eventListener and corresponds to the
 * currently active workout's row in the workout table.
 * 
 * @param {HTMLElement} clickedRow  the clicked row in the workout table
 * @param {Workout[]} workouts      workout array to be used in generating select
 *                                  field options
 */
function pv_displayWorkoutForms(clickedRow, workouts) {
    // fetch necessary variables
    const day = clickedRow.dataset.day;
    const rowId = clickedRow.getAttribute("id");
    const exerciseContainer = document.querySelector('#pvExerciseContainer');
    
    const pId = document.querySelector('#pvWorkoutContainer').dataset.programId;
    const pName = document.querySelector('#pvWorkoutContainer').dataset.programName;
    
    exerciseContainer.innerHTML = `
        <div class="display-6 pvExerciseHeader">Add Workout on ${clickedRow.dataset.dayName}:</div>
        <div id="pvExerciseHelptext"> </div>
        `;

    const main_container = document.createElement('div');
    main_container.setAttribute("id", "pvWorkoutFormContainer");

    if (workouts.length > 0) {
        // a select field where the user can pick an existing workout
        const sl_wrapper = document.createElement('div');
        sl_wrapper.setAttribute("id", "pvWkFmSlWrapper");

        const helpText = document.createElement("div");
        helpText.textContent = "Choose from an existing workout:";
        sl_wrapper.append(helpText);

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
        let row = document.createElement('option');
        row.setAttribute("selected", "true");
        row.textContent = "Select an existing workout";

        selectField.append(row);

        let counter = 0;
        workouts.forEach(workout => {   // Append all existing workouts as options
            row = document.createElement('option');
            row.setAttribute("value", counter);
            row.textContent = workout["name"];
            row.dataset.workoutId = workout["id"];
            row.dataset.day = day;

            selectField.append(row);
            counter++;
        });
        
        const submitWorkoutButton = util_returnButton("info", "Add Workout", async function () {
            // on successful submission, reload updated program data
            let workoutName = selectField.options[selectField.selectedIndex].textContent.trim();
            if (await pv_submitWorkoutSelectFieldForm()) {
                history.replaceState(
                    {
                        "view": PROGRAM_VIEW,
                        "program": pId,
                        "workout": rowId
                    },
                    '',
                    `#program/${pName}/${workoutName}`
                );
                await pv_loadProgram(pId);
                pv_displayWorkoutExercises(document.getElementById(rowId));
            }
        });

        sl_Container.append(sl_label, selectField, submitWorkoutButton);
        sl_wrapper.append(sl_Container);
        main_container.append(sl_wrapper);
    }

    

    // a form to add a new workout to the program on the selected day
    const workoutForm = document.createElement('form');
    workoutForm.classList.add("form-control");

    workoutForm.append(util_returnTextInputField(
        "Workout Name:",
        "workout-name",
        "Give your workout a name (60 characters long)",
        false,
        ""
    ))

    workoutForm.append(util_returnButton(
        "info", 
        "Add New Workout",
        async function() {
            // on successful addition, reload workout table data with the new workout
            let workoutName = document.querySelector('#workout-name').value.trim();
            if (await pv_submitAddWorkoutForm(day)) {
                history.replaceState(
                    {
                        "view": PROGRAM_VIEW,
                        "program": pId,
                        "workout": rowId
                    },
                    '',
                    `#program/${pName}/${workoutName}`
                );
                await pv_loadProgram(pId);
                pv_displayWorkoutExercises(document.getElementById(rowId));
                // document.querySelector('#pvExerciseContainer').innerHTML = "";
            }
        }
    ))

    const workoutFormHelptext = document.createElement('div');
    workoutFormHelptext.setAttribute("id", "pvWkFmHelptext");
    if (workouts.length > 0)
        workoutFormHelptext.textContent = "Or add a new workout:";


    const workoutFormWrapper = document.createElement('div');
    workoutFormWrapper.setAttribute("id", "pvWkFmWrapper");
    workoutFormWrapper.append(workoutForm);

    main_container.append(workoutFormHelptext, workoutFormWrapper);
    exerciseContainer.append(main_container);

    togglePvExerciseContainer(true);
}


/**
 * Attempts to submit the add workout form to the server.
 * 
 * @param {Number} day the day on which to add the workout (python day)
 * @returns {Boolean} `true` upon successful submission, `false` otherwise
 */
async function pv_submitAddWorkoutForm(day) {
    // Fetch form values
    const nameField = document.querySelector('#workout-name');
    const programId = document.querySelector('#pvWorkoutContainer').dataset.programId;
    const workoutName = nameField.value;

    // Empty workout name is invalid
    if (workoutName == "") {
        nameField.classList.add("is-invalid");
        return false;
    }

    // Attempt to submit data
    const apiResponse = await fetch(`workout/`, {
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
    });
    const data = await apiResponse.json();

    if (data.error) {   // on failure
        displayMessage(data.error, false);
        return false;
    } else {            // on success
        displayMessage(data.message, true);
        return true;
    }
}


/**
 * Attempts to submit the workout select field form to the server.
 * 
 * @returns {Boolean} `true` upon successful submission, `false` otherwise
 */
async function pv_submitWorkoutSelectFieldForm() {
    const selectField = document.querySelector('#workoutSelectMenu');
    
    // Default option is invalid
    if (selectField.selectedIndex == 0) {
        selectField.classList.add("is-invalid");
        return false;
    }

    // Fetch form values
    const workout = selectField.options[selectField.selectedIndex];
    const id = workout.dataset.workoutId;
    const dayNum =  workout.dataset.day;

    // Attemp to submit data
    const apiResponse = await fetch(`workout/${id}/day`, {
        method: 'POST',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            day: dayNum
        })
    });
    const data = await apiResponse.json();
    
    if (data.error) {   // on failure
        displayMessage(data.error, false);
        return false;
    } else {            // on success
        displayMessage(data.message, true);
        return true;
    }
}

/**
 * Returns an exercise form to add a new exercise to the currently selected workout.
 * 
 * The exercise form consists of an exercise search bar and an Add Exercise Form.
 * Clicking an exercise in the search results immediately adds that exercise to the
 * current workout.
 * 
 * The user can click the "Add An Exercise" button multiple times to add more
 * exercise forms. Clicking Submit will submit all the forms at once. Note that the
 * server does not do partial updates, so all forms need to be resubmitted if any
 * particular form is invalid.
 * 
 * The Search Bar and the Exercise Form are hidden until the user first clicks
 * the "Add An Exercise" button.
 * 
 * @param {HTMLElement} row the currently selected workout's row in the exercise table
 * @returns {HTMLElement} the exercise form assembly as described
 */
function pv_returnAddExerciseForm(row) {
    const container = document.createElement('div');
    container.setAttribute("id", "pvAddExerciseFormContainer");

    // initialize exercise search bar
    const searchBar = util_returnAutocompleteExerciseSearchForm(
        'pvExerciseSearchBar', 
        async function (target) {   // on clicking an exercise search result
            if (await pv_addExerciseToWorkout(target.dataset.exerciseId)) {
                // upon successful addition, reload exercise data for the workout
                pv_displayWorkoutExercises(row);
            }
        }
    );

    const searchBarWrapper = document.createElement("div");
    searchBarWrapper.classList.add("exercise-search-bar");
    searchBarWrapper.append(searchBar);
    // hide search bar until user clicks "Add An Exercise" button
    searchBarWrapper.style.display = "none";

    // initialize exercise forms
    const exerciseForms = document.createElement('div');
    exerciseForms.setAttribute("id", "pvExerciseForms");

    var bodypartList;
    // fetch bodypart list from the server for the checkbox field
    fetch(`bodypart/all`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        }
        bodypartList = data["bodyparts"];
    });

    const submitButton = util_returnButton("info", "Submit", async function () {
        if (await pv_submitAddExerciseForm()) { // on successful submission
            pv_displayWorkoutExercises(row);    // reload exercise data for the workout
        }
    });
    // hide submit button until the user clicks "Add An Exercise"
    submitButton.style.display = "none";

    const cancelButton = util_returnButton("danger", "Cancel", function () {
        // clicking Cancel hides all the forms and buttons
        exerciseForms.innerHTML = "";
        submitButton.style.display = "none";
        cancelButton.style.display = "none";
        searchBarWrapper.style.display = "none";
    })
    // hide Cancel button until the user clicks "Add An Exercise"
    cancelButton.style.display = "none";

    const footerButtonWrapper = document.createElement('div');
    footerButtonWrapper.append(submitButton, cancelButton);
    footerButtonWrapper.classList.add("exercise-form-footer", "d-flex", "justify-content-end");

    // The "Add An Exercise" button
    const addButton = util_returnButton("info", "Add An Exercise", function () {
        // add the exercise form
        exerciseForms.prepend(pv_returnExerciseForm(bodypartList));
        
        // display all the buttons and the search bar
        submitButton.style.display = "inline-block";
        cancelButton.style.display = "inline-block";
        searchBarWrapper.style.display = "block";
    });

    const addButtonWrapper = document.createElement('div');
    addButtonWrapper.classList.add("add-exercise-button");
    addButtonWrapper.append(addButton);

    container.append(addButtonWrapper, searchBarWrapper, exerciseForms, footerButtonWrapper);
    return container;
}

/**
 * A Bodypart object sent by the server
 * @typedef {Object} Bodypart
 * @property {String} id    UUID string of the bodypart
 * @property {String} name  name of the bodypart
 */


/**
 * Returns an exercise form where the user can add a name, description, and select
 * one or more bodyparts for the exercise from a checklist.
 * 
 * @param {Bodypart[]} bodypartList a list of bodyparts fetched from the server
 * @returns {HTMLElement} an exercise form as described
 */
function pv_returnExerciseForm(bodypartList) {
    const formContainer = document.createElement('form');
    formContainer.classList.add("exercise-form", "form-control");

    const exName = util_returnTextInputField(
        "Exercise Name",
        "exercise-name",
        "Give your exercise a suitable name (upto 200 character long)",
        false,
        ""
    );
    
    const bodypartChecklist = pv_returnBodypartChecklist(bodypartList, "pvBodypartChecklist");

    const exDescription = util_returnTextInputField(
        "Exercise Description",
        "exercise-description",
        "Give a suitable description for the exercise (upto 2000 characters long)",
        true,
        ""
    );

    formContainer.append(exName, bodypartChecklist, exDescription);
    return formContainer;
}

/**
 * Attempts to add the given exercise to the currently selected workout.
 * 
 * @param {String} exerciseId UUID string of the exercise
 * @returns {Boolean} `true` upon successful submission, `false` otherwise
 */
async function pv_addExerciseToWorkout (exerciseId) {
    if (exerciseId == "") {
        displayMessage("Exercise Id cannot be empty!", false);
        return false;
    }

    // fetch current workout ID
    const workoutId = document.querySelector('#pvExerciseContainer').dataset.workoutId;
     
    const apiResponse = await fetch(`workout/exercise/add`, {
        method: 'POST',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            workoutId: workoutId,
            exerciseId: exerciseId,
            editFlag: true
        })
    });
    const data = await apiResponse.json();

    if (data.error) {   // on failure
        displayMessage(data.error, false);
        return false;
    } else {            // on success
        displayMessage(data.message, true);
        return true;
    }
}

/**
 * Returns a checklist of bodyparts where bodyparts can be marked/checked-off
 * by clicking the box next to a bodypart.
 * 
 * Each bodypart contains additional information in the datasets and id attributes
 * which is fetched when submitting an exercise form.
 * 
 * @param {Bodypart[]} bodypartList an array of bodyparts fetched from the server
 * @param {String} containerId ID to put on the checklist container
 * @returns {HTMLElement} the checklist assembly as described
 */
function pv_returnBodypartChecklist(bodypartList, containerId) {
    const container = document.createElement('div');
    container.setAttribute("id", containerId);
    container.innerHTML = "<p>Pick bodypart(s):</p>";

    bodypartList.forEach(bodypart => {
        // initialize each bodypart's checkbox-label assembly
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

/**
 * Attempts to submit all the exercise forms in the 'pvExerciseForms' container.
 * 
 * @returns {Boolean} `true` upon successful submission, `false` otherwise
 */
async function pv_submitAddExerciseForm() {
    const container = document.querySelector('#pvExerciseForms');
    // fetch all the forms
    const forms = container.querySelectorAll('.exercise-form');
    const workoutId = document.querySelector('#pvExerciseContainer').dataset.workoutId;

    let exercises = [];     // list to pool all the exercise data into

    forms.forEach(form => {
        let exercise = new Object();

        // fetch required fields
        const name = form.querySelector('#exercise-name').value;

        if (name == '') {   // exercise name cannot be empty
            form.querySelector('#exercise-name').classList.add('is-invalid');
            displayMessage("Exercise name cannot be empty!", false);
            return false;
        }
        
        exercise.name = name;

        const description = form.querySelector('#exercise-description').value;
        exercise.description = description;

        let checked = false;    // flag to denote at least one bodypart is checked
        let bodyparts = [];     // list to hold bodyparts

        const checklist = form.querySelectorAll('.form-check-input');
        checklist.forEach(item => {
            if (item.checked) { // append checked items to list
                checked = true;
                bodyparts.push(item.getAttribute('id'));
            }
        })

        if (!checked) {         // user must select at least one bodypart
            form.classList.add('is-invalid');
            displayMessage("You must select at least one bodypart!", false);
            return false;
        }

        exercise.bodyparts = bodyparts;
        exercises.push(exercise);
    });

    // attempt to submit pooled data to server
    const apiResponse = await fetch(`exercises/add/`, {
        method: 'POST',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            workoutId: workoutId,
            exercises: exercises
        })
    });
    const data = await apiResponse.json();
    
    if (data.error) {   // on failure
        displayMessage(data.error, false);
        return false;
    } else {            // on success
        displayMessage(data.message, true);
        return true;
    }
}

/**
 * Attempts to remove the target exercise from the current workout.
 * 
 * @param {HTMLElement} target the target exercise in the exercise list
 */
function pv_removeExerciseFromWorkout(target) {
    // fetch exercise details
    const exerciseContainer = target.parentNode;
    const exerciseId = exerciseContainer.dataset.exerciseId;
    const workoutId = document.querySelector('#pvExerciseContainer').dataset.workoutId;
    
    fetch(`workout/exercise/add`, {
        method: 'POST',
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
        if (data.error) {   // on failure
            displayMessage(data.error, false);
        } else {            // on success
            // remove exercise from DOM
            exerciseContainer.parentNode.removeChild(exerciseContainer);
            displayMessage(data.message, true);
        }
    })
}