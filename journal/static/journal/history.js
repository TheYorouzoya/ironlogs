/**
 * Redirects the given history state object to the relevant history processor
 * subroutine based on the state's view property.
 * 
 * @param {Object} state the history state object to be processed 
 */
async function processHistory(state) {

    if(!(await isLoggedIn())) {
        window.location.href = '/login/';
        return;
    }

    toggleView(state.view);
    
    switch(state.view) {
        case JOURNAL_VIEW:
            processJournalViewState(state);
            break;
        case PROGRAM_VIEW:
            processProgramViewState(state);
            break;
        case EXERCISES_VIEW:
            processExercisesViewState(state);
            break;
        case ENTRIES_VIEW:
            processEntriesViewState(state);
            break;
        default:
            console.log("invalid view index");
            return;
    }
}

async function isLoggedIn() {
    return fetch('/isLogged')
    .then(response => response.json())
    .then(data => data.isAuthenticated);
}


/**
 * A history state object related to the Journal View. Other than the view, the
 * rest are optional properties.
 * 
 * @typedef {Object} JournalState
 * @property {Number} view - denotes the current view (is set equal to the `JOURNAL_VIEW` constant) 
 * @property {String} workoutRow - the id of a workout row on the program card
 */

/**
 * Processes a Journal history state object and invokes the relevant subroutines
 * to restore the required view state.
 * 
 * @param {JournalState} state the history state object to be processed
 */
async function processJournalViewState(state) {
    // load view first
    await loadJournalView();
    if (state.workoutRow) {
        jvEntryForms.innerHTML = "";
        // if a workout row on the program card was clicked
        jv_cardClickListener(document.getElementById(state.workoutRow));
        jv_toggleWorkoutCardVisibility();
    }
}

/**
 * An AddWorkout state object, created when the user clicks an empty workout
 * slow in the workout table.
 * 
 * @typedef {Object} AddWorkout
 * @property {String} row - the workout row clicked on the table
 * @property {Workout[]} workouts - list of all workouts in the concerned program
 */


/**
 * A Program history state object representing the Program View.
 * @typedef {Object} ProgramState
 * @property {Number} view - denotes the current view index
 * @property {String} program - program UUID string
 * @property {Boolean} addProgram - if Add Program button was clicked
 * @property {Program} editProgram - the program Object to be edited
 * @property {AddWorkout} addWorkout - if an empty row in the workout table was clicked
 * @property {String} workout - if a workout in the workout table was clicked
 * @property {String} editWorkout - if the user edited a workout
 */


/**
 * Processes a Program history state object and invokes the relevant subroutines
 * to restore the required view state.
 * 
 * @param {ProgramState} state the history state object to be processed
 */
async function processProgramViewState(state) {
    hideProgramView();
    await loadProgramView();
    if (state.addProgram) { // if the Add Program button was clicked
        pv_displayAddProgramForm();
    }
    if (state.program) {    // if a program was clicked
        await pv_loadProgram(state.program);
    }
    if (state.editProgram) {// if the user edited a program
        pv_loadProgramEditForm(state.editProgram);
    }
    if (state.addWorkout) { // if the user clicked an empty row in the workout table
        pv_displayWorkoutForms(
            document.getElementById(state.addWorkout["row"]), 
            state.addWorkout["workouts"]
        );
    }
    if (state.workout) {    // if the user clicked a workout in the workout table
        if (document.getElementById(state.workout).dataset.workoutId) {
            pv_displayWorkoutExercises(document.getElementById(state.workout));
        } else {
            // replace history state if the workout no longer exists
            history.replaceState(
                {
                    "view": PROGRAM_VIEW,
                    "program": state.program
                },
                '',
                `#program/${document.querySelector('#pvWorkoutContainer').dataset.programName}`
            )
        }
    }
    if (state.editWorkout) {// if the user clicked Edit Workout on a workout
        pv_displayEditWorkoutForm(document.getElementById(state.editWorkout));
    }
    showProgramView();
}

/**
 * An Exercise history state object representing the Exercise view.
 * 
 * @typedef {Object} ExerciseState
 * @property {Number} view - a constant representing the exercise view
 * @property {String} exercise - a UUID string representing an exercise
 * @property {String} exerciseQuery - a search query to filter the exercise table with
 * @property {Number} exercisePage - page number on the said search results
 */

/**
 * Processes an ExerciseState object and invokes the relevant subroutines to 
 * restore the required view state.
 * 
 * @param {ExerciseState} state the ExerciseState object to be processed
 */
async function processExercisesViewState(state) {
    // load view first
    await loadExerciseView();
    if (state.exercise) {
        // if an exercise was visited
        emptyExerciseView();
        ex_loadExercise(state.exercise);
    }
    if (state.exerciseQuery) {
        // if the exercise table was filtered with a query
        ev_loadExerciseTableWithGivenQuery(state.exerciseQuery, state.exercisePage);
    }
}

/**
 * A date range object with start and end ranges formatted as 'YYYY-MM-DD' date strings.
 * @typedef {Object} DateRange
 * @property {String} start - the starting date
 * @property {String} end - the end date
 * 
 */

/**
 * An object denoting whether or not a date clicked on the calendar widget has any
 * entries on it or not.
 * @typedef {Object} CalendarDateClicked
 * @property {Boolean} entry
 */

/** 
 * An Entries history state object representing the Entries View.
 * @typedef {Object} EntriesState
 * @property {Number}    view - a constant representing the entries view
 * @property {String}    calendar - a calendar date indicating which month to set
 *                                  the calendar on
 * @property {DateRange} range - date range for which to fetch entries for
 * @property {CalendarDateClicked}   calendarDateClicked - whenther the clicked date
 *                                                         on the calendar has an entry
 */

/**
 * Processes an EntriesState object and invokes the relevant subroutines to 
 * restore the required view state.
 * 
 * @param {EntriesState} state the Entries state object to be processed
 */
async function processEntriesViewState(state) {
    hideEntriesView();
    // load view first
    await loadEntriesView();
    if (state.default) {
        await en_loadDefaults();
    }
    if (state.calendar) {
        // if a calendar widget state exists
        await en_loadCalendar(new Date(state.calendar));
    }
    if (state.range) {
        // if user searched entries in a date range
        document.querySelector('#entriesStartDate').value = state.range.start;
        document.querySelector('#entriesEndDate').value = state.range.end;
        en_submitEntriesRangeForm();
    }
    if (state.calendarDateClicked) {
        // if the user clicked a date on the calendar widget
        let header = `Add entry on ${new Date(state.calendar).toDateString()}:`;
        if (state.calendarDateClicked.entry)
            header = `Entries on ${new Date(state.calendar).toDateString()}:`;
            en_loadEntryOnDate(state.calendar);

        en_populateEntriesHeader(header);
        en_addEntryOnDate(state.calendar);
        // en_markCurrentDate(state.calendar.split('-')[2]);
    }
    showEntriesView();
}