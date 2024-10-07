const JOURNAL_VIEW      = 0;
const PROGRAM_VIEW      = 1;
const EXERCISES_VIEW    = 2;
const ENTRIES_VIEW      = 3;

const CLOSE_BUTTON_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="min-width: 24px"  fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
    </svg>
`;

const EDIT_BUTTON_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="min-width: 24px" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
        <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
    </svg>
`;

const ADD_BUTTON_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="min-height: 20px; min-width: 20px" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
    </svg>
`;

const REMOVE_BUTTON_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="min-width:24px" fill="currentColor" class="bi bi-dash-circle" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
        <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>
    </svg>
`;

const CARET_DOWN_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="min-width:24px" fill="currentColor" class="bi bi-caret-down" viewBox="0 0 16 16">
        <path d="M3.204 5h9.592L8 10.481zm-.753.659 4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659"/>
    </svg>
`

document.addEventListener('DOMContentLoaded', async function() {
    // initialize all views and their starting listeners
    initializeViewListeners();
    jv_init();
    en_init();
    ev_init();
    pv_init();
    an_init();

    // if a history state exists
    if (history.state != null) {
        processHistory(history.state);
    } else {
        // By default, load the journal view
        history.replaceState({"view": JOURNAL_VIEW}, '', '#home');
        loadJournalView();
    }
    
    window.addEventListener('popstate', async function (event) {
        if (event.state) {
            processHistory(history.state);
        } else {
            loadJournalView();
        }
    })
});


/**
 * Initializes all the navbar listeners to toggle the respective views.
 */
function initializeViewListeners() {
    // Entry View Listener
    document.querySelector('#entries').addEventListener('click', () => {
        if (history.state != null && !window.location.href.endsWith('#entries'))
            history.pushState({"view": ENTRIES_VIEW}, '', '#entries');
        loadEntriesView();
    });

    // Journal View Listener
    document.querySelector('#journal').addEventListener('click', () => {
        if (history.state != null && !window.location.href.endsWith('#home'))
            history.pushState({"view": JOURNAL_VIEW}, '', '#home');
        loadJournalView();
    });
    
    // Exercise View Listener
    document.querySelector('#exercises').addEventListener('click', () => {
        if (history.state != null && !window.location.href.endsWith('#exercises/all'))
            history.pushState({"view": EXERCISES_VIEW}, '', '#exercises/all');
        loadExerciseView();
    });
    
    // Program View Listener
    document.querySelector('#program').addEventListener('click', () => {
        if (history.state != null && !window.location.href.endsWith('#program'))
            history.pushState({"view": PROGRAM_VIEW}, '', '#program');
        loadProgramView();
    });
}


/**
 * Toggles the given view's visibility to "block" and hides the remaining views.
 * 
 * The views are listed as constants with the following values:
 * 
 *  JOURNAL_VIEW = 0
 *  
 *  PROGRAM_VIEW = 1
 *  
 *  EXERCISES_VIEW = 2
 *  
 *  ENTRIES_VIEW = 3
 * 
 * @param {Number} viewIndex the view index as stated above
 */
function toggleView(viewIndex) {
    var viewValues = ["none", "none", "none", "none"];
    viewValues[viewIndex] = "block";

    document.querySelector('#journal-view').style.display = viewValues[JOURNAL_VIEW];
    document.querySelector('#program-view').style.display = viewValues[PROGRAM_VIEW];
    document.querySelector('#exercises-view').style.display = viewValues[EXERCISES_VIEW];
    document.querySelector('#entries-view').style.display = viewValues[ENTRIES_VIEW];
}


/**
 * Displays the given message as a Bootstrap toast.
 * 
 * If the successFlag is set to True, the toast color is green. Otherise, the 
 * color is red, indicating an error or failure.
 * 
 * The toast is always displayed in the top middle portion of the screen. The user can
 * click the 'X' to close the toast.
 * 
 * @param {String}  message      the message to be displayed
 * @param {Boolean} successFlag  whether the message is a success message or an error
 */
function displayMessage(message, successFlag) {
    const message_container = document.querySelector('#message');
    // Clear any previous messages
    message_container.innerHTML = "";

    // initialize message div
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(
        "toast",
        "align-items-center",
        "border-0"
    );
    messageDiv.setAttribute("role", "alert");
    messageDiv.setAttribute("aria-live", "assertive");
    messageDiv.setAttribute("aria-atomic", "true");
    messageDiv.setAttribute("id", "liveToast");
    messageDiv.setAttribute("autohide", "false");

    // set color according to successFlag
    if (successFlag) {
        messageDiv.classList.add("text-bg-success");
    } else {
        messageDiv.classList.add("text-bg-danger");
    }

    // initialize toast body
    const wrapper = document.createElement('div');
    wrapper.classList.add("d-flex");
    const toastBody = document.createElement('div');
    toastBody.classList.add("toast-body");
    toastBody.textContent = message;

    // initialize close button
    const closeBtn = document.createElement('button');
    closeBtn.classList.add("btn-close", "btn-close-white", "me-2", "m-auto");
    closeBtn.setAttribute("type", "button");
    closeBtn.setAttribute("data-bs-dismiss", "toast");
    closeBtn.setAttribute("aria-label", "Close");
    
    wrapper.append(toastBody, closeBtn);
    messageDiv.append(wrapper);
    message_container.append(messageDiv);

    // display toast to user
    bootstrap.Toast.getOrCreateInstance(messageDiv).show();
}


/**
 * Returns an HTML text input field initialized with the given parameters.
 * 
 * The assembly consists of a text input field (either regular or a textArea), an
 * accomplanying label, a help text underneath stating what is required, and an
 * optional pre-fill value.
 * 
 * @param   {String}      labelText      text to be displayed above the input field
 * @param   {String}      fieldId        ID to be set on the input field
 * @param   {String}      helpText       text to be displayed below the input field
 * @param   {Boolean}     textAreaFlag   whether the input field is a textarea or not
 * @param   {String}      preFillValue   text to be populated into the input field
 * @returns {HTMLElement}                a completed input field assembly as described above
 */
function returnTextInputField(labelText, fieldId, helpText, textAreaFlag, preFillValue) {
    // initialize main container
    const container = document.createElement('div');
    container.classList.add("mb-3");

    // initialize label
    const label = document.createElement('label');
    label.classList.add("form-label");
    label.setAttribute("for", fieldId);
    label.textContent = labelText;

    // initialize input field based on textAreaFlag
    var input;
    if (textAreaFlag) {
        input = document.createElement('textarea');
        input.setAttribute("rows", "5");
    } else {
        input = document.createElement('input');
    }

    input.classList.add("form-control");
    input.setAttribute("id", fieldId);
    input.setAttribute("aria-describedby", fieldId + "-HelpBlock");
    // fill input field with pre-fill value
    input.value = preFillValue;

    // initialize help text
    const help_block = document.createElement('div');
    help_block.classList.add("form-text");
    help_block.setAttribute("id", fieldId + "-HelpBlock");
    help_block.textContent = helpText;

    // assemble and return
    container.append(label, input, help_block);
    return container;
}

/**
 * Return a Bootstrap button with the given specifications.
 * 
 * The passed listener function is called as is without any arguments. The caller is
 * advised to assign an ID attribute to use the button as an anchor point.
 * 
 * @param {String}   buttonType      button outline type according to Bootstrap spec
 * @param {String}   buttonText      text to be displayed on the button
 * @param {Function} buttonListener  function which executes when the button is clicked
 * @returns 
 */
function returnButton(buttonType, buttonText, buttonListener) {
    const button = document.createElement('div');
    button.classList.add("btn", "btn-outline-" + buttonType);
    button.textContent = buttonText;
    button.addEventListener('click', () => {
        buttonListener();
    })
    return button;
}

/**
 * Clears any pending messages/toasts in the message container.
 */
function clearMessages() {
    const message_container = document.querySelector('#message');
    // Clear any previous messages
    message_container.innerHTML = "";
}


/**
 * Returns an autocomplete search bar where the user can lookup all their exercises.
 * 
 * Displays the seven most relevant search results underneath the search bar. Clicking
 * on a result fires up the provided function with the target result element as a
 * parameter.
 * 
 * @param {String}   formId            div in which to dump the search results in
 * @param {Function} listenerFunction  function which gets called when a search result
 *                                     is clicked
 * @returns {HTMLElement}   the search bar assembly as described above
 * @see {@link util_fetchExerciseSearchResults} for how the exercises are searched and
 * populated.
 */
function util_returnAutocompleteExerciseSearchForm(formId, listenerFunction) {
    // initalize form
    const searchForm = document.createElement('form');
    searchForm.classList.add("row", "form-control", "search-container");
    searchForm.textContent = "Lookup Exercise:";

    // initialize input field
    const searchInput = document.createElement('input');
    searchInput.classList.add("form-control");
    searchInput.setAttribute("type", "text");
    searchInput.setAttribute("autocomplete", "off");
    searchInput.setAttribute("placeholder", "Search Exercise");
    searchInput.setAttribute("aria-label", "exercise search bar");
    
    // initialize search result div
    const searchResults = document.createElement('div');
    searchResults.setAttribute("id", formId);
    searchResults.classList.add("search-results");

    // fetch exercise results as the user types a query
    searchInput.addEventListener('keyup', function () {
        util_fetchExerciseSearchResults(this.value, formId, listenerFunction);
    });

    searchForm.append(searchInput, searchResults);
    return searchForm;
}


/**
 * Fetches the 7 most relevant exercises which match the given search query and
 * populates them into the given ID's container.
 * 
 * On clicking a search result, the provided listenr function is called with the
 * clicked search result as a parameter.
 * 
 * @param {String}   searchQuery        the query string to search exercises with
 * @param {String}   formId             the ID of the container where the results
 *                                      need to be displayed
 * @param {Function} listenerFunction   the function which gets called when a search
 *                                      result is clicked
 * 
 */
async function util_fetchExerciseSearchResults(searchQuery, formId, listenerFunction) {
    // fetch relevant exercises from the server
    const apiResponse = await fetch(`search/exercises/?q=${searchQuery}`);
    const data = await apiResponse.json();
    
    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    // initialize result list
    const container = document.getElementById(formId);
    const results = data["results"]
    const resultList = document.createElement('ul');
    resultList.classList.add("list-group", "list-group-flush");

    // populate list with exercise results
    results.forEach(exercise => {
        const item = document.createElement('li');
        item.classList.add("list-group-item", "list-group-item-action");
        item.dataset.exerciseId = exercise["id"];
        item.textContent = exercise["name"];
        item.addEventListener('click', function () {
            // empty serach bar once an exercise is clicked
            container.parentNode.getElementsByTagName('input')[0].value = "";
            container.classList.remove("visible");
            listenerFunction(this);
        })
        resultList.append(item);
    })

    // empty any previous results
    container.innerHTML = "";
    if (results.length <= 0) {
        container.classList.remove("visible");
    } else {
        container.classList.add("visible");
    }
    container.append(resultList);
}

// Create numeric input fields for an exercise
/**
 * Returns a numeric input field to be used inside an exercise entry form.
 * 
 * This function is primarily called everytime an exercise entry form is created.
 * 
 * @param {String} fieldType  indicates the type of field to generate. Also used as
 *                            placeholder for the input field. 
 * @returns {HTMLElement}     the input field assembly as described above
 */
function util_returnExerciseInputFieldsForm(fieldType) {
    // initialize input field container
    const container = document.createElement('div');
    container.classList.add("col");

    // initialize input field
    const setField = document.createElement('input');
    setField.classList.add("form-control", fieldType);
    setField.setAttribute("type", "number");
    setField.setAttribute("min", 0);

    if (fieldType === "Intensity") {
        // if fieldType is intensity, allow decimal input in increments of 0.5
        setField.setAttribute("step", "0.5");
        setField.setAttribute("placeholder", "Weight");
    } else {
        // otherwise, only positive integers are allowed
        setField.setAttribute("step", "1");
        setField.setAttribute("placeholder", fieldType);
    }

    container.append(setField);
    return container;
}


/**
 * Validates the given elements by checking that they are not empty.
 * 
 * This function is only called upon submitting an exercise entry form.
 * 
 * @param {HTMLElement[]} elements array of elements to be validated
 * @returns {Boolean} `true` if the elements are non-empty, `false` otherwise
 */
function util_validateEntries(elements) {
    flag = true;
    elements.forEach(container => {
        if (container.value == "") {
            flag = false;
            container.classList.add("is-invalid");
            const feedback = document.createElement('div');
            feedback.classList.add("col-auto", "invalid-feedback");
            feedback.innerHTML = "Field cannot be empty";
            container.parentNode.append(feedback);
        }
    })

    return flag;
}

/**
 * Attempts to submit the given exercise entries on the given date to server.
 * 
 * Displays a success or failure message to the user upon completion.
 * 
 * @param {Exercise[]} entries an array of exercise entries
 * @param {String}     date    a date string formatted as 'YYYY-MM-DD'
 */
async function util_submitEntries(entries, date) {
    // attempt to submit
    let apiResponse = await fetch('entries/add', {
        method: 'POST',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            exercises: entries,
            date: date
        })
    });
    let data = await apiResponse.json();

    // display appropriate error/success message
    if (data.error) {
        displayMessage(data.error, false);
    } else {
        displayMessage(data.message, true);
    }
}

/**
 * Returns an autocomplete search bar where the user can lookup all their exercises
 * and workouts.
 * 
 * Displays the four most relevant search results (for each workout/exercise) underneath
 * the search bar. Clicking on a result invokes the provided function with the 
 * target result element as a parameter.
 * 
 * This function works exactly the same way as the {@link util_returnAutocompleteExerciseSearchForm}
 * function except it fetches workouts as well as exercises.
 * 
 * @param {String}   formId            div in which to dump the search results in
 * @param {Function} listenerFunction  function which gets called when a search result
 *                                     is clicked
 * @returns {HTMLElement}   the search bar assembly as described above
 * @see {@link util_fetchWorkoutExerciseSearchResults} for how the workouts and exercises
 * are searched and populated.
 */
function util_returnAutocompleteWorkoutExerciseSearchForm(formId, formListener) {
    // initialize form container
    const searchForm = document.createElement('form');
    searchForm.classList.add("form-control", "search-container");
    searchForm.textContent = "Add Workout or Exercise:";

    // initialize input field
    const searchInput = document.createElement('input');
    searchInput.classList.add("form-control");
    searchInput.setAttribute("type", "text");
    searchInput.setAttribute("autocomplete", "off");
    searchInput.setAttribute("placeholder", "Search");
    searchInput.setAttribute("aria-label", "workout and exercise search bar");

    const searchResults = document.createElement('div');
    searchResults.setAttribute("id", formId);
    searchResults.classList.add("search-results");
    
    searchInput.addEventListener('keyup', function () {
        // fetch search results as the user types in their search query
        util_fetchWorkoutExerciseSearchResults(this.value, formId, formListener);
    });

    searchForm.append(searchInput, searchResults);
    return searchForm;
}


async function util_fetchWorkoutExerciseSearchResults(searchQuery, formId, formListener) {
    // fetch data from the server
    const apiResponse = await fetch(`search/workoutandexercises/?q=${searchQuery}`);
    const data = await apiResponse.json();
    
    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    // initialize form container, data fields, and result list
    const container = document.getElementById(formId);
    const workouts = data["workouts"];
    const exercises = data["exercises"];
    const resultList = document.createElement('ul');
    resultList.classList.add("list-group", "list-group-flush");

    // if results contain more than one workout
    if (workouts.length > 0) {
        // initialize workout header partition
        const header = document.createElement('div');
        header.textContent = "Workouts:";
        header.classList.add("search-header");
        resultList.append(header);

        // append all the workouts
        workouts.forEach(workout => {
            const item = document.createElement('li');
            item.classList.add("list-group-item", "list-group-item-action");
            item.dataset.id = workout["id"];
            item.textContent = workout["name"];
            item.addEventListener('click', function () {
                // empty the search bar if a workout is clicked
                container.parentNode.getElementsByTagName('input')[0].value = "";
                container.classList.remove("visible");
                formListener(this, true);
            })
            resultList.append(item);
        })
    }

    // if results contain more than one exercise
    if (exercises.length > 0) {
        // initialize exercise header partition
        const header = document.createElement('div');
        header.textContent = "Exercises:";
        header.classList.add("search-header");
        resultList.append(header);

        // append all the exercises
        exercises.forEach(exercise => {
            const item = document.createElement('li');
            item.classList.add("list-group-item", "list-group-item-action");
            item.dataset.id = exercise["id"];
            item.textContent = exercise["name"];
            item.addEventListener('click', function () {
                // empty the search bar if an exercise is clicked
                container.parentNode.getElementsByTagName('input')[0].value = "";
                container.classList.remove("visible");
                formListener(this, false);
            })
            resultList.append(item);
        })
    }

    // empty any previous search results
    container.innerHTML = "";
    if ((workouts.length + exercises.length) <= 0) {
        container.classList.remove("visible");
    } else {
        container.classList.add("visible");
    }
    container.append(resultList);
}


function util_returnBulkExerciseEntryForms(exercises, closeButtonListener) {
    let animationCounter = 0;
    let forms = [];
    exercises.forEach(exercise => {
        const form = util_returnExerciseEntryForm(exercise, closeButtonListener);
        form.setAttribute("style", `--animation-order: ${animationCounter++}`);
        forms.push(form);
    });
    return forms;
}


/**
 * Returns an exercise entry form for the given exercise.
 * 
 * Attaches the given listener to the close button which, when clicked, removes
 * the form from the DOM.
 * 
 * @param {Exercise} exercise             the form's exercise object
 * @param {Function} closeButtonListener  function which is invoked when the close
 *                                        button is clicked
 * @returns {HTMLElement} the exercise entry form
 */
function util_returnExerciseEntryForm(exercise, closeButtonListener) {
    // initialize containers
    const mainCont = document.createElement('div');
    mainCont.classList.add("form-control", "d-flex");

    const formContainer = document.createElement('div');
    formContainer.classList.add("col");

    const buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add("col-1");

    // initialize close button
    const closeButton = document.createElement('div');
    closeButton.classList.add("d-flex", "justify-content-end");
    closeButton.innerHTML = CLOSE_BUTTON_SVG;

    closeButton.addEventListener('click', function () {
        closeButtonListener(this);
    });

    buttonWrapper.append(closeButton);

    // initialize fields
    const exNameLabel = document.createElement('div');
    exNameLabel.textContent = `${exercise.name}:`;

    const exerciseForm = document.createElement('form');
    exerciseForm.dataset.exerciseId = exercise.id;
    exerciseForm.classList.add("row", "exercise-form");

    // fetch relevant input fields
    exerciseForm.append(util_returnExerciseInputFieldsForm("Sets"));
    exerciseForm.append(util_returnExerciseInputFieldsForm("Reps"));
    exerciseForm.append(util_returnExerciseInputFieldsForm("Intensity"));

    formContainer.append(exNameLabel, exerciseForm);

    mainCont.append(formContainer, buttonWrapper);
    mainCont.classList.add("entry-form");

    return mainCont;
}


/**
 * Attempts to submit all entry forms within the given container.
 * 
 * Entry forms are first validated to determine that they are non-empty.
 * 
 * @param {String} formId ID of the form container
 * @returns {Boolean} `true` on a successful submission, `false` otherwise
 */
async function util_submitEntriesForm(formId) {
    // initailize form container and fetch all forms
    const formContainer = document.getElementById(formId);
    const forms = formContainer.querySelectorAll('form');

    let valid = true;
    // validate each form
    forms.forEach(container => {
        sets = container.querySelector('.Sets');
        reps = container.querySelector('.Reps');
        intensity = container.querySelector('.Intensity');

        valid = util_validateEntries([sets, reps, intensity]);
    })

    // if all the forms were valid
    if (valid) {
        data = [];
        forms.forEach(container => {
            // collect form data into an exercise object
            var exercise = new Object();
            exercise.id = container.dataset.exerciseId;
            exercise.sets = container.querySelector('.Sets').value;
            exercise.reps = container.querySelector('.Reps').value;
            exercise.intensity = container.querySelector('.Intensity').value;
            data.push(exercise);
        })

        // submit data to server
        let submission = await util_submitEntries(data, formContainer.dataset.day);
        return true;
        
    }
    return false;
}