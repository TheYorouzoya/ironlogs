function processHistory(state) {
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


async function processJournalViewState(state) {
    await loadJournalView();
    if (state.workoutRow) {
        jv_cardClickListener(document.getElementById(state.workoutRow));
    }
}


async function processProgramViewState(state) {
    await loadProgramView();
    if (state.addProgram) {
        pv_displayAddProgramForm();
    }
    if (state.program) {
        await pv_loadProgram(state.program);
    }
    if (state.editProgram) {
        pv_loadProgramEditForm(state.editProgram);
    }
    if (state.addWorkout) {
        pv_displayWorkoutForms(
            document.getElementById(state.addWorkout["row"]), 
            state.addWorkout["workouts"]
        );
    }
    if (state.workout) {
        if (document.getElementById(state.workout).dataset.workoutId) {
            pv_displayWorkoutExercises(document.getElementById(state.workout));
        } else {
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
    if (state.editWorkout) {
        pv_displayEditWorkoutForm(document.getElementById(state.editWorkout));
    }
}


async function processExercisesViewState(state) {
    await loadExerciseView();
    if (state.exercise) {
        emptyExerciseView();
        ev_loadExercise(state.exercise);
    }
    if (state.exerciseQuery) {
        ev_loadExerciseTableWithGivenQuery(state.exerciseQuery, state.exercisePage);
    }
}


async function processEntriesViewState(state) {
    await loadEntriesView();
    if (state.calendar) {
        en_loadCalendar(new Date(state.calendar));
    }
    if (state.range) {
        document.querySelector('#entriesStartDate').value = state.range.start;
        document.querySelector('#entriesEndDate').value = state.range.end;
        en_submitEntriesRangeForm();
    }
    if (state.calendarDateClicked) {
        if (state.calendarDateClicked.entry)
            en_loadEntryOnDate(state.calendar);
        en_addEntryOnDate(state.calendar);
    }
}