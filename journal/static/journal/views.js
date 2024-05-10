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
    messageDiv.classList.add("alert");
    messageDiv.setAttribute("role", "alert");

    if (successFlag) {
        messageDiv.classList.add("alert-success");
    } else {
        messageDiv.classList.add("alert-danger");
    }

    messageDiv.textContent = message;
    message_container.append(messageDiv);
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