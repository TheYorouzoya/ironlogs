function loadProgramView() {
    // display program view
    toggleView(PROGRAM_VIEW);

    emptyProgramView();
    loadAllPrograms();
}

function loadAllPrograms() {
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
                    const parent = this.parentNode;

                    const currentlyActive = parent.getElementsByClassName("active");
                    if (currentlyActive.length > 0) {
                        currentlyActive[0].classList.remove("active");
                    }

                    this.classList.add("active");

                    loadProgram(this.getAttribute("program-id"), '#program-view-program-container', '#program-view-workout-container', false);
                })
                list_container.append(programItem);
            })

            program_container.append(list_container);
            document.querySelector('#program-view-program').append(program_container);
        }
    })
}

function emptyProgramView() {
    document.querySelector('#program-view-program').innerHTML = "";
    document.querySelector('#program-view-program-container').innerHTML = "";
    document.querySelector('#program-view-workout-container').innerHTML = "";

    document.querySelector('#program-view-program-form').innerHTML = "";
    document.querySelector('#program-view-workout-form').innerHTML = "";
    document.querySelector('#program-view-exercise-form').innerHTML = "";

}

function addProgramForm() {
    document.querySelector('#program-view-content').style.display = 'none';
    document.querySelector('#program-view-header').textContent = "Add a Program";
    generateProgramForm();
}

function generateProgramForm() {
    document.querySelector('#program-add-button').style.display = 'none';
    const form_container = document.querySelector('#program-view-program-form');
    form_container.innerHTML = "";

    const nameField = returnTextInputField(
        "Program Name", 
        "program-name", 
        "Add a suitable name for your program (up to 120 characters long).",
        false
    );

    const descriptionField = returnTextInputField(
        "Program Description",
        "program-description",
        "Give your program a brief description (up to 2000 characters).",
        true
    );
    
    form_container.append(nameField, descriptionField);

    const submit_button = document.createElement('div');
    submit_button.classList.add("btn", "btn-primary");
    submit_button.innerHTML = 'Add Program';

    submit_button.addEventListener('click', () => {
        submitProgramForm();
    })

    form_container.append(submit_button);

    const cancel_button = document.createElement('div');
    cancel_button.classList.add("btn", "btn-danger");
    cancel_button.innerHTML = 'Cancel';
    
    cancel_button.addEventListener('click', function () {
        document.querySelector('#program-view-program-form').innerHTML = "";
        document.querySelector('#program-view-content').style.display = 'block';
        document.querySelector('#program-view-header').textContent = "Your Programs";
        document.querySelector('#program-add-button').style.display = 'block';
    })

    form_container.append(cancel_button);
}

function submitProgramForm() {
    const name_container = document.querySelector('#program-name');
    const program_name = name_container.value;
    const program_description = document.querySelector('#program-description').value;

    // Ensure program name isn't empty
    if (program_name.trim().length === 0) {
        name_container.classList.add("is-invalid");
        const feedback = document.createElement('div');
        feedback.classList.add("col-auto", "invalid-feedback");
        feedback.innerHTML = "Program name cannot be empty";
        name_container.parentNode.append(feedback);
        return;
    }

    // Submit form to server
    fetch(`program/`, {
        method: 'POST',
        headers: {
            "X-CSRFToken": CSRF_TOKEN
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            "program-name": program_name,
            "program-description": program_description
        })
    })

    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            displayMessage(data.message, true);
            hideFormAndDisplayNewProgram(data["programId"], program_name, program_description);
        }
    })
}


function hideFormAndDisplayNewProgram(programId, programName, programDescription) {
    emptyProgramView();

    displayProgram(programId, programName, programDescription);

}


function displayProgram(pId, pName, pDesc) {
    document.querySelector('#program-view-content').style.display = 'block';
    const pContainer = document.querySelector('#program-view-program');
    const nameHeading = document.createElement('div');
    nameHeading.classList.add("display-6");
    nameHeading.setAttribute("id", "active-program");
    nameHeading.dataset.id = pId;
    nameHeading.textContent = pName;
    
    const pDescription = document.createElement('div');
    pDescription.textContent = pDesc;

    pContainer.append(nameHeading, pDescription);
}