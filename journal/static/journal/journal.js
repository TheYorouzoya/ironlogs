let jvHeader, jvWorkouts, jvSearchBar, jvEntryForms, jvSubmit;

function jv_init() {
    jvHeader = document.querySelector('#jvHeader');
    jvWorkouts = document.querySelector('#jvWorkouts');
    jvSearchBar = document.querySelector('#jvSearchBar');
    jvEntryForms = document.querySelector('#jvEntryForms');
    jvSubmit = document.querySelector('#jvSubmit');

    jvSubmit.addEventListener('click', async function () {
        if(await util_submitEntriesForm("jvEntryForms")) {
            history.pushState({"view": ENTRIES_VIEW}, '', '#entries');
            loadEntriesView();
        };
    })
};

async function loadJournalView() {
    toggleView(JOURNAL_VIEW);
    emptyJournalView();

    jvSubmit.style.display = "none";

    await jv_loadCurrentProgramWorkouts();
}

function emptyJournalView() {
    jvHeader.innerHTML = "";
    jvWorkouts.innerHTML = "";
    jvSearchBar.innerHTML = "";
    jvEntryForms.innerHTML = "";
}


async function jv_loadCurrentProgramWorkouts() {
    const apiResponse = await fetch(`program/current/workouts`)
    const data = await apiResponse.json();

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

    const workoutCard = document.createElement('div');
    workoutCard.classList.add("card", "workout-card");
    workoutCard.setAttribute("data-bs-theme", "dark");

    const cardHeader = document.createElement('div');
    cardHeader.classList.add("card-header");
    cardHeader.innerHTML = program.name;

    workoutCard.append(cardHeader);

    const workoutList = document.createElement('div');
    workoutList.classList.add("list-group", "list-group-flush");

    const template = [];

    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].forEach(day => {
        const row = document.createElement('button');
        row.classList.add("list-group-item", "list-group-item-action");
        row.innerHTML = day + " - Rest";
        template.push(row);
    });

    jvHeader.innerHTML = `<div class="display-6">Today: Rest</div>`;

    let today = new Date();
    jvEntryForms.dataset.day = "";
    today = today.getDay();
    today = today == 0 ? 6 : today - 1;

    workouts.forEach(workout => {
        workout["days"].forEach(dayObj => {
            const day = dayObj["dayNum"];
            const dayName = dayObj["day"];
            template[day].innerHTML = dayName + " - " + workout["name"];
            template[day].dataset.workoutId = workout["id"];
            template[day].setAttribute("id", "jvWorkoutRow" + day);
            if (day == today) {
                template[day].classList.add("active");
                jvHeader.innerHTML = `<div class="display-6">Today's Workout: ${workout["name"]}</div>`;
                jvEntryForms.innerHTML = "";
                jv_returnWorkoutExerciseForms(workout["id"]).then(list => {
                    list.forEach(entry => jvEntryForms.append(entry));
                });
            }
            template[day].addEventListener('click', function() {
                history.pushState(
                    {
                        "view": JOURNAL_VIEW,
                        "workoutRow": this.getAttribute("id"),
                    },
                    '',
                    '#home'
                )
                jv_cardClickListener(this);
            });
        });
    });

    template.forEach(row => {
        workoutList.append(row);
    })
    workoutCard.append(workoutList);
    jvWorkouts.append(workoutCard);
    jv_loadSearchBar();
}


function jv_cardClickListener (target) {
    const parent = target.parentNode;
    const workoutId = target.dataset.workoutId;
    const active = parent.getElementsByClassName('active');
    if (active.length > 0) {
        active[0].classList.remove("active");
    }
    target.classList.add("active");


    jvEntryForms.innerHTML = "";
    jv_returnWorkoutExerciseForms(workoutId).then(list => {
        list.forEach(entry => jvEntryForms.append(entry));
    });
}


function jv_entryFormCloseButtonListener (target) {
    const element = target.parentNode.parentNode;
    if (element.parentNode.childElementCount <= 1) {
        jvSubmit.style.display = "none";
    }
    element.remove();
}


function jv_returnWorkoutExerciseForms(workoutId) {
    return fetch(`workout/${workoutId}/exercises`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            const exercises = data["exercises"];
            if (exercises.length > 0) {
                jvSubmit.style.display = "flex";
            }
            let entryList = [];

            exercises.forEach(exercise => {
                const entry = util_returnExerciseEntryForm(exercise, jv_entryFormCloseButtonListener);
                entryList.push(entry);
            });
            return entryList;
        }
    })
}


function jv_loadSearchBar() {
    jvSearchBar.innerHTML = "";
    const searchForm = util_returnAutocompleteWorkoutExerciseSearchForm(
        "journalSearchBar", 
        function (target, workoutFlag) {
            jv_searchBarListener(target, workoutFlag);
            document.querySelector('#journalSearchBar').innerHTML = "";
        }
    );
    jvSearchBar.append(searchForm);
}


function jv_searchBarListener(target, workoutFlag) {
    const id = target.dataset.id;
    const name = target.textContent;

    if(workoutFlag) {
        fetch(`workout/${id}/exercises`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                displayMessage(data.error, false);
            } else {
                const exercises = data["exercises"];
                exercises.forEach(exercise => {
                    const form = util_returnExerciseEntryForm(exercise, jv_entryFormCloseButtonListener);
                    jvEntryForms.append(form);
                })
            }
        })
    } else {
        jvEntryForms.append(util_returnExerciseEntryForm({"id": id, "name": name}, jv_entryFormCloseButtonListener));
    }

    jvSubmit.style.display = "flex";
}

