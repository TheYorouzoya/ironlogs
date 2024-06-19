const JOURNAL_VIEW = 0;
const PROGRAM_VIEW = 1;
const EXERCISES_VIEW = 2;
const ENTRIES_VIEW = 3;

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

    document.querySelector('#entries-form').addEventListener('submit', event => {
        event.preventDefault();
        submitEntriesForm(event);
    });

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
    fetch(`exercises/search/?q=${searchQuery}`)
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
                    listenerFunction(this);
                })
                resultList.append(item);
            })

            container.innerHTML = "";
            container.append(resultList);
        }
    })
}