function loadJournalView() {
    toggleView(JOURNAL_VIEW);
    
    loadProgram('current', '#journal-program-container', '#journal-workout-container', true);
}

function loadProgram(programId, workoutContainer, exerciseContainer, formFlag) {
    // Erase current container
    document.querySelector(workoutContainer).innerHTML = "";
    document.querySelector(exerciseContainer).innerHTML = "";
    fetch(`program/${programId}/workouts`)

    .then(response => response.json())
    .then(data => {
        if(data.error) {
            document.querySelector(workoutContainer).innerHTML = "You do not have an active worout plan";
        } else {
            var todayWorkoutId = '';
            // Create the card container
            const program_container = document.createElement('div');
            program_container.classList.add("card", "program-card");
            program_container.setAttribute("style", "width: 18rem;");
            program_container.setAttribute("data-bs-theme", "dark");

            // Create card header row
            const program_header = document.createElement('div');
            program_header.classList.add("card-header");
            program_header.innerHTML = data["program"].name;
            // Append card header into container
            program_container.append(program_header);

            // Create program's workout list container
            const list_container = document.createElement('div');
            list_container.classList.add("list-group", "list-group-flush");

            const workout_list = [];

            // Populate list with workouts
            data["workouts"].forEach(workout => {
                const workout_row = document.createElement('button');
                workout_row.classList.add("list-group-item", "list-group-item-action");
                workout_row.setAttribute("workout-id", workout["id"]);
                workout_row.innerHTML = workout["name"];
                workout["days"].forEach(day => {
                    workout_list[day["dayNum"]] = workout_row;
                    if (day["dayNum"] == today) {
                        workout_row.classList.add("active");
                        todayWorkoutId = workout["id"];
                    }
                })
                // Add event listener to row
                workout_row.addEventListener('click', function () {
                    // get parent node
                    const parent = this.parentNode;
                    // look for currently active row and set it to inactive
                    const currentlyActive = parent.getElementsByClassName("active");
                    if (currentlyActive.length > 0) {
                        currentlyActive[0].classList.remove("active");                        
                    }

                    // set currently clicked row to active
                    this.classList.add("active");

                    // get workout ID and update the workout container
                    const workoutID = this.getAttribute("workout-id");
                    loadWorkout(workoutID, exerciseContainer, formFlag);
                });
            })

            // Append list to the list container
            workout_list.forEach(workout => {
                list_container.append(workout);
            })
            program_container.append(list_container);
            // Append program container to the page
            document.querySelector(workoutContainer).append(program_container);

            if (!(todayWorkoutId == "")) loadWorkout(todayWorkoutId, exerciseContainer, formFlag);
        }
        
    })
}

function loadWorkout(workoutId, containerId, formFlag) {
    fetch(`workout/${workoutId}/exercises`)

    .then(response => response.json())
    .then(data => {
        if(data.error) {
            console.log("Error fetching workout details");
        } else {
            // Erase current workout details
            document.querySelector(containerId).innerHTML = "";

            // Create the card container
            const workout_container = document.createElement('div');
            workout_container.classList.add("card", "workout-card");
            workout_container.setAttribute("data-bs-theme", "dark");
            workout_container.setAttribute("style", "width: 18rem;");

            // Create card header row
            const workout_header = document.createElement('div');
            workout_header.classList.add("card-header");
            workout_header.innerHTML = data["workout"].name;
            // Append header
            workout_container.append(workout_header);

            // Create list container
            const list_container = document.createElement('ul');
            list_container.classList.add("list-group", "list-group-flush");

            // Populate list elements with exercises
            data["exercises"].forEach(exercise => {
                const row = document.createElement('li');
                row.classList.add("list-group-item");
                row.innerHTML = exercise["name"];
                list_container.append(row);
            })
            // Append to workout container
            workout_container.append(list_container);

            // Append to main div
            document.querySelector(containerId).append(workout_container);

            if (formFlag) loadForm(data["exercises"], '#journal-form');
        }
    })
}

function loadForm(exercises, formContainerId) {
    // Erase current form
    document.querySelector(formContainerId).innerHTML = "";

    // Create new form
    const form = document.createElement('form');
    form.setAttribute("data-bs-theme", "dark");
    form.setAttribute("id", "entry-form");

    // Exercise counter to help with exercises in labels and tags
    var exCount = 0;

    exercises.forEach(exercise => {
        const fieldContainer = document.createElement('div');
        fieldContainer.classList.add("row", "g-3");
        
        // Append other exercise fields
        fieldContainer.append(returnExerciseForm(exercise, exCount));

        // Append exercise to form
        form.append(fieldContainer);
        exCount++;
    })

    const container = document.createElement('div');
    container.classList.add("col-md-auto");

    const submitButton = document.createElement('button');
    submitButton.classList.add("btn", "btn-primary");
    submitButton.innerHTML = "Add Entry";

    container.append(submitButton);

    form.append(container);
    form.addEventListener("submit", event => {
        event.preventDefault();
        submitEntryForm();
    });

    document.querySelector(formContainerId).append(form);
}

function returnExerciseForm(exercise, exCount) {
    // Create container
    const container = document.createElement('div');
    container.classList.add("col-auto");

    // Exercise label
    const label = document.createElement('label');
    label.setAttribute("for", "exercise" + exCount);
    label.classList.add("visually-hidden");
    label.innerHTML = "Exercise";

    // Exercise name field
    const exerciseName = document.createElement('input');
    exerciseName.classList.add("form-control-plaintext");
    exerciseName.setAttribute("type", "text");
    exerciseName.setAttribute("readonly", "readonly");
    exerciseName.setAttribute("id", "exercise" + exCount);
    exerciseName.setAttribute("value", exercise["name"]);

    container.append(label);
    container.append(exerciseName);

    // Container to hold the sets, reps, and intensity fields
    const fieldRow= document.createElement('div');
    fieldRow.classList.add("row", "g-2", "exercise-form");

    // Hidden field containing exercise ID
    const idTag = document.createElement('input');
    idTag.classList.add("exercise-id");
    idTag.setAttribute("type", "hidden");
    idTag.setAttribute("name", exercise["name"]);
    idTag.setAttribute("value", exercise["id"]);

    fieldRow.append(idTag);

    // Append fields to form
    fieldRow.append(returnExerciseInputFieldsForm("Sets", exCount));
    fieldRow.append(returnExerciseInputFieldsForm("Reps", exCount));
    fieldRow.append(returnExerciseInputFieldsForm("Intensity", exCount));

    container.append(fieldRow);

    return container;
}

// Create numeric input fields for an exercise
function returnExerciseInputFieldsForm(fieldType, exCount) {
    const container = document.createElement('div');
    container.classList.add("col-auto");

    const setField = document.createElement('input');
    setField.classList.add("form-control", fieldType);
    setField.setAttribute("type", "number");
    setField.setAttribute("min", 0);
    if (fieldType === "Intensity") {
        setField.setAttribute("step", "0.5");
    } else {
        setField.setAttribute("max", 100);
        setField.setAttribute("step", "1");
    }
    setField.setAttribute("placeholder", fieldType);

    container.append(setField);
    return container;
}


function submitEntryForm() {
    valid = true;

    form = document.querySelector('#entry-form');
    exercises = form.querySelectorAll('.exercise-form');

    exercises.forEach(container => {
        id = container.querySelector('.exercise-id');
        sets = container.querySelector('.Sets');
        reps = container.querySelector('.Reps');
        intensity = container.querySelector('.Intensity');

        valid = validateEntries([sets, reps, intensity]);
    })

    if (valid) {
        data = []
        exercises.forEach(container => {
            var exercise = new Object();
            exercise.id = container.querySelector('.exercise-id').value;
            exercise.sets = container.querySelector('.Sets').value;
            exercise.reps = container.querySelector('.Reps').value;
            exercise.intensity = container.querySelector('.Intensity').value;
            data.push(exercise);
        })

        submitEntries(data);
    }

}


function validateEntries(elements) {
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

function submitEntries(data) {
    fetch('entries/add', {
        method: 'POST',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            exercises: data
        })
    })

    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.log(data.error);
        } else {
            loadEntriesView();
        }
    })
}