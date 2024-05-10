var pvHeader, pvButtons, pvForms, pvContent;
document.addEventListener('DOMContentLoaded', function() {
    pvHeader = document.querySelector('#program-view-header');
    pvButtons = document.querySelector('#program-view-buttons');
    pvForms = document.querySelector('#program-view-form-container');
    pvContent = document.querySelector('#program-view-content');
});

function loadProgramView() {
    // display program view
    toggleView(PROGRAM_VIEW);

    emptyProgramView();
    pv_loadAllPrograms();
}

function emptyProgramView() {
    pvHeader.innerHTML = "";
    pvButtons.innerHTML = "";
    pvForms.innerHTML = "";
    pvContent.innerHTML = "";
}

function pv_loadAllPrograms() {
    fetch('program/all/')
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.log(data.error);
        } else {
            const program_container = document.createElement('div');
            program_container.classList.add("card", "program-card");
            program_container.setAttribute("data-bs-theme", "dark");

            const list_container = document.createElement('div');
            list_container.classList.add("list-group", "list-group-flush");

            data["programs"].forEach(program => {
                const programItem = document.createElement('div');
                programItem.classList.add("list-group-item", "list-group-item-action");
                programItem.setAttribute("program-id", program["id"]);

                const programHeading = document.createElement('div');
                programHeading.classList.add("d-flex", "w-100", "justify-content-between");
                programHeading.innerHTML = `<h5 class="mb-1">${program["name"]}</h5>`;

                const programContent = document.createElement('p');
                programContent.classList.add("mb-1");
                programContent.innerHTML = program["description"];

                programItem.append(programHeading);
                programItem.append(programContent);

                programItem.addEventListener('click', function () {
                    pv_loadProgram(this.getAttribute("program-id"));
                })
                list_container.append(programItem);
            })

            program_container.append(list_container);
            pvContent.append(program_container);
        }
    })
}

function pv_loadProgram(pId) {
    fetch(`program/?id=${pId}`)
    
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            pvContent.innerHTML = "";
            const program = data["program"]

            pvHeader.textContent = program.name;

            const pDescription = document.createElement('div');
            pDescription.classList.add("pvProgramDescription");
            pDescription.textContent = program.description;

            pvContent.append(pDescription);
            pvButtons.append(returnButton("info", "Back", function() {
                loadProgramView();
            }))


        }
    })
}


