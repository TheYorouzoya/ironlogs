from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes

    # Program APIs
    path("program/", views.program, name="program"),
    path("program/all/", views.allPrograms, name="allPrograms"),
    path("program/<str:programId>", views.fetchProgram, name="fetchProgram"),

    # For a singular workout
    path("workout/<str:workoutId>", views.workout, name="workout"),
    
    # For a singular entry
    path("entry/", views.entry, name="entry"),
    path("entry/all/<str:exerciseId>", views.exerciseEntries, name="exerciseEntries"),

    # For bulk handling of entries
    path("entries/", views.entries_api, name="entriesAPI"),
    path("entries/calendar/", views.entries_calendar, name="entriesCalendar"),
    path("entries/add", views.addEntries, name="entries"),
]