var evHeader, evForms, evContent;

document.addEventListener('DOMContentLoaded', function () {
    evHeader = document.querySelector('#evHeader');
    evForms = document.querySelector('#evForms');
    evContent = document.querySelector('#evContent');
})


function loadExerciseView() {
    // display journal view
    toggleView(EXERCISES_VIEW);

    emptyExerciseView();
    ev_loadAllExercises();

}


function emptyExerciseView() {
    evHeader.innerHTML = "";
    evForms.innerHTML = "";
    evContent.innerHTML = "";
}


function ev_loadAllExercises() {
    const DEFAULT_PAGE_NUMBER = 1;
    const QUERY = "";
    ev_loadDefaultForms();
    ev_loadExerciseTableWithGivenQuery(QUERY, DEFAULT_PAGE_NUMBER);
}

function ev_loadExerciseTableWithGivenQuery(query, pageNum) {
    fetch(`exercises/filter/?pageNum=${pageNum}&${query}`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            ev_loadExerciseTable(data, pageNum, query);
        }
    })
}


function ev_loadExerciseTable(ex_Data, currentPage, currentQuery) {
    evContent.innerHTML = "";

    const backButton = returnButton("info", "All Exercises", function () {
        ev_loadAllExercises();
    });
    evContent.append(backButton);

    const tContainer = document.createElement('div');
    tContainer.setAttribute("id", "evTableContainer");

    const table = document.createElement('table');
    table.classList.add("table", "table-hover");
    
    const tHead = document.createElement('thead');
    tHead.innerHTML = `
        <tr>
            <th scope="col">Exercise</th>
            <th scope="col">Body Part</th>
            <th scope="col">Workout</th>
            <th scope="col">Program</th>
        </tr>
    `;

    const tBody = document.createElement('tbody');
    ex_Data["exercises"].forEach(exercise => {
        var td;
        const row = document.createElement('tr');

        td = document.createElement('td');
        const cont = document.createElement('div');
        cont.dataset.exerciseId = exercise["id"];
        cont.textContent = exercise["name"];
        cont.addEventListener('click', function () {
            ev_loadExercise(this.dataset.exerciseId);
        });
        td.append(cont);

        row.append(td);
        
        td = document.createElement('td');
        exercise["bodyparts"].forEach(bodypart => {
            const link = document.createElement('div');
            link.dataset.bodypartId = bodypart["id"];
            link.textContent = bodypart["name"];
            link.addEventListener('click', function () {
                ev_loadExerciseTableWithGivenQuery(`bodypart=${this.dataset.bodypartId}`, 1);
            });
            td.append(link);
        });
        
        row.append(td);

        td = document.createElement('td');
        exercise["workouts"].forEach(workout => {
            const link = document.createElement('div');
            link.dataset.workoutId = workout["id"];
            link.textContent = workout["name"];
            link.addEventListener('click', function() {
                ev_loadExerciseTableWithGivenQuery(`workout=${this.dataset.workoutId}`, 1);
            });
            td.append(link);
        });
        
        row.append(td);

        td = document.createElement('td');
        exercise["programs"].forEach(program => {
            const link = document.createElement('div');
            link.dataset.programId = program["id"];
            link.textContent = program["name"];
            link.addEventListener('click', function() {
                ev_loadExerciseTableWithGivenQuery(`program=${this.dataset.programId}`, 1);
            });
            td.append(link);
        });

        row.append(td);
        tBody.append(row);
    });
    table.append(tHead, tBody);
    tContainer.append(table);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add("d-flex", "justify-content-end");

    if (ex_Data["hasPrevious"]) {
        const previous = returnButton("info", "Previous", function () {
            ev_loadExerciseTableWithGivenQuery(currentQuery, currentPage - 1);
        });
        buttonContainer.append(previous);
    }

    if (ex_Data["hasNext"]) {
        const next = returnButton("info", "Next", function () {
            ev_loadExerciseTableWithGivenQuery(currentQuery, currentPage + 1);
        });
        buttonContainer.append(next);
    }

    tContainer.append(buttonContainer);
    evContent.append(tContainer);
}


function ev_loadDefaultForms() {
    evForms.innerHTML = "";
    const searchForm = document.createElement('form');
    searchForm.classList.add("row", "form-control");
    searchForm.textContent = "Lookup Exercise:";

    const searchInput = document.createElement('input');
    searchInput.classList.add("form-control");
    searchInput.setAttribute("type", "text");
    searchInput.setAttribute("autocomplete", "off");
    searchInput.setAttribute("placeholder", "Search Exercise");
    searchInput.setAttribute("aria-label", "exercise search bar");
    
    searchInput.addEventListener('keyup', function () {
        ev_fetchSearchResults(this.value);
    })

    const searchResults = document.createElement('div');
    searchResults.setAttribute("id", "evSearchResults");

    searchForm.append(searchInput, searchResults);

    evForms.append(searchForm);
}

function ev_fetchSearchResults(searchQuery) {
    fetch(`exercises/search/?q=${searchQuery}`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            const container = document.querySelector('#evSearchResults');
            const results = data["results"]
            const resultList = document.createElement('ul');
            resultList.classList.add("list-group", "list-group-flush");

            results.forEach(exercise => {
                const item = document.createElement('li');
                item.classList.add("list-group-item", "list-group-item-action");
                item.dataset.exerciseId = exercise["id"];
                item.textContent = exercise["name"];
                item.addEventListener('click', function () {
                    ev_loadExercise(this.dataset.exerciseId);
                })
                resultList.append(item);
            })

            container.innerHTML = "";
            container.append(resultList);
        }
    })
}


function ev_loadExercise(exerciseId) {
    fetch(`exercise/?id=${exerciseId}`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            const exercise = data["exercise"];
            emptyExerciseView();
            
            const header = document.createElement('div');
            header.classList.add("row");

            const subhead1 = document.createElement('div');
            const heading = document.createElement('div');
            heading.classList.add("display-6");
            heading.textContent = exercise["name"];
            
            const bodyparts = document.createElement('div');
            exercise["bodypart"].forEach(bodypart => {
                const span = document.createElement('span');
                span.classList.add("badge", "rounded-pill", "text-bg-info");
                span.textContent = bodypart["name"];
                bodyparts.append(span);
            });

            subhead1.classList.add("col");
            subhead1.append(heading, bodyparts);

            const subhead2 = document.createElement('div');
            const wrapper = document.createElement('div');
            const backButton = returnButton("info", "Back", function () {
                ev_loadAllExercises();
            });
            wrapper.append(backButton);
            subhead2.append(wrapper);
            subhead2.classList.add("d-flex", "justify-content-end", "col");

            header.append(subhead1, subhead2);

            const body = document.createElement('div');
            body.textContent = exercise["description"];

            evContent.append(header, body);
        }
    })
}