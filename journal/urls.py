from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("isLogged", views.check_login, name="isLogged"),

    # API Routes

    # Program
    path("program/", views.program, name="program"),
    path("program/all/", views.allPrograms, name="allPrograms"),
    path("program/current/", views.currentProgram, name="currentProgram"),
    path("program/<str:programId>/workouts", views.programWorkouts, name="programWorkouts"),

    # Workouts
    path("workout/", views.workout, name="workout"),
    path("workout/<str:workoutId>/exercises", views.workoutExercises, name="workoutExercises"),
    path("workout/<str:workoutId>/day", views.workoutDay, name="workoutDay"),
    path("workout/exercise/add", views.addExerciseToWorkout, name="addExerciseToWorkout"),
    
    # Bodyparts
    path("bodypart/all", views.allBodyparts, name="allBodyparts"),
    path("bodypart/count/range/", views.bodypartInRange, name="bodypartInRange"),

    # For a singular entry
    path("entry/", views.entry, name="entry"),
    path("entry/all/<str:exerciseId>", views.exerciseEntries, name="exerciseEntries"),

    # For bulk handling of entries
    path("entries/range/", views.entriesInRange, name="entriesInRange"),
    path("entries/calendar/", views.entries_calendar, name="entriesCalendar"),
    path("entries/add", views.addEntries, name="entries"),

    # For bulk handling of exercises
    path("exercise/", views.exercise, name="exercise"),
    path("exercises/add/", views.addExercises, name="addExercises"),
    path("exercises/filter/", views.filterExercises, name="filterExercises"),

    # Search Routes
    path("search/exercises/", views.searchExercises, name="suggestExercises"),
    path("search/workoutandexercises/", views.searchWorkoutAndExercises, name="searchWorkoutAndExercises")
]