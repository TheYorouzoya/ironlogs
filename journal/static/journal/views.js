const JOURNAL_VIEW = 0;
const PROGRAM_VIEW = 1;
const EXERCISES_VIEW = 2;
const ENTRIES_VIEW = 3;

const CLOSE_BUTTON_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="min-width: 24px"  fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
    </svg>
`;

const EDIT_BUTTON_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="min-width: 24px" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
        <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
    </svg>
`;

const ADD_BUTTON_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="min-height: 20px; min-width: 20px" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
    </svg>
`;

const REMOVE_BUTTON_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="min-width:24px" fill="currentColor" class="bi bi-dash-circle" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
        <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>
    </svg>
`;

const d = new Date();
const today = getPythonDay(d.getDay());

function getPythonDay(day) {
    if (day == 0) {
        return 6;
    } else {
        return day - 1;
    }
}

// load respective views when clicked on the nav
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#entries').addEventListener('click', () => {
        loadEntriesView();
    });
    document.querySelector('#journal').addEventListener('click', () => {
        loadJournalView();
    });
    document.querySelector('#exercises').addEventListener('click', () => {
        loadExerciseView();
    });
    document.querySelector('#program').addEventListener('click', () => {
        loadProgramView();
    })

    // By default, load the journal view
    loadJournalView();
});




function toggleView(viewIndex) {
    var viewValues = ["none", "none", "none", "none"];
    viewValues[viewIndex] = "block";

    document.querySelector('#journal-view').style.display = viewValues[JOURNAL_VIEW];
    document.querySelector('#program-view').style.display = viewValues[PROGRAM_VIEW];
    document.querySelector('#exercises-view').style.display = viewValues[EXERCISES_VIEW];
    document.querySelector('#entries-view').style.display = viewValues[ENTRIES_VIEW];
}


function displayMessage(message, successFlag) {
    const message_container = document.querySelector('#message');
    // Clear any previous messages
    message_container.innerHTML = "";

    const messageDiv = document.createElement('div');
    messageDiv.classList.add(
        "toast",
        "align-items-center",
        "border-0"
    );
    messageDiv.setAttribute("role", "alert");
    messageDiv.setAttribute("aria-live", "assertive");
    messageDiv.setAttribute("aria-atomic", "true");
    messageDiv.setAttribute("id", "liveToast");
    messageDiv.setAttribute("autohide", "false");

    if (successFlag) {
        messageDiv.classList.add("text-bg-success");
    } else {
        messageDiv.classList.add("text-bg-danger");
    }

    const c1 = document.createElement('div');
    c1.classList.add("d-flex");
    const c2 = document.createElement('div');
    c2.classList.add("toast-body");
    c2.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.classList.add("btn-close", "btn-close-white", "me-2", "m-auto");
    closeBtn.setAttribute("type", "button");
    closeBtn.setAttribute("data-bs-dismiss", "toast");
    closeBtn.setAttribute("aria-label", "Close");
    
    c1.append(c2, closeBtn);
    messageDiv.append(c1);
    message_container.append(messageDiv);

    bootstrap.Toast.getOrCreateInstance(messageDiv).show();
}

function returnTextInputField(labelText, fieldId, helpText, textAreaFlag, preFillValue) {
    const container = document.createElement('div');
    container.classList.add("mb-3");

    const label = document.createElement('label');
    label.classList.add("form-label");
    label.setAttribute("for", fieldId);
    label.textContent = labelText;

    var input;
    if (textAreaFlag) {
        input = document.createElement('textarea');
        input.setAttribute("rows", "5");
    } else {
        input = document.createElement('input');
    }

    input.classList.add("form-control");
    input.setAttribute("id", fieldId);
    input.setAttribute("aria-describedby", fieldId + "-HelpBlock");
    input.value = preFillValue;

    const help_block = document.createElement('div');
    help_block.classList.add("form-text");
    help_block.setAttribute("id", fieldId + "-HelpBlock");
    help_block.textContent = helpText;

    container.append(label, input, help_block);
    return container;
}

function returnButton(buttonType, buttonText, buttonListener) {
    const button = document.createElement('div');
    button.classList.add("btn", "btn-outline-" + buttonType);
    button.textContent = buttonText;
    button.addEventListener('click', () => {
        buttonListener();
    })
    return button;
}

function clearMessages() {
    const message_container = document.querySelector('#message');
    // Clear any previous messages
    message_container.innerHTML = "";
}


function util_returnAutocompleteExerciseSearchForm(formId, listenerFunction) {
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
        util_fetchExerciseSearchResults(this.value, formId, listenerFunction);
    })

    const searchResults = document.createElement('div');
    searchResults.setAttribute("id", formId);

    searchForm.append(searchInput, searchResults);
    return searchForm;
}


function util_fetchExerciseSearchResults(searchQuery, formId, listenerFunction) {
    fetch(`search/exercises/?q=${searchQuery}`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayMessage(data.error, false);
        } else {
            const container = document.getElementById(formId);
            const results = data["results"]
            const resultList = document.createElement('ul');
            resultList.classList.add("list-group", "list-group-flush");

            results.forEach(exercise => {
                const item = document.createElement('li');
                item.classList.add("list-group-item", "list-group-item-action");
                item.dataset.exerciseId = exercise["id"];
                item.textContent = exercise["name"];
                item.addEventListener('click', function () {
                    container.parentNode.getElementsByTagName('input')[0].value = "";
                    listenerFunction(this);
                })
                resultList.append(item);
            })

            container.innerHTML = "";
            container.append(resultList);
        }
    })
}