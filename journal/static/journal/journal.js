let jvHeader, jvWorkouts, jvSearchBar, jvEntryForms, jvSubmit;

/**
 * Initializes the Journal View container variables and the Add Entry button
 * listener.
 */
function jv_init() {
    jvHeader = document.querySelector('#jvHeader');
    jvWorkouts = document.querySelector('#jvWorkouts');
    jvSearchBar = document.querySelector('#jvSearchBar');
    jvEntryForms = document.querySelector('#jvEntryForms');
    jvSubmit = document.querySelector('#jvSubmit');

    // If Add Entry button is clicked
    jvSubmit.addEventListener('click', async function () {
        if(await util_submitEntriesForm("jvEntryForms")) {  // On successful submission
            history.pushState({"view": ENTRIES_VIEW}, '', '#entries');
            loadEntriesView();
        };
    })
};

/**
 * Toggles the visibility of the Journal View, empties it, and loads the current
 * program's workouts for today as an entry form.
 * 
 * The Add Entry button is initially hidden, only made visible when there are one
 * or more entry forms in the container.
 */
async function loadJournalView() {
    toggleView(JOURNAL_VIEW);
    emptyJournalView();
    // hide Add Entry button by default
    jvSubmit.style.display = "none";

    await jv_loadCurrentProgramWorkouts();
}

/**
 * Empties all the major Journal View containers.
 */
function emptyJournalView() {
    jvHeader.innerHTML = "";
    jvWorkouts.innerHTML = "";
    jvSearchBar.innerHTML = "";
    jvEntryForms.innerHTML = "";
}

/**
 * Loads the user's current program and its workouts. If today has an assigned
 * workout, display an entry form for each of its exercises.
 * 
 * Workouts are displayed in a Bootstrap card list with the name of the program
 * as the card header, and a list of 7 rows (each one corresponding to a day of
 * the week) containing all the workouts. If a workout doesn't exist for a day,
 * the corresponding day is labeled as a Rest Day.
 */
async function jv_loadCurrentProgramWorkouts() {
    // fetch current program data from the server
    const apiResponse = await fetch(`program/current/workouts`)
    const data = await apiResponse.json();

    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    const program = data["program"];
    
    if (program == false) { // no currently active program
        jvHeader.textContent = "No Currently Active Program. Please go to Programs and " +
                                "create/set a program as your current program";
        return;
    }

    const workouts = data["workouts"];

    if (workouts == false) { // user has no workouts in the program
        jvHeader.textContent = "Your workout list is empty. Please go to Programs and" +
                                " create/add workouts to your current program";
        return;
    }

    // initialize workout card
    const workoutCard = document.createElement('div');
    workoutCard.classList.add("card", "workout-card");
    workoutCard.setAttribute("data-bs-theme", "dark");

    const cardHeader = document.createElement('div');
    cardHeader.classList.add("card-header");
    // populate card header with program name
    cardHeader.innerHTML = program.name;            

    workoutCard.append(cardHeader);

    // initialize workout list
    const workoutList = document.createElement('div');
    workoutList.classList.add("list-group", "list-group-flush");

    // template list to be populated later
    const workoutListTemplate = [];

    // pre-populate template list with all Rest Days entries
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].forEach(day => {
        const row = document.createElement('button');
        row.classList.add("list-group-item", "list-group-item-action");
        row.innerHTML = day + " - Rest";
        workoutListTemplate.push(row);
    });

    // pre-populate header
    jvHeader.innerHTML = `<div class="display-6">Today: Rest</div>`;
    jvEntryForms.dataset.day = "";

    // fetch today's day and convert it to python day value
    let today = new Date();
    today = today.getDay();
    today = today == 0 ? 6 : today - 1;

    workouts.forEach(workout => {   // for each workout
        workout["days"].forEach(dayObj => { // for each day in workout
            const day = dayObj["dayNum"];
            const dayName = dayObj["day"];
            // update template list with workout details
            workoutListTemplate[day].innerHTML = dayName + " - " + workout["name"];
            workoutListTemplate[day].dataset.workoutId = workout["id"];
            workoutListTemplate[day].setAttribute("id", "jvWorkoutRow" + day);
            
            // highlight today's workout and add all exercise entry forms for the workout
            if (day == today) {
                workoutListTemplate[day].classList.add("active");
                jvHeader.innerHTML = `<div class="display-6">Today's Workout: ${workout["name"]}</div>`;
                jvEntryForms.innerHTML = "";

                // fetch list of entry forms for the workout
                jv_returnWorkoutExerciseForms(workout["id"]).then(forms => {
                    // then append each form to the entry form container
                    forms.forEach(entryForm => jvEntryForms.append(entryForm));
                });
            }

            // clicking on a workout in the card loads all exercise forms for that
            // workout instead
            workoutListTemplate[day].addEventListener('click', function() {
                // prevent duplicate history pushes
                if (!decodeURI(window.location.href).endsWith(`#home/workout=${workout.name}`)) {
                    history.pushState(
                        {
                            "view": JOURNAL_VIEW,
                            "workoutRow": this.getAttribute("id"),
                        },
                        '',
                        `#home/workout=${workout.name}`
                    )
                }
                jv_cardClickListener(this);
            });
        });
    });

    // append the now completed template list to the main workout list container
    workoutListTemplate.forEach(row => {
        workoutList.append(row);
    })

    workoutCard.append(workoutList);
    jvWorkouts.append(workoutCard);
    jv_loadSearchBar();
}

/**
 * Empties the jvEntryForms container and populates it with exercise entry forms
 * for the clicked workout.
 * 
 * @param {HTMLElement} target the clicked card row
 */
function jv_cardClickListener (target) {
    // fetch workout ID
    const parent = target.parentNode;
    const workoutId = target.dataset.workoutId;
    
    // switch clicked card row to active
    const active = parent.getElementsByClassName('active');
    if (active.length > 0) {
        active[0].classList.remove("active");
    }
    target.classList.add("active");

    // empty container
    jvEntryForms.innerHTML = "";
    // fetch the list of entry forms for the workout
    jv_returnWorkoutExerciseForms(workoutId).then(forms => {
        // then append each form to the jvEntryForms container
        forms.forEach(entryForm => jvEntryForms.append(entryForm));
    });
}


/**
 * Removes the entry form from the DOM and hides the Submit button if no more
 * entry forms are left.
 * 
 * @param {HTMLElement} target the clicked entry form
 */
function jv_entryFormCloseButtonListener (target) {
    const element = target.parentNode.parentNode;
    // hide Submit Button if this is the last entry form
    if (element.parentNode.childElementCount <= 1) {
        jvSubmit.style.display = "none";
    }
    element.remove();
}


/**
 * Returns a list of entry forms for all the exercises in the given workout.
 * 
 * @param {String} workoutId workout UUID string
 */
async function jv_returnWorkoutExerciseForms(workoutId) {
    // fetch exercise data from the server
    const apiResponse = await fetch(`workout/${workoutId}/exercises`);
    const data = await apiResponse.json();
    
    // bail if an error occurs
    if (data.error) {
        displayMessage(data.error, false);
        return;
    }

    const exercises = data["exercises"];
    if (exercises.length <= 0) {    // return if there are no exercises in the workout
        return;
    }
    
    // display the submit button
    jvSubmit.style.display = "flex";
    
    let entryList = [];
    exercises.forEach(exercise => {
        // fetch entry form and add to list
        const entry = util_returnExerciseEntryForm(exercise, jv_entryFormCloseButtonListener);
        entryList.push(entry);
    });
    return entryList;
}

/**
 * Loads an exercise/workout search bar into the jvSearchBar container.
 * 
 * Clears the jvSearchBar container of any previous contents. Fetches the top 4
 * workouts and top 4 exercises from the server adn displays them in a list. Clicking
 * on a workout loads all the exercises as entry forms, while clicking on an exercise
 * loads a singular exercise entry form.
 * 
 * @see {@link util_returnAutocompleteExerciseSearchForm} for how the search bar is 
 * constructed.
 */
function jv_loadSearchBar() {
    // clear any previous contents
    jvSearchBar.innerHTML = "";
    // fetch search bar
    const searchForm = util_returnAutocompleteWorkoutExerciseSearchForm(
        "journalSearchBar", 
        // search bar click listener
        function (target, workoutFlag) {
            jv_searchBarListener(target, workoutFlag);
            // empty serach bar after click
            document.querySelector('#journalSearchBar').innerHTML = "";
        }
    );
    jvSearchBar.append(searchForm);
}


/**
 * Populates the jvEntryForms container with the provided exercise/workout's entry form(s).
 * 
 * If the clicked target is a workout, then it adds all the exercises' entry forms.
 * Otherwise, add the singular exercise's entry form.
 * 
 * @param {HTMLElement} target   the clicked workout or exercise in the search bar results
 * @param {Boolean} workoutFlag  whether the clicked item is a workout
 * @see {@link util_returnExerciseEntryForm} for how entry forms are constructed
 */
async function jv_searchBarListener(target, workoutFlag) {
    // fetch target fields
    const id = target.dataset.id;
    const name = target.textContent;

    // if target is a workout
    if(workoutFlag) {
        // fetch workout exercises from the server
        const apiResponse = await fetch(`workout/${id}/exercises`);
        const data = await apiResponse.json();
        
        // bail if an error occurs
        if (data.error) {
            displayMessage(data.error, false);
        }

        const exercises = data["exercises"];
        exercises.forEach(exercise => {
            // add an entry form for each exercise in the workout
            const form = util_returnExerciseEntryForm(exercise, jv_entryFormCloseButtonListener);
            jvEntryForms.append(form);
        });
    } else {
        // otherwise, add the singular exercise's entry form
        jvEntryForms.append(util_returnExerciseEntryForm({"id": id, "name": name}, jv_entryFormCloseButtonListener));
    }
    // display submit button if hidden
    jvSubmit.style.display = "flex";
}

