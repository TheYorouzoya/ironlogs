/**
 * Initializes entry view's calendar range search submit button with a listener.
 */
function en_init() {
    document.querySelector('#entries-form').addEventListener('submit', event => {
        event.preventDefault();
        // fetch start and end dates
        const startDate = document.querySelector('#entriesStartDate').value;
        const endDate = document.querySelector('#entriesEndDate').value;
        
        history.pushState(
            {
                "view": ENTRIES_VIEW,
                "range": {
                    "start": startDate,
                    "end": endDate
                },
                "calendar": document.querySelector('#calendar-current-date').dataset.anchorDate
            },
            '',
            `#entries/start=${startDate}&end=${endDate}`
        )
        // submit the ranges and load entries
        en_submitEntriesRangeForm();
    });
}

/**
 * Empties the entry view and loads the default entry view state.
 * 
 * Default entry view consists of a calendar, a range search form, and an entries
 * container.
 */
async function loadEntriesView() {
    // toggle view and empty
    toggleView(ENTRIES_VIEW);
    emptyEntriesView();

    // load calendar widget
    en_loadCalendar(new Date());

    // fetch this week's entries
    const apiResponse = await fetch(`entries/range/`)
    const data = await apiResponse.json();

    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    // display entry data
    en_populateEntriesHeader("This week's entries:");
    en_populateEntries(data);
}

/**
 * Empties all the main containers in the Entries View.
 */
function emptyEntriesView() {
    document.querySelector('#entries-header').innerHTML = "";
    document.querySelector('#entries-search-bar').innerHTML = "";
    document.querySelector('#entries-container').innerHTML = "";
}


// Populate the entries container (a bootsrap accordion) with the entries contained 
// in the data object
/**
 * Empties the entries container and populates it with the provided entry data.
 * 
 * The container holds a list of Bootstrap accordions, with each list element
 * corresponding to a date, i.e., all the entries in a particular day are grouped
 * into one accordion container.
 * 
 * @param {Entry[]} data an array of entry objects previously fetched from the server
 */
function en_populateEntries(data) {
    // Empty the current container
    document.querySelector('#entries-container').innerHTML = "";
   
    // Initialize accordion
    const accordion = document.createElement('div');
    accordion.classList.add('accordion');
    accordion.setAttribute("data-bs-theme", "dark");

    // for each day's entries in the data
    data["payload"].forEach(day => {
        // accordion item to hold the entries
        const item = document.createElement('div');
        item.classList.add('accordion-item');

        // header to hold the particular day's date
        const header = document.createElement('h2');
        header.classList.add('accordion-header');
        
        // button to expand and collapse the item
        const button = document.createElement('button');
        button.classList.add("accordion-button", "collapsed");
        button.setAttribute('type', 'button');
        button.setAttribute('data-bs-toggle', 'collapse');
        button.setAttribute('data-bs-target', '#' + day["date"]);
        button.setAttribute('aria-expanded', 'true');
        button.setAttribute('aria-controls', day["date"]);
        
        button.innerHTML = new Date(day["date"]).toDateString();

        // Accordion panel which contains the entries
        const panel = document.createElement('div');
        panel.classList.add('accordion-collapse', 'collapse');
        panel.setAttribute('id', day["date"]);
        
        // Panel body
        const body = document.createElement('div');
        body.classList.add("accordion-body");

        // List to contain all the entries on a particular date
        const group = document.createElement('ul');
        group.classList.add("list-group", "list-group-flush");

        // For each entry in a day
        day["entries"].forEach(entry => {
            // Create list element
            const itemContainer = document.createElement('li');
            itemContainer.classList.add("list-group-item");
            // Don't display any intensity if it is set to 0
            let intensityString = (parseFloat(entry["intensity"]) == 0) ? "" : `(${entry["intensity"]} kg)`;
            // initialie entry string as [Exercise_name] - [Sets]x[Reps] ([Intensity])
            let entryString = `${entry.exercise["name"]} - ${entry.sets}x${entry.reps} ${intensityString}`;

            const entryContent = document.createElement('div');
            entryContent.classList.add("col");
            entryContent.textContent = entryString;

            // set wrapper fields to help with generating an edit form
            const wrapper = document.createElement('div');
            wrapper.dataset.id = entry["id"];
            wrapper.dataset.name = entry.exercise["name"];
            wrapper.dataset.sets = entry.sets;
            wrapper.dataset.reps = entry.reps;
            wrapper.dataset.intensity = entry.intensity;
            wrapper.classList.add("row");

            // edit button wrapper
            const buttonWrapper = document.createElement('div');
            buttonWrapper.classList.add("col-2");
            buttonWrapper.innerHTML = EDIT_BUTTON_SVG;
            // add edit button listener
            buttonWrapper.querySelector('svg').addEventListener('click', function() {
                en_addEntryEditForm(this);
            });

            // append all contents
            wrapper.append(entryContent, buttonWrapper);
            itemContainer.append(wrapper);

            group.append(itemContainer);
        });

        // Append items in order
        header.append(button);
        item.append(header);

        body.append(group);
        panel.append(body);
        item.append(panel);
        
        accordion.append(item);
    })
    // Append accordion
    document.querySelector('#entries-container').append(accordion);
}


/**
 * Displays an edit entry form in the entry accordion.
 * 
 * After fetching the necessary details, the target entry is hidden until the user
 * either clicked the submit or cancel button. A successful submission modifies
 * the target's entry with the updated data. A successful deletion removes the parent
 * div from the DOM.
 * 
 * @param {HTMLElement} target the entry to be edited
 */
function en_addEntryEditForm (target) {
    // fetch current entry data
    const container = target.parentNode.parentNode;
    const id = container.dataset.id;
    const name = container.dataset.name;

    // listener that activates if the user decides to click the close button on the
    // entry form
    function en_editEntryCloseButtonListener(target) {
        const element = target.parentNode.parentNode;
        element.parentNode.firstChild.style.display = "flex";
        element.remove();
    }

    // initialize entry form
    const form = util_returnExerciseEntryForm(
        {"id": id, "name": name},           // construct exercise object and send
        en_editEntryCloseButtonListener     // listener for when the close button is clicked
    );
    form.querySelector('.Sets').value = container.dataset.sets;
    form.querySelector('.Reps').value = container.dataset.reps;
    form.querySelector('.Intensity').value = container.dataset.intensity;

    // initalize buttons
    const buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add("d-flex", "justify-content-between");

    const submitButton = returnButton("info", "Submit", function () {
        en_submitEditEntryForm(form);
    });
    submitButton.classList.add("btn-sm");

    const removeButton = returnButton("danger", "Remove Entry", function () {
        en_removeEntry(form);
    })
    removeButton.classList.add("btn-sm");

    buttonWrapper.append(submitButton, removeButton);
    form.append(buttonWrapper);

    // hide current entry div
    container.style.display = "none";
    // append form
    container.parentNode.append(form);
}


/**
 * Attempts to submit the given entry form via a 'PUT' request to the server.
 * 
 * @param {HTMLElement} target the entry form to be submitted
 */
async function en_submitEditEntryForm(target) {
    // initialize field containers
    const formContainer = target.querySelector('form');
    const id = formContainer.dataset.exerciseId;
    
    const sets = formContainer.querySelector('.Sets');
    const reps = formContainer.querySelector('.Reps');
    const intensity = formContainer.querySelector('.Intensity');

    // validate entry fields
    var valid = true;
    valid = util_validateEntries([sets, reps, intensity]);

    if (!valid) {
        displayMessage("One or more entry fields are invalid!", false);
        return;
    }
    
    // attempt to submit if entries are valid
    const apiResponse = await fetch('entry/', {
        method: 'PUT',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            id: id,
            sets: sets.value,
            reps: reps.value,
            intensity: intensity.value
        })
    });
    const data = await apiResponse.json();

    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    // display success message and modify current entry string to display updated data
    displayMessage(data.message, true);
    const entry = formContainer.parentNode.parentNode.parentNode.firstChild;
    
    let intensityString = (parseFloat(intensity.value) == 0) ? "" : `(${intensity.value} kg)`;
    let entryString = `${entry.dataset.name} - ${sets.value}x${reps.value} ${intensityString}`;
    entry.firstChild.textContent = entryString;
    // display entry div
    entry.style.display = "flex";

    // remove edit form
    formContainer.parentNode.parentNode.remove();
}

/**
 * Attempt to delete the given entry from the server via a 'DELETE' request and
 * remove the said entry from the DOM.
 * 
 * In case of a successful deletion, the calendar widget is reloaded to reflect
 * the removed entry.
 * 
 * @param {HTMLElement} target the target entry div to be removed
 */
async function en_removeEntry(target) {
    // fetch entry id
    const formContainer = target.querySelector('form');
    const id = formContainer.dataset.exerciseId;

    // attempt to send DELETE request to the server
    const apiResponse = await fetch(`entry/?id=${id}`, {
        method: 'DELETE',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
    });
    const data = await apiResponse.json();

    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    // display success message
    displayMessage(data.message, true);
    // fetch the calendar's current anchor date and reload calendar
    var date = document.querySelector('.accordion-collapse').getAttribute("id");
    await en_loadCalendar(new Date(date));
    // remove the entry div from DOM
    const entryNode = formContainer.closest('.list-group-item');
    if (entryNode.parentNode.childElementCount <= 1) {
        entryNode.closest('.accordion-item').remove();
    } else {
        entryNode.remove();
    }
    
}


/**
 * Clears the current Entries Header container and replaces it with the provided
 * text.
 * 
 * @param {String} headerText the text to display on the header
 */
function en_populateEntriesHeader(headerText) {
    // clear current header
    const header = document.querySelector('#entries-header');
    header.textContent = headerText;
}


/**
 * Attempts to getch the range entry search form. Clears the Entry View on a successful
 * submission.
 * 
 * This function fires up when the user submits the form to fetch entries from a
 * particular date range. Upon successful submission, it clears the Entry View and
 * populates the Entries container with the fetched data.
 */
async function en_submitEntriesRangeForm() {
    // Get the start and end date form values
    const startDate = document.querySelector('#entriesStartDate').value;
    const endDate = document.querySelector('#entriesEndDate').value;

    // Fetch the entries
    const apiResponse = await fetch(`entries/range/?startDate=${startDate}&endDate=${endDate}`)
    const data = await apiResponse.json();

    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    } 
    
    // Populate container with entries
    emptyEntriesView();
    en_populateEntriesHeader(`Entries from ${startDate} to ${endDate}`);
    en_populateEntries(data);
}


/**
 * Loads the calendar widget where days with entries are marked for the user to click
 * and view.
 * 
 * Clicking on a marked day presents the user with all the entries for that day as
 * a Bootstrap accordion item.
 * Clicking on a non-marked day in the calendar presents the user with an exercise
 * search bar where the user can lookup an exercise and add an entry for it.
 * 
 * The calendar also has navigation buttons to move forward/backward a month. Every time
 * a navigation button is clicked, the calendar reloads and fetches new entry data
 * from the server.
 * 
 * @param {Date} anchorDate first day of the currently selected month on the calendar
 */
async function en_loadCalendar(anchorDate) {
    // Initialize month array
    const months = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];
                    
    // empty nav and reset the previous and next buttons
    const calendarNav = document.querySelector('#calendar-nav');
    calendarNav.innerHTML = "";

    const calendarPrev = document.createElement('btn');
    calendarPrev.innerHTML = NAV_LEFT_ARROW_SVG;
    calendarPrev.setAttribute("id", "calendar-previous");
    
    const calendarNext = document.createElement('btn');
    calendarNext.innerHTML = NAV_RIGHT_ARROW_SVG;
    calendarNext.setAttribute("id", "calendar-next");

    calendarNav.append(calendarPrev, calendarNext);

    // Get currently shown year and month
    const year = anchorDate.getFullYear();
    const month = anchorDate.getMonth();
    // Get number of days in current month
    const days = new Date(year, month + 1, 0).getDate();

    // Update the current (month, year) header in the calendar
    const currentDate = document.querySelector('#calendar-current-date');
    currentDate.innerHTML = `${months[month]} ${year}`;
    currentDate.dataset.anchorDate = `${year}-${month + 1}-1`;

    // Calculate previous month and year and attach listener for navigation
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    document.querySelector('#calendar-previous').addEventListener('click', () => {
        en_loadCalendar(new Date(prevYear, prevMonth, 1));
    })
    
    // Calculate next month and year and attach listener for navigation
    const nextMonth = month === 11 ? 1 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    document.querySelector('#calendar-next').addEventListener('click', () => {
        en_loadCalendar(new Date(nextYear, nextMonth, 1));
    })

    // Extra days from previous month
    const beforePadding = new Date(year, month, 1).getDay();
    const beforeDays = new Date(year, month, 0).getDate();

    // Extra days from next month
    const afterPadding = 6 - new Date(year, month, days).getDay();

    // Fetch current month's entry dates
    const apiResponse = await fetch(`entries/calendar/?year=${year}&month=${month + 1}`)
    const data = await apiResponse.json();
    
    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    dates = data["dates"];  // Sorted list of days which have a journal entry
    datesIndex = 0;         // Index pointer to index into the array

    // Select calendar date container and empty it
    const calendarBody = document.querySelector('#calendar-dates');
    calendarBody.innerHTML = "";
    
    let currentMonthDay = 1;    // Day counter to sync with entry dates
    let daysSoFar = 0;          // Counts the number of days added to the calendar so far
    let nextMonthDay = 1;       // Counts the number of days added from the next month

    let rows = 4;                                           // default calendar rows
    if (beforePadding > 0 || afterPadding > 0) rows++;      // add a row for previous month's days
    if ((beforePadding + afterPadding) > 10) rows++;        // add a row for next month's days

    for (let i = 0; i < rows; i++) {    // For each row in the calendar
        // Initialize row div
        const row = document.createElement('div');
        row.classList.add("row", "row-cols-7");
        
        for (let j = 0; j < 7; j++, daysSoFar++) {    // For each date in row
            // Initialize date div
            const dateSlot = document.createElement('div');
            dateSlot.classList.add("col");

            // Add days from previous month
            if (daysSoFar < beforePadding) {  
                dateSlot.classList.add("date-faded");
                dateSlot.innerHTML = beforeDays - beforePadding + j + 1;
                row.append(dateSlot);
                continue;
            }
            // Add days from next month
            if (currentMonthDay > days) {
                dateSlot.classList.add("date-faded");
                dateSlot.innerHTML = nextMonthDay++;
                row.append(dateSlot);
                continue;
            }

            // Add days from current month
            dateSlot.innerHTML = currentMonthDay;
            const clickDate = `${year}-${month + 1}-${currentMonthDay}`;

            // if an entry exists on this day
            if ((datesIndex < dates.length) && (currentMonthDay == dates[datesIndex])) {
                // mark date on calendar
                dateSlot.classList.add("date-marked");
                // add listener to display the entries
                dateSlot.addEventListener('click', () => {
                    en_calendarMarkedDateClicked(clickDate);
                });
                datesIndex++;
            } else {    // if an entry doesn't exist
                // add listener to show the exercise search bar
                let today = new Date();
                let currentDate = new Date(clickDate);
                if (currentDate <= today) {
                    dateSlot.addEventListener('click', () => {
                        history.pushState(
                            {
                                "view": ENTRIES_VIEW,
                                "calendar": clickDate,
                                "calendarDateClicked": {
                                    "entry": false
                                }
                            },
                            '',
                            `#entries/date=${clickDate}`
                        );
                        document.querySelector('#entries-container').innerHTML = "";
                        en_populateEntriesHeader(`Add entry on ${new Date(clickDate).toDateString()}:`);
                        en_addEntryOnDate(clickDate);
                    });
                }
            }
            currentMonthDay++;
            
            row.append(dateSlot);
        }
        calendarBody.append(row);
    }
}


/**
 * Loads all the entries on the given date.
 * 
 * This listener function fires up when the user clicks a marked date on the calendar.
 * 
 * @param {String} clickDate A date string formatted as 'YYYY-MM-DD'
 * @see {@link en_loadCalendar} for where the listener is placed
 */
function en_calendarMarkedDateClicked(clickDate) {
    history.pushState(
        {
            "view": ENTRIES_VIEW,
            "calendar": clickDate,
            "calendarDateClicked": {
                "entry": true
            }
        },
        '',
        `#entries/date=${clickDate}`
    );
    en_loadEntryOnDate(clickDate);
    en_addEntryOnDate(clickDate);
}


/**
 * Fetches all entries from the server on the given date and populates the entries
 * div with the content.
 * 
 * @param {String} date A date string formatted as 'YYYY-MM-DD'
 */
async function en_loadEntryOnDate(date) {
    // fetch entries from the server
    const apiResponse = await fetch(`entries/range/?startDate=${date}&endDate=${date}`)
    const data = await apiResponse.json();
    
    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    // populate entries
    en_populateEntriesHeader(`Entries on ${new Date(date).toDateString()}:`);
    en_populateEntries(data);
}

/**
 * Updates the entry header and displays an exercise/workout search bar to allow
 * the user to add exercise entries on the given date.
 * 
 * @param {String} date A date string formatted as 'YYYY-MM-DD'
 * @returns 
 */
function en_addEntryOnDate(date) {
    // initialize today and the given date
    const td = new Date();
    const givenDate = new Date(date);

    // return if the user clicked a date in the future
    if (givenDate > td) 
        return;

    // clear search bar container
    const entriesWrapper = document.querySelector('#entries-search-bar');
    entriesWrapper.innerHTML = "";
    
    // initialize workout/exercise search bar
    const searchForm = util_returnAutocompleteWorkoutExerciseSearchForm(
        "entriesSearchBar", 
        // listener that fires up when a search result is clicked
        function (target, workoutFlag) {
            en_addExerciseFormListener(target, workoutFlag);
            document.querySelector('#entriesSearchBar').innerHTML = "";
        }
    );
    entriesWrapper.append(searchForm);

    // initialize entry form container and buttons
    const exForms = document.createElement('div');
    exForms.setAttribute("id", "enExerciseForms");
    exForms.dataset.day = date;
    entriesWrapper.append(exForms);

    const buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add("d-flex", "justify-content-end");
    
    const submitButton = returnButton(
        "info", 
        "Add Entry",
        async function() {  // entry submission function
            let submission = await util_submitEntriesForm('enExerciseForms');
            if(submission) {
                let viewload = await loadEntriesView();
                let entryload = await en_loadEntryOnDate(date);
                en_addEntryOnDate(date);
            }
        }
    );
    // hide submit button until user adds an entry
    submitButton.setAttribute("id", "enSubmitEntryButton");
    submitButton.style.display = "none";
    
    buttonWrapper.append(submitButton);
    entriesWrapper.append(buttonWrapper);
}

/**
 * Adds entry form(s) for the clicked exercise (or workout) to the entries form container.
 * 
 * Adds a single entry form for the corresponding exercise if the user clicked an
 * exercise in the search bar. If a workout was clicked instead, adds an entry form
 * for each exercise in the workout.
 * 
 * @param {HTMLElement} target       the clicked exercise or workout in the search bar
 * @param {boolean}     workoutFlag  whether the user clicked a workout or not
 */
async function en_addExerciseFormListener(target, workoutFlag) {
    // fetch target workout/exercise details
    const id = target.dataset.id;
    const name = target.textContent;

    // select form containers and display submit button
    const formContainer = document.querySelector("#enExerciseForms");
    const submitButton = document.querySelector('#enSubmitEntryButton');
    submitButton.style.display = "block";

    if (workoutFlag) {  // if a workout was clicked
        // fetch all exercises
        const apiResponse = await fetch(`workout/${id}/exercises`);
        const data = await apiResponse.json();
        
        // bail if an error occurs
        if (data.error) {
            displayMessage(data.error, false);
            return;
        }

        // add a form for each exercise
        const exercises = data["exercises"];
        const forms = util_returnBulkExerciseEntryForms(exercises, en_addEntryCloseButtonListener);
        forms.forEach(form => formContainer.append(form));
    } else {    // add exercise form
        formContainer.append(util_returnExerciseEntryForm({"id": id, "name": name}, en_addEntryCloseButtonListener));
    }
}

/**
 * Removes the entry form from the DOM and hides the submit entry button if no more
 * entry forms are left in the container.
 * 
 * @param {HTMLElement} target The entry form the user clicked the close button on
 */
function en_addEntryCloseButtonListener (target) {
    const element = target.parentNode.parentNode;
    if (element.parentNode.childElementCount <= 2) {
        document.querySelector('#enSubmitEntryButton').style.display = "none";
    }
    element.classList.add("fade-out");
    setTimeout(() => { element.remove(); }, 300);
}
