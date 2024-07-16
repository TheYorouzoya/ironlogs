// various main containers for the view
let evHeader, evForms, evContent;

/**
 * Initalizes the various main containers for the view to their respective
 * variables.
 */
function ev_init() {
    evHeader = document.querySelector('#evHeader');
    evForms = document.querySelector('#evForms');
    evContent = document.querySelector('#evContent');
}

/**
 * Loads the exercise view, emptying any previous contents.
 */
async function loadExerciseView() {
    // display journal view
    toggleView(EXERCISES_VIEW);

    emptyExerciseView();
    await ev_loadAllExercisesTable();
}


/**
 * Empties the exercise view's main containers' contents and listeners.
 */
function emptyExerciseView() {
    evHeader.innerHTML = "";
    evForms.innerHTML = "";
    evContent.innerHTML = "";
}


/**
 * Loads all of current user's exercises in a table (sorted alphabetically).
 */
async function ev_loadAllExercisesTable() {
    const DEFAULT_PAGE_NUMBER = 1;
    const DEFAULT_QUERY = "";

    ev_loadDefaultForms();
    await ev_loadExerciseTableWithGivenQuery(DEFAULT_QUERY, DEFAULT_PAGE_NUMBER);
}


/**
 * Loads the exercise table filtered according to given search query parameters 
 * and page number.
 * 
 * 
 * The supplied query should have the following structure:
 * 
 *  '[QUERY_TYPE]=[QUERY_ID]'
 * 
 * where QUERY_TYPE can be: ```'bodypart'```, ```'workout'```, or ```'program'```, 
 * each corresponding to a column in the exercise table (i.e., whether to filter
 * exercises according to a bodypart, a workout, or a program). Multiple filter
 * queries can be supplied, granted they are separated by an ```&```.
 * 
 * QUERY_ID is the uuid corresponding to the query.
 * 
 * Supplying an empty string as query will load all exercises by default.
 * 
 * For a supplied query and page number, the server returns an array {Exercise} objects
 * along with a "hasPrevious" and "hasNext" field indicating if previous or next
 * pages exist.
 * 
 * @param {String} filterQuery  the query string formatted as [QUERY_TYPE]=[QUERY_ID]
 * @param {Number} pageNum      the required page number
 * @example
 * ```JavaScript
 * // query with a single bodypart filter
 * const query = "bodypart=9b452868-8ce0-45e7-b97f-95315018d4a4";
 * const page = 1;
 * // loads exercise table with all exercises that have the given bodypart
 * ev_loadExerciseTableWithGivenQuery(query, page);
 * ```
 * @example
 * ```JavaScript
 * // query with multiple filters
 * const bodyQuery = "bodypart=9b452868-8ce0-45e7-b97f-95315018d4a4";
 * const programQuery = "program=06d01fb5-bce0-46fe-bf8f-763f6b5972c5";
 * const query = `${bodyQuery}&${programQuery}`;
 * const page = 1;
 * // loads exercise table with all exercises that have the given bodypart and
 * // are part of the given program
 * ev_loadExerciseTableWithGivenQuery(query, page);
 * ```
 * 
 */
async function ev_loadExerciseTableWithGivenQuery(filterQuery, pageNum) {
    // fetch exercise data from the server
    const apiRepsosne = await fetch(`exercises/filter/?pageNum=${pageNum}&${filterQuery}`);
    const data = await apiRepsosne.json();
    
    // display error message if something goes wrong and bail
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    // pass the data to the table generator
    ev_loadExerciseTable(data, pageNum, filterQuery);
}



/**
 * Generates the exercise table from the given exercise data and appends it to the
 * main container after emptying it.
 * 
 * @param {Exercise[]} ex_Data  an array containing exercise objects
 * @param {Number} currentPage  the current page number 
 * @param {String} currentQuery the current query string formatted as [QUERY_TYPE]=[QUERY_ID]
 * 
 * @see {@link ev_loadExerciseTableWithGivenQuery} for details regarding query structure
 */
function ev_loadExerciseTable(ex_Data, currentPage, currentQuery) {
    // empty the main container
    evContent.innerHTML = "";

    // button that resets the exercise table to show all exercises
    const resetButton = returnButton("info", "All Exercises", function () {
        // prevent duplicate history pushes
        if (!decodeURI(window.location.href).trim().endsWith('#exercises')) {
            // push default view state
            history.pushState(
                {
                    "view": EXERCISES_VIEW,
                },
                '',
                `#exercises`
            )
        }
        ev_loadAllExercisesTable();
    });
    evContent.append(resetButton);

    // table container to hold the table
    const tContainer = document.createElement('div');
    tContainer.setAttribute("id", "evTableContainer");

    // the table itself
    const table = document.createElement('table');
    table.classList.add("table", "table-hover");
    
    // initialize table header
    const tHead = document.createElement('thead');
    tHead.innerHTML = `
        <tr>
            <th scope="col">Exercise</th>
            <th scope="col">Body Part</th>
            <th scope="col">Workout</th>
            <th scope="col">Program</th>
        </tr>
    `;

    // Initialize the body
    const tBody = document.createElement('tbody');
    // For each exercise in exercise data
    ex_Data["exercises"].forEach(exercise => {
        // initialize table row and cells
        const row = document.createElement('tr');
        let td = document.createElement('td');
        
        // initailize cell container with exercise name and id
        const cont = document.createElement('div');
        cont.dataset.exerciseId = exercise["id"];
        cont.textContent = exercise["name"];

        td.append(cont);
        row.append(td);
        
        // load the exercise if the row is clicked
        row.addEventListener('click', function () {
            // extract id and name from clicked row
            const exId = this.firstChild.firstChild.dataset.exerciseId;
            const exName = this.firstChild.firstChild.textContent.trim();
            // push history state for the exercise being clicked
            history.pushState(
                {
                    "view": EXERCISES_VIEW,
                    "exercise": exId
                },
                '',
                `#exercises/${exName}`
            )
            // load exercise
            ev_loadExercise(exId);
        });
        
        // initialize all bodypart cells in the exercise
        td = document.createElement('td');
        exercise["bodyparts"].forEach(bodypart => {
            td.append(ev_returnExerciseTableDataCell(bodypart, "bodypart"));
        });
        row.append(td);

        // initialize all workout cells in the exercise
        td = document.createElement('td');
        exercise["workouts"].forEach(workout => {
            td.append(ev_returnExerciseTableDataCell(workout, "workout"));
        });
        row.append(td);

        // initialize all program cells in the exercise
        td = document.createElement('td');
        exercise["programs"].forEach(program => {
            td.append(ev_returnExerciseTableDataCell(program, "program"));
        });
        row.append(td);
        
        // append row to body
        tBody.append(row);
    });

    // append all table contents
    table.append(tHead, tBody);
    tContainer.append(table);

    // initialize "Next" and "Previous" button container
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add("d-flex", "justify-content-end");

    // If a previous page in the query exists
    if (ex_Data["hasPrevious"]) {
        // initialize and append previous button
        const previous = returnButton("info", "Previous", function () {
            // Browser link says "#exercises/all/page=[PAGE_NUM]" if we're in default view 
            // Otherwise the current query and page number are displayed instead
            let linkPrefix = (currentQuery == "") ? "all/" : `query?${currentQuery}&`;
            
            // push history state
            history.pushState(
                {
                    "view": EXERCISES_VIEW,
                    "exerciseQuery": currentQuery,
                    "exercisePage": currentPage - 1
                },
                '',
                `#exercises/${linkPrefix}page=${currentPage - 1}`
            );

            // load table with previous page entries
            ev_loadExerciseTableWithGivenQuery(currentQuery, currentPage - 1);
        });
        buttonContainer.append(previous);
    }

    // If a next page in the query exists
    if (ex_Data["hasNext"]) {
        // Initialize and append next button
        const next = returnButton("info", "Next", function () {
            // Browser link says "#exercises/all/page=[PAGE_NUM] if we're in default view"
            // Otherwise the current query and page number are displayed instead
            let linkPrefix = (currentQuery == "") ? "all/" : `query?${currentQuery}&`
            
            history.pushState(
                {
                    "view": EXERCISES_VIEW,
                    "exerciseQuery": currentQuery,
                    "exercisePage": currentPage + 1
                },
                '',
                `#exercises/${linkPrefix}page=${currentPage + 1}`
            );

            // load table with next page entries
            ev_loadExerciseTableWithGivenQuery(currentQuery, currentPage + 1);
        });
        buttonContainer.append(next);
    }

    tContainer.append(buttonContainer);
    evContent.append(tContainer);
}


/**
 * Returns a cell for the exercise table, populated with the given data. When clicked,
 * load the table with the given data as a query parameter, i.e., if the given
 * data is a program, load all exercises which are part of this program.
 * 
 * @param {Workout | Program | Bodypart} data        a Workout, Program, or Bodypart object 
 * @param {String}                       queryPrefix prefix indicating whether the data is
 *                                                   a workout, program, or a bodypart               
 */
function ev_returnExerciseTableDataCell(data, queryPrefix) {
    // Initialize container
    const container = document.createElement('span');
    container.dataset.id = data["id"];
    container.textContent = data["name"];

    // Add listener to load the table with this object as a query parameter
    container.addEventListener('click', function (event) {
        // stop proapagation so that the row listener doesn't activate
        event.stopPropagation();

        const QUERY = `${queryPrefix}=${this.dataset.id}`;
        const PAGE_NUM = 1;
        
        history.pushState(
            {
                "view": EXERCISES_VIEW,
                "exerciseQuery": QUERY,
                "exercisePage": PAGE_NUM
            },
            '',
            `#exercises/query?${QUERY}&page=${PAGE_NUM}`
        )
        
        // load table with new query parameters
        ev_loadExerciseTableWithGivenQuery(QUERY, PAGE_NUM);
    });
    return container;
}


/**
 * Loads the exercise lookup search bar into the evForms container.
 * 
 * The search bar fetches 7 most relevant exercises for the query as it being typed
 * in. Clicking on an exercise in the list takes the user to the exercise's main page.
 */
function ev_loadDefaultForms() {
    // empty container
    evForms.innerHTML = "";

    // listener which loads the exercise when a search result is clicked
    const searchBarListener = function (target) {
        const exerciseId = target.dataset.exerciseId;
        ev_loadExercise(exerciseId);
    };

    // generate search bar with listener and append
    const searchForm = util_returnAutocompleteExerciseSearchForm("evSearchResults", searchBarListener);
    evForms.append(searchForm);
}


/**
 * Loads the given exercise's main page.
 * 
 * The page contains a form, a header, and a body container.The header contains
 * a heading with exercise name as title, badges for each bodypart below it, and
 * "Edit" and "All Exercises" buttons on the right to edit and navigate to all
 * exercises table respectively.
 * 
 * The body contains an extended description of the exercise, as provided by the
 * user, and a graph charting the last 20 entries of the exercise.
 * 
 * @param {String} exerciseId UUID of the exercise
 */
async function ev_loadExercise(exerciseId) {
    // fetch exercise data from the server
    const apiResponse = await fetch(`exercise/?id=${exerciseId}`)
    const data = await apiResponse.json();

    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    // empty view
    emptyExerciseView();
    
    // initialize exercise header
    const exercise = data["exercise"];
    const header = document.createElement('div');
    header.setAttribute("id", "evExerciseHeader");
    header.classList.add("row");

    // initialize first part of header
    const subhead1 = document.createElement('div');
    header.setAttribute("id", "evExerciseHeaderLeft");
    subhead1.classList.add("col");

    // initialize heading
    const heading = document.createElement('div');
    heading.setAttribute("id", "evExerciseName");
    heading.dataset.exerciseId = exerciseId;
    heading.classList.add("display-6");
    heading.textContent = exercise["name"];
    
    // initialize bodypart badges
    const bodyparts = document.createElement('div');
    bodyparts.setAttribute("id", "evExerciseBodyparts");
    exercise["bodypart"].forEach(bodypart => {
        const span = document.createElement('span');
        span.classList.add("badge", "rounded-pill", "text-bg-info");
        span.dataset.bodypartId = bodypart["id"];
        span.textContent = bodypart["name"];
        bodyparts.append(span);
    });

    // append heading and bodyparts
    subhead1.append(heading, bodyparts);

    // initialize second part of header
    const subhead2 = document.createElement('div');
    const wrapper = document.createElement('div');

    // initialize edit exercise button
    const editExerciseButton = returnButton("info", "Edit", function() {
        ev_displayEditExerciseForm();
    });
    wrapper.append(editExerciseButton);

    // initialize button which returns the user to all exercises table
    const allExercisesButton = returnButton("info", "All Exercises", function () {
        history.pushState(
            {
                "view": EXERCISES_VIEW,
            },
            '',
            '#exercises/all'
        );
        ev_loadAllExercisesTable();
    });
    wrapper.append(allExercisesButton);
    
    // append wrapper to header
    subhead2.append(wrapper);
    subhead2.classList.add("d-flex", "justify-content-end", "col");
    header.append(subhead1, subhead2);

    // initialize exercise body
    const body = document.createElement('div');

    // initialize exercise description
    const exerciseDescription = document.createElement('div');
    exerciseDescription.setAttribute("id", "evExerciseDescription");
    exerciseDescription.innerHTML = exercise["description"];
    body.append(exerciseDescription);

    // initialize exercise graph
    const graphContainer = document.createElement('div');
    graphContainer.setAttribute("id", "exerciseChartContainer");
    const chart = document.createElement('canvas');
    chart.setAttribute("id", "exerciseChart");
    graphContainer.append(chart);
    body.append(graphContainer);

    evContent.append(header, body);
    displayExerciseChart(exerciseId);
}


/**
 * Erases any previous contents in evForms container and displays an edit exercise
 * form there, prepopulated with the exercise's current data.
 * 
 * 
 * The edit form is just a pre-populated version of the "Add New Exercise" form.
 */
async function ev_displayEditExerciseForm() {
    // clear container
    evForms.innerHTML = "";

    // fetch exercise name, id, description, and bodypart from the main page
    const name = document.querySelector('#evExerciseName').textContent.trim();
    const id = document.querySelector('#evExerciseName').dataset.exerciseId;
    const description = document.querySelector('#evExerciseDescription').textContent.trim();

    // fetch all the bodypart badges
    const bodyparts = document.querySelector('#evExerciseBodyparts').querySelectorAll('span');
    
    let bodypartList = [];
    // push each bodypart badge's id into the list
    bodyparts.forEach(bodypart => bodypartList.push(bodypart.dataset.bodypartId));

    // fetch the list of all bodyparts form the server
    const allBodyparts = await async function () {
        const apiResponse = await fetch(`bodypart/all`);
        const data = await apiResponse.json();
        
        if (data.error) {
            displayMessage(data.error, false);
            return [];
        }
        
        return data["bodyparts"];
    } ();

    // start initializing the edit form
    const formContainer = document.createElement('form');
    formContainer.classList.add("form-control");
    formContainer.setAttribute("id", "evEditExerciseForm");
    formContainer.dataset.exerciseId = id;

    const exName = returnTextInputField(
        "Exercise Name:",
        "evEditExerciseNameField",
        "Give your exercise a new name (up to 200 characters long)",
        false,
        name
    );

    // initialize bodypart select field
    const bodypartSelectField = document.createElement('div');
    bodypartSelectField.setAttribute("id", "evBodypartSelectField");
    bodypartSelectField.innerHTML = "<p>Pick bodypart(s):</p>";

    // initialize all the bodyparts in the field
    allBodyparts.forEach(bodypart => {
        const wrapper = document.createElement('div');
        wrapper.classList.add("form-check", "form-check-inline");

        const inBox = document.createElement('input');
        inBox.classList.add("form-check-input");
        inBox.setAttribute("type", "checkbox");
        inBox.setAttribute("id", bodypart["id"]);
        inBox.setAttribute("value", bodypart["name"]);
        // pre-mark all the bodyparts the exercise currently has
        if (bodypartList.includes(bodypart.id)) {
            inBox.checked = true;
        }

        const label = document.createElement('label');
        label.classList.add("form-check-label");
        label.setAttribute("for", bodypart["id"]);
        label.textContent = bodypart["name"];
        wrapper.append(inBox, label);

        bodypartSelectField.append(wrapper);
    })


    const exDescription = returnTextInputField(
        "Exercise Description:",
        "evEditExerciseDescriptionField",
        "Give a new suitable description for the exercise (upto 2000 characters long)",
        true,
        description
    );

    // initialize Submit and Cancel buttons
    const btnContainer = document.createElement('div');
    btnContainer.classList.add("row");

    const btnWrapper = document.createElement('div');
    btnWrapper.classList.add("justify-content-end", "d-flex");

    const submitButton = returnButton("info", "Submit", async function () {
        if (await ev_submitEditExerciseForm()) {    // upon successful submit
            ev_loadExercise(id);                    // reload exercise page
        }
    });

    const cancelButton = returnButton("info", "Cancel", function () {
        ev_loadExercise(id);
    });

    btnWrapper.append(submitButton, cancelButton);
    btnContainer.append(btnWrapper);

    formContainer.append(exName, bodypartSelectField, exDescription, btnContainer);
    evForms.append(formContainer);
    evContent.innerHTML = "";
}

/**
 * Submits the exercise edit form and displays a success/failure message.
 * 
 * Submission is cancelled if any of the fields are invalid, and the form is marked
 * with a bootstrap "is-invalid" class. For a valid submit, the user must provide
 * 
 */
async function ev_submitEditExerciseForm() {
    // fetch fields
    const form = document.querySelector('#evEditExerciseForm');
    const name = form.querySelector('#evEditExerciseNameField').value.trim();
    const id = form.dataset.exerciseId;
    const description = form.querySelector('#evEditExerciseDescriptionField').value.trim();

    // validate name field
    if (name.length <= 0) {
        form.querySelector('#evEditExerciseNameField').classList.add("is-invalid");
        displayMessage("Exercise name cannot be empty!", false);
        return;
    }

    // validate bodyparts
    let checked = false;
    var selectedBodyparts = [];

    const checklist = form.querySelectorAll('.form-check-input');
    checklist.forEach(item => {
        if (item.checked) {     // if bodypart is selected
            checked = true;
            // push selected bodypart's id into the selectedBodyparts array
            selectedBodyparts.push(item.getAttribute('id'));
        }
    });

    if (!checked) {     // if no bodyparts were selected
        form.classList.add('is-invalid');
        displayMessage("You must select at least one bodypart!", false);
        return false;
    }

    // attempt to submit form
    const apiRepsosne = await fetch('exercise/',{
        method: 'PUT',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            id: id,
            name: name,
            description: description,
            bodyparts: selectedBodyparts
        })
    });

    const data = await apiRepsosne.json();
    
    if (data.error) {   // if submission fails
        displayMessage(data.error, false);
        return false;
    }

    // on successful submit, reload exercise page
    await ev_loadExercise(id);
    displayMessage(data.message, true);
    return true;
}


/**
 * Displays a Chart.js chart of the exercise's last 50 entries on a X-Y line graph
 * showcasing intensity vs entry timestamp data.
 * 
 * @param {String} exerciseId UUID of the exercise
 */
async function displayExerciseChart(exerciseId) {
    // fetch entry data
    const apiResponse = await fetch(`entry/all/${exerciseId}`)
    const data = await apiResponse.json();
    
    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    // don't initialize the chart if entry data is empty
    if (data["entries"] == false) {
        document.querySelector('#exerciseChartContainer').textContent = "No journal entries exist for this exercise.";
        return;
    }

    const entries = data["entries"];
    // initialize chart
    new Chart(
        document.getElementById('exerciseChart'),
        {
            type: 'line',
            data: {
            labels: entries.map(entry => entry.date),
            datasets: [
                {
                label: 'Exercise Intensity (in kgs)',
                data: entries.map(entry => entry.intensity),
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
                }
            ]
            },
            options: {
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                y: {
                    beginAtZero: true
                }
                }
            }
        }
    );
}