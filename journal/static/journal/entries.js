// Loads the entries view and its contents
function loadEntriesView() {
    toggleView(ENTRIES_VIEW);

    // load calendar widget
    loadCalendar(d);

    // fetch this week's entries
    fetch(`entries/range/`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.log(data.error);
            } else {
                populateEntriesHeader("This week's entries.");
                populateEntries(data);
            }
        })
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
            const itemContainer = document.createElement('ul');
            itemContainer.classList.add("list-group-item");
            // Don't display any intensity if it is set to 0
            intensityString = (parseFloat(entry["intensity"]) == 0) ? "" : `(${entry["intensity"]} kg)`;
            // set the list entry
            itemContainer.innerHTML = `${entry.exercise["name"]} - ${entry.sets}x${entry.reps} ${intensityString}`;
            group.append(itemContainer);
        })

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
                console.log("Error submitting form");
            } else {
                // Populate container with entries
                populateEntriesHeader(`Entries from ${startDate} to ${endDate}`);
                populateEntries(data);
            }
        })
}

// Loads the calendar widget which marks days that have a journal entry
// The user can click on a valid day to fetch that day's entry
function loadCalendar(anchorDate) {
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
    fetch(`entries/calendar/?year=${year}&month=${month + 1}`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.log("Error getting dates");
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
                            })
                            datesIndex++;
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
function loadEntryOnDate(day) {
    fetch(`entries/range/?startDate=${day}&endDate=${day}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.log("Error fetching entries on the given date");
            } else {
                populateEntriesHeader(`Entries on ${new Date(day).getDate()}`);
                populateEntries(data);
            }
        })
}