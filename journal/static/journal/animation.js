const MEDIA_BREAKPOINT = 768;
let currentViewWidth, belowBreakpoint;

function an_init() {
    currentViewWidth = window.innerWidth;
    
    if (currentViewWidth < MEDIA_BREAKPOINT) {
        belowBreakpoint = true;
    } else {
        belowBreakpoint = false;
    }

    window.addEventListener('resize', an_updateVisibility);
    window.addEventListener('popstate', an_updateVisibility);
}

function an_updateVisibility() {
    currentViewWidth = window.innerWidth;
    // cross breakpoint to a larger screen width
    if (belowBreakpoint && (currentViewWidth >= MEDIA_BREAKPOINT)) {
        an_toggleLargeScreenAnimations();
        belowBreakpoint = !belowBreakpoint;
    }

    // cross breakpoint to a smaller screen width
    if (!belowBreakpoint && (currentViewWidth < MEDIA_BREAKPOINT)) {
        an_toggleSmallerScreenAnimations();
        belowBreakpoint = !belowBreakpoint;
    }
};


function an_toggleLargeScreenAnimations() {
    const workouts = jvWorkouts.querySelectorAll('.list-group-item');
    workouts.forEach(workout => {
        workout.style.display = "block";
    });
}


function an_toggleSmallerScreenAnimations() {
    const workouts = jvWorkouts.querySelectorAll('.list-group-item');
    workouts.forEach(workout => {
        if (!workout.classList.contains('active') || workout.classList.contains('fade-out')) {
            workout.style.display = "none";
        }
    });
}

function an_setupJournalViewAnimations() {
    if (belowBreakpoint) {
        jvWorkouts.dataset.toggle = true;
        const workouts = jvWorkouts.querySelectorAll('.list-group-item');
        workouts.forEach(workout => {
            if (!workout.classList.contains('active')) {
                workout.style.display = "none";
            }
        });
    }
}