document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#entries-form').addEventListener('submit', event => {
        event.preventDefault();
        submitEntriesForm(event);
    });
});


// Loads the entries view and its contents
async function loadEntriesView() {
    toggleView(ENTRIES_VIEW);
    emptyEntriesView();

    // load calendar widget
    let calendar = await loadCalendar(new Date());

    // fetch this week's entries
    return fetch(`entries/range/`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                displayMessage(data.error, false);
            } else {
                populateEntriesHeader("This week's entries:");
                populateEntries(data);
            }
        })
}


function emptyEntriesView() {
    document.querySelector('#entries-header').innerHTML = "";
    document.querySelector('#entries-search-bar').innerHTML = "";
    document.querySelector('#entries-container').innerHTML = "";
}

// Populate the entries container (a bootsrap accordion) with the entries contained 
// in the data object
function populateEntries(data) {
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
            let entryString = `${entry.exercise["name"]} - ${entry.sets}x${entry.reps} ${intensityString}`;

            const wrapper = document.createElement('div');
            wrapper.dataset.id = entry["id"];
            wrapper.dataset.name = entry.exercise["name"];
            wrapper.classList.add("row");

            const entryContent = document.createElement('div');
            entryContent.classList.add("col");
            entryContent.textContent = entryString;

            const buttonWrapper = document.createElement('div');
            buttonWrapper.classList.add("col-2");
            
            buttonWrapper.innerHTML = EDIT_BUTTON_SVG;

            buttonWrapper.querySelector('svg').addEventListener('click', function() {
                en_addEntryEditForm(this);
            });

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


function en_addEntryEditForm (target) {
    const container = target.parentNode.parentNode;
    const id = container.dataset.id;
    const name = container.dataset.name;

    const form = util_returnExerciseEntryForm({"id": id, "name": name}, en_editEntryCloseButtonListener);

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

    container.style.display = "none";

    container.parentNode.append(form);
}


async function en_submitEditEntryForm(target) {
    const formContainer = target.querySelector('form');
    const id = formContainer.dataset.exerciseId;
    
    const sets = formContainer.querySelector('.Sets');
    const reps = formContainer.querySelector('.Reps');
    const intensity = formContainer.querySelector('.Intensity');

    var valid = true;

    valid = util_validateEntries([sets, reps, intensity]);

    if (valid) {
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

        if (data.error) {
            displayMessage(data.error, false);
        } else {
            displayMessage(data.message, true);
            const entry = formContainer.parentNode.parentNode.parentNode.firstChild;
            
            let intensityString = (parseFloat(intensity.value) == 0) ? "" : `(${intensity.value} kg)`;
            let entryString = `${entry.dataset.name} - ${sets.value}x${reps.value} ${intensityString}`;
            entry.firstChild.textContent = entryString;
            entry.style.display = "flex";

            formContainer.parentNode.parentNode.remove();
        }
    }
}


async function en_removeEntry(target) {
    const formContainer = target.querySelector('form');
    const id = formContainer.dataset.exerciseId;

    const apiResponse = await fetch(`entry/?id=${id}`, {
        method: 'DELETE',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
    });
    const data = await apiResponse.json();

    if (data.error) {
        displayMessage(data.error, false);
    } else {
        displayMessage(data.message, true);
        var date = document.querySelector('.accordion-collapse').getAttribute("id");
        await loadCalendar(new Date(date));
        formContainer.parentNode.parentNode.parentNode.remove();
    }
}


function en_editEntryCloseButtonListener(target) {
    const element = target.parentNode.parentNode;
    element.parentNode.firstChild.style.display = "flex";
    element.remove();
}


// Populates the Entries header with the given header text
function populateEntriesHeader(headerText) {
    const header = document.querySelector('#entries-header');
    header.innerHTML = "";

    const heading = document.createElement('h2');
    heading.innerHTML = headerText;
    header.append(heading);
}


// Function that fires up when the user submits the form to fetch entries
// from a particular date range
function submitEntriesForm() {
    // Get the start and end date form values
    const startDate = document.querySelector('#entriesStartDate').value;
    const endDate = document.querySelector('#entriesEndDate').value;

    // Fetch the entries
    fetch(`entries/range/?startDate=${startDate}&endDate=${endDate}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                displayMessage(data.error, false);
            } else {
                // Populate container with entries
                emptyEntriesView();
                populateEntriesHeader(`Entries from ${startDate} to ${endDate}`);
                populateEntries(data);
            }
        })
}

// Loads the calendar widget which marks days that have a journal entry
// The user can click on a valid day to fetch that day's entry
async function loadCalendar(anchorDate) {
    // Initialize month array
    const months = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];
                    
    // Select date container and empty it
    const calendarBody = document.querySelector('#calendar-dates');
    calendarBody.innerHTML = "";
    // empty nav and reset the previous and next buttons
    const calendarNav = document.querySelector('#calendar-nav');
    calendarNav.innerHTML = "";
    calendarNav.innerHTML = '<button id="calendar-previous" class="btn"><<</button><button id="calendar-next" class="btn">>></button>';

    // Get currently shown year and month
    const year = anchorDate.getFullYear();
    const month = anchorDate.getMonth();
    // Get number of days in current month
    const days = new Date(year, month + 1, 0).getDate();

    // Update the current (month, year) header in the calendar
    const currentDate = document.querySelector('#calendar-current-date');
    currentDate.innerHTML = `${months[month]} ${year}`;

    // Calculate previous month and year and attach listener for navigation
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    document.querySelector('#calendar-previous').addEventListener('click', () => {
        loadCalendar(new Date(prevYear, prevMonth, 1));
    })
    
    // Calculate next month and year and attach listener for navigation
    const nextMonth = month === 11 ? 1 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    document.querySelector('#calendar-next').addEventListener('click', () => {
        loadCalendar(new Date(nextYear, nextMonth, 1));
    })

    // Extra days from previous month
    const beforePadding = new Date(year, month, 1).getDay();
    const beforeDays = new Date(year, month - 1, 0).getDate();

    // Extra days from next month
    const afterPadding = 6 - new Date(year, month, days).getDay();

    // Day counter to sync with entry dates
    dayCounter = 1;

    rows = 4;

    if (beforeDays > 0) rows++;
    if (afterPadding > 0 && afterPadding > 4) rows++;

    // Fetch current month's entry dates
    return fetch(`entries/calendar/?year=${year}&month=${month + 1}`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            mainCounter = 0;    // Counts the number of days added to the calendar so far
            afterCounter = 1;   // Counts the number of days added from the next month

            // Sorted list of days which have a journal entry
            dates = data["dates"];
            // Index pointer to index into the array
            datesIndex = 0;     

            for (var i = 0; i < rows; i++) {    // For each row in the calendar
                // Initialize row div
                const row = document.createElement('div');
                row.classList.add("row", "row-cols-7");
                
                for (var j = 0; j < 7; j++, mainCounter++) {    // For each date in row
                    // Initialize date div
                    const dateSlot = document.createElement('div');
                    dateSlot.classList.add("col");

                    // Add days from previous month
                    if (mainCounter < beforePadding) {  
                        dateSlot.classList.add("date-faded");
                        dateSlot.innerHTML = beforeDays - beforePadding + j;
                    
                    }
                    // Add days from current month
                    else if ((mainCounter >= beforePadding) && (dayCounter <= days)) {
                        dateSlot.innerHTML = dayCounter;
                        // Add event listener if an entry exists on this day
                        if ((datesIndex < dates.length) && (dayCounter == dates[datesIndex])) {
                            dateSlot.classList.add("date-marked");
                            dateSlot.addEventListener('click', (event) => {
                                loadEntryOnDate(`${year}-${month + 1}-${event.target.textContent}`);
                                en_addEntryOnDate(`${year}-${month + 1}-${event.target.textContent}`);
                            });
                            datesIndex++;
                        } else {
                            dateSlot.addEventListener('click', (event) => {
                                document.querySelector('#entries-container').innerHTML = "";
                                en_addEntryOnDate(`${year}-${month + 1}-${event.target.textContent}`);
                            });
                        }
                        dayCounter++;
                    
                    }
                    // Add days from the next month
                    else {
                        dateSlot.classList.add("date-faded");
                        dateSlot.innerHTML = afterCounter++;
                    }
                    row.append(dateSlot);
                }
                calendarBody.append(row);
            }
        }
    })

}

// Populates the entries div with the entries on a given date ('YYYY-MM-DD')
async function loadEntryOnDate(day) {
    return fetch(`entries/range/?startDate=${day}&endDate=${day}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                displayMessage(data.error, false);
            } else {
                populateEntriesHeader(`Entries on ${new Date(day).toDateString()}:`);
                populateEntries(data);
            }
        })
}


function en_addEntryOnDate(day) {
    const td = new Date();
    const givenDate = new Date(day);

    if (givenDate > td) return;

    populateEntriesHeader(`Add entry on ${givenDate.toDateString()}:`);

    const entriesWrapper = document.querySelector('#entries-search-bar');
    entriesWrapper.innerHTML = "";
    
    const searchForm = util_returnAutocompleteWorkoutExerciseSearchForm(
        "entriesSearchBar", 
        function (target, workoutFlag) {
            en_addExerciseFormListener(target, workoutFlag);
            document.querySelector('#entriesSearchBar').innerHTML = "";
        }
    );
    entriesWrapper.append(searchForm);

    const exForms = document.createElement('div');
    exForms.setAttribute("id", "enExerciseForms");
    exForms.dataset.day = day;
    entriesWrapper.append(exForms);

    const buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add("d-flex");
    
    const submitButton = returnButton(
        "info", 
        "Add Entry",
        async function() {
            let submission = await util_submitEntriesForm('enExerciseForms');
            if(submission) {
                let viewload = await loadEntriesView();
                let entryload = await loadEntryOnDate(day);
                en_addEntryOnDate(day);
            }
        }
    );
    submitButton.setAttribute("id", "enSubmitEntryButton");
    submitButton.style.display = "none";
    
    buttonWrapper.append(submitButton);
    exForms.append(buttonWrapper);
}


function en_addExerciseFormListener(target, workoutFlag) {
    const id = target.dataset.id;
    const name = target.textContent;

    const formContainer = document.querySelector("#enExerciseForms");
    const submitButton = document.querySelector('#enSubmitEntryButton');
    submitButton.style.display = "block";

    if (workoutFlag) {
        fetch(`workout/${id}/exercises`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                displayMessage(data.error, false);
            } else {
                const exercises = data["exercises"];
                exercises.forEach(exercise => {
                    const form = util_returnExerciseEntryForm(exercise, en_addEntryCloseButtonListener);
                    formContainer.prepend(form);
                });
            }
        })
    } else {
        formContainer.prepend(util_returnExerciseEntryForm({"id": id, "name": name}, en_addEntryCloseButtonListener));
    }
}


function en_addEntryCloseButtonListener (target) {
    const element = target.parentNode.parentNode;
    if (element.parentNode.childElementCount <= 2) {
        document.querySelector('#enSubmitEntryButton').style.display = "none";
    }
    element.remove();
}
