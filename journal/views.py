from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.shortcuts import HttpResponseRedirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
import json
import datetime
import itertools

from .models import *


def index(request):
    
    # Authenticated users view their journals
    if request.user.is_authenticated:
        return render(request, "journal/journal.html")    
    
    # Everyone else if prompted to log in
    else:
        return HttpResponseRedirect(reverse("login"))


def login_view(request):
    if request.method == "POST":

        # Attempt to sign the user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication is successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "journal/login.html", {
                "message": "Invalid login credentials"
            })
    
    else:
        return render(request, "journal/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        
        if password != confirmation:
            return render(request, "journal/register.html", {
                "message": "Passwords must match"
            })
        
        # Try to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "journal/register.html", {
                "message": "Username already exists."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "journal/register.html")


# API Routes

@login_required
def program(request):
    if request.method == "POST":
        data = json.loads(request.body)
        programName = data["name"]
        programDescription = data["description"]

        if (not (programName.strip())):
            return JsonResponse({
                "error": "Program name cannot be empty!"
            }, status=400)
        
        program = Program.objects.create(
            trainee=request.user, 
            name=programName, 
            description=programDescription
            )
        program.save()

        return JsonResponse({
            "message": "Successfully created program " + programName,
            "programId": program.id
        }, status=201)
    
    elif request.method == "GET":
        id = request.GET.get("id")
        try:
            program = Program.objects.get(id=id, trainee=request.user)
        except Program.DoesNotExist:
            return JsonResponse({
                "error": "Program does not exist"
            }, status=404)

        return JsonResponse({
            "program": program.serialize()
        }, status=200)
    
    elif request.method == "PUT":
        data = json.loads(request.body)
        print(data)
        id = data["id"]
        name = data["name"]
        description = data["description"]

        try:
            program = Program.objects.get(id=id, trainee=request.user)
        except Program.DoesNotExist:
            return JsonResponse({
                "error": "Program does not exist"
            }, status=404)

        program.name = name
        program.description = description
        program.save()

        return JsonResponse({
            "message": "Successfully updated program details"
        }, status=200)
    
    elif request.method == "DELETE":
        id = request.GET.get("id")
        try:
            program = Program.objects.get(id=id, trainee=request.user)
        except Program.DoesNotExist:
            return JsonResponse({
                "error": "Program does not exist!"
            })
        
        
        if (request.user.current_program == program):
            request.user.current_program = None
            request.user.save()

        program.delete()

        return JsonResponse({
            "message": "Program deleted successfully"
        }, status=200)



@login_required
def programWorkouts(request, programId):
    if (programId == 'current'):    
        try:
            program = request.user.current_program
        except Program.DoesNotExist:
            return JsonResponse({
                "message": "User has no active programs."
                }, status=204)
    else:
        try:
            program = Program.objects.get(id=programId)
        except Program.DoesNotExist:
            return JsonResponse({
                "error": "No such program with the given ID"
            })
    
    workouts = Workout.objects.filter(trainee=request.user, program=program)

    return JsonResponse({
        "program": program.serialize(),
        "workouts": [workout.serialize() for workout in workouts]
        }, safe=False)


@login_required
def allPrograms(request):
    programs = Program.objects.filter(trainee=request.user)

    return JsonResponse({
        "programs": [program.serialize() for program in programs]
    }, safe=False)


@login_required
def workout(request):
    pass


login_required
def addWorkoutDay(request, workoutId):
    if (request.method != 'POST'):
        return JsonResponse({
            "error": "POST request required"
        }, status=405)
    
    try:
        workout = Workout.objects.get(id=workoutId)
    except Workout.DoesNotExist:
        return JsonResponse({
            "error": "Requested workout does not exist"
        }, status=404)
    
    data = json.loads(request.body)
    
    try:
        dayNum = int(data["day"])
    except ValueError:
        return JsonResponse({
            "error": "Received day field is not a number"
        }, status=400)

    try:
        day = Day.objects.get(day=dayNum)
    except Day.DoesNotExist:
        return JsonResponse({
            "error": "Given day is outside the 0-6 range"
        }, status=400)

    workout.day.add(day)
    workout.save()

    return JsonResponse({
        "message": f"Successfully added {workout.name} on {day.get_day_display()}"
    }, status=201)


@login_required
def workoutExercises(request, workoutId):
    try:
        workout = Workout.objects.get(id=workoutId)
    except Workout.DoesNotExist:
        return JsonResponse({
            "error": "Workout does not exist"
        }, status=404)
    
    exercises = Exercise.objects.filter(workout=workout)
    
    return JsonResponse({
        "workout": workout.serialize(),
        "exercises": [exercise.serialize() for exercise in exercises]
        }, safe=False)


@login_required
def fetchWorkouts(request, programId):
    pass
        

@login_required
def entry(request):
    pass

@login_required
def addEntries(request):
    # Adding entries must be done via POST
    if request.method != 'POST':
        return JsonResponse({
            "error": "POST request required"
        }, status=400)
    
    data = json.loads(request.body)

    for entry in data.get("exercises"):
        exerciseId = entry["id"]
        sets = entry["sets"]
        reps = entry["reps"]
        intensity = entry["intensity"]

        try:
            exercise = Exercise.objects.get(id=exerciseId)
            
        except Exercise.DoesNotExist:
            return JsonResponse(
                {"error": "Exercise with id" + exerciseId + "does not exist"},
                status=404)

        newEntry = Entry(
            trainee=request.user,
            exercise=exercise,
            sets=sets,
            reps=reps,
            intensity=intensity
        )
        newEntry.save()

    return JsonResponse({"message": "Entries added successfully"}, status=201)


@login_required
def entries_calendar(request):
    try:
        year = int(request.GET.get("year"))
        month = int(request.GET.get("month"))
    except:
        return JsonResponse({
            "error": "Invalid year/month value"
        }, status=400)

    dates = Entry.objects.filter(
        trainee=request.user, 
        timestamp__year=year, 
        timestamp__month=month
        ).dates('timestamp', 'day')
    
    payload = [entry.day for entry in dates]

    return JsonResponse({
        "dates": payload
    }, status=200)


@login_required
def entries_api(request):

    try:
        end_date = returnDate(request.GET.get("endDate"), datetime.date.today())
        start_date = returnDate(request.GET.get("startDate"), end_date - datetime.timedelta(days = end_date.weekday()))
    except ValueError:
        return JsonResponse({
            "error": "Invalid arguments to start or end date"
        }, status=400)

    entries = Entry.objects.filter(
        trainee=request.user,
        timestamp__range=((start_date, end_date))
        ).order_by("-timestamp")
    
    iter = itertools.groupby(entries, lambda entry : entry.timestamp)

    payload = [{
        "date": day.strftime('%Y-%m-%d'),
        "entries": list(e.serialize() for e in entries)
        } for day, entries in iter]

    return JsonResponse(({
            "payload": payload
        }), status=200)

# return a datetime object for a given date json
def returnDate(dateJson, default):
    if dateJson:
        data = dateJson.split("-")
        try:
            year = int(data[0])
            month = int(data[1])
            day = int(data[2])
        except:
            raise ValueError
        
        return datetime.datetime(year, month, day)
    
    return default


@login_required
def exerciseEntries(request, exerciseId):
    exercise = Exercise.objects.get(id=exerciseId)
    entries = Entry.objects.filter(trainee=request.user, exercise=exercise).order_by("-timestamp")

    return JsonResponse({
        "exercise": exercise.name,
        "entries": [entry.serialize() for entry in entries]
    }, safe=False)



    