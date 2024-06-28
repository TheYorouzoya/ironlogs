from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
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



#==============================================================================#
#                               PROGRAM ROUTES
#==============================================================================#

@login_required
def program(request):
    # to create a new program object
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
    
    # To get the program's details
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
    
    # to edit a program's name and description
    elif request.method == "PUT":
        data = json.loads(request.body)
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
    
    # to delete a program object
    elif request.method == "DELETE":
        id = request.GET.get("id")
        try:
            program = Program.objects.get(id=id, trainee=request.user)
        except Program.DoesNotExist:
            return JsonResponse({
                "error": "Program does not exist!"
            }, status=404)
        
        
        if (request.user.current_program == program):
            request.user.current_program = None
            request.user.save()

        program.delete()

        return JsonResponse({
            "message": "Program deleted successfully"
        }, status=200)


# returns the program and its workouts for a given program ID
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
            }, status=404)
    
    workouts = Workout.objects.filter(trainee=request.user, program=program)

    return JsonResponse({
        "program": program.serialize(),
        "workouts": [workout.serialize() for workout in workouts]
        }, safe=False)


# returns a list of all of the user's programs
@login_required
def allPrograms(request):
    programs = Program.objects.filter(trainee=request.user)

    return JsonResponse({
        "programs": [program.serialize() for program in programs]
    }, safe=False)


#==============================================================================#
#                              WORKOUT ROUTES
#==============================================================================#

@login_required
def workout(request):
    # to create a new workout object
    if (request.method == 'POST'):
        data = json.loads(request.body)

        programId = data["program"]
        workoutName = data["name"]

        if (not (workoutName.strip())):
            return JsonResponse({
                "error": "Workout name cannot be empty!"
            }, status=400)

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

        try:
            program = Program.objects.get(id=programId, trainee=request.user)
        except Program.DoesNotExist:
            return JsonResponse({
                "error": "Given program ID does not exist!"
            }, status=404)
        
        workout = Workout.objects.create(
            name=workoutName,
            program=program,
            trainee=request.user,
        )

        workout.day.add(day)
        workout.save()

        return JsonResponse({
            "message": f"Successfully added {workoutName} on {day.get_day_display()}"
        }, status=201)
    
    # to edit a workout's name
    elif request.method == 'PUT':
        data = json.loads(request.body)
        id = data["id"]
        name = data["name"]

        if (not (name.strip())):
            return JsonResponse({
                "error": "New Workout name cannot be empty!"
            }, status=400)

        try:
            workout = Workout.objects.get(id=id, trainee=request.user)
        except Program.DoesNotExist:
            return JsonResponse({
                "error": "Workout does not exist!"
            }, status=404)
        
        workout.name = name
        workout.save()

        return JsonResponse({
            "message": "Successfully updated workout name!"
        }, status=200)
    
    # to delete a workout object
    elif request.method == 'DELETE':
        id = request.GET.get("id")

        try:
            workout = Workout.objects.get(id=id, trainee=request.user)
        except Workout.DoesNotExist:
            return JsonResponse( {
                "error": "Requested workout does not exist!"
            }, status=404)
        
        workout.delete()

        return JsonResponse({
            "message": "Workout deleted successfully!"
        }, status=200) 


# allows the user to add or remove a day from a workout
@login_required
def workoutDay(request, workoutId):
    if (request.method == 'POST'):
        deleteFlag = False
    elif (request.method == 'DELETE'):
        deleteFlag = True
    else:    
        return JsonResponse({
            "error": "POST or DELETE request required"
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

    if (deleteFlag):
        workout.day.remove(day)
        message = f"Successfully removed {workout.name} on {day.get_day_display()}"
    else:
        workout.day.add(day)
        message = f"Successfully added {workout.name} on {day.get_day_display()}"

    workout.save()

    return JsonResponse({
        "message": message 
    }, status=201)


# returns a workout and all of its exercises
@login_required
def workoutExercises(request, workoutId):
    try:
        workout = Workout.objects.get(id=workoutId, trainee=request.user)
    except Workout.DoesNotExist:
        return JsonResponse({
            "error": "Workout does not exist"
        }, status=404)
    
    exercises = Exercise.objects.filter(workout=workout)
    
    return JsonResponse({
        "workout": workout.serialize(),
        "exercises": [exercise.serialize() for exercise in exercises]
        }, safe=False)


#==============================================================================#
#                             BODYPART ROUTE
#==============================================================================#

# returns all the available bodyparts
@login_required
def allBodyparts(request):
    bodyparts = BodyPart.objects.all()
    payload = [part.serialize() for part in bodyparts]

    return JsonResponse({
        "bodyparts": payload
    }, status=200)
        

#==============================================================================#
#                              ENTRY ROUTES
#==============================================================================#

@login_required
def entry(request):
    if request.method == 'PUT':
        data = json.loads(request.body)

        try:
            entry = Entry.objects.get(id=data.get("id"), trainee=request.user)
        except Entry.DoesNotExist:
            return JsonResponse({
                "error": "Requested entry with given ID does not exist!"
            }, status=404)
        
        entry.sets = data.get("sets")
        entry.reps = data.get("reps")
        entry.intensity = data.get("intensity")

        entry.save()

        return JsonResponse({
            "message": "Edited entry successfully."
        }, status=201)
    
    elif request.method == 'DELETE':
        id = request.GET.get("id")

        try:
            entry = Entry.objects.get(id=id, trainee=request.user)
        except Entry.DoesNotExist:
            return JsonResponse({
                "error": "Requested entry with given ID does not exist!"
            }, status=404)
        
        entry.delete()

        return JsonResponse({
            "message": "Removed entry successfully."
        }, status=201)


# allows the user to add entries in bulk. Usually called from the journal entry view.
# Does not do partial updates.
@login_required
def addEntries(request):
    # Adding entries must be done via POST
    if request.method != 'POST':
        return JsonResponse({
            "error": "POST request required"
        }, status=400)
    
    data = json.loads(request.body)

    try:
        date = returnDate(data.get("date"), datetime.date.today())
    except ValueError:
        return JsonResponse({
            "error": "Given date is invalid!"
        }, status=400)

    valid_entries = []

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
            intensity=intensity,
            timestamp=date
        )
        valid_entries.append(newEntry)

    for entry in valid_entries:
        entry.save()

    return JsonResponse({"message": "Entries added successfully"}, status=201)

# returns all the dates which have a journal entry for a given month
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


# returns all journal entries within a given start-end date range. If no range is
# provided, it defaults to the current week starting at monday.
@login_required
def entriesInRange(request):
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
    
    # sort entries according to timestamp
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



#==============================================================================#
#                              EXERCISE ROUTES
#==============================================================================#

@login_required
def exercise(request):
    if request.method == 'GET':
        id = request.GET.get("id")
        if (not (id.strip())):
            return JsonResponse({
                "error": "Given exercise ID is empty!"
            }, status=400)
        
        try:
            exercise = Exercise.objects.get(id=id, trainee=request.user)
        except Exercise.DoesNotExist:
            return JsonResponse({
                "error": "Exercise with given ID does not exist!"
            }, status=404)
        
        return JsonResponse({
            "exercise": exercise.serialize()
        }, status=200)
    
    elif request.method == 'PUT':
        data = json.loads(request.body)
        exerciseId = data["exerciseId"]
        workoutId = data["workoutId"]
        editFlag = data["editFlag"]

        try:
            exercise = Exercise.objects.get(id=exerciseId, trainee=request.user)
        except Exercise.DoesNotExist:
            return JsonResponse({
                "error": "Exercise with given ID doesn not exists!"
            }, status=404)
        
        try:
            workout = Workout.objects.get(id=workoutId, trainee=request.user)
        except Workout.DoesNotExist:
            return JsonResponse({
                "error": "Workout with given ID does not exist!"
            }, status=404)
        
        if (editFlag):
            exercise.workout.add(workout)
            message = f"Successfully added {exercise.name} to {workout.name} workout!"
        else:
            exercise.workout.remove(workout)
            message = f"Successfully removed {exercise.name} from {workout.name} workout!"

        return JsonResponse({
            "message": message
        }, status=201)


    # to delete an exercise object
    elif request.method == 'DELETE':
        id = request.GET.get("id")

        try:
            exercise = Exercise.objects.get(id=id, trainee=request.user)
        except Exercise.DoesNotExist:
            return JsonResponse({
                "error": "Exercise with given ID does not exist!"
            }, status=404)
        
        name = exercise.name

        exercise.delete()

        return JsonResponse({
            "message": f"Successfully removed {name} exercise!"
        }, status=201)

    
@login_required
def filterExercises(request):
    if request.method != 'GET':
        return JsonResponse({
            "error": "GET request only!"
        }, status=400)

    exercises = Exercise.objects.filter(trainee=request.user).order_by('name')
    
    partID = request.GET.get("bodypart")
    if partID:
        try:
            bodypart = BodyPart.objects.get(id=partID)
        except BodyPart.DoesNotExist:
            return JsonResponse({
                "error": "Body part with given ID does not exist!"
            }, status=404)
        exercises = exercises.filter(body_part=bodypart)

    workoutID = request.GET.get("workout")
    if workoutID:
        try:
            workout = Workout.objects.get(id=workoutID)
        except Workout.DoesNotExist:
            return JsonResponse({
                "error": "Workout with given ID does not exist!"
            }, status=404)
        exercises = exercises.filter(workout=workout)

    programID = request.GET.get("program")
    if programID:
        try:
            program= Program.objects.get(id=programID)
        except Program.DoesNotExist:
            return JsonResponse({
                "error": "Program with given ID does not exist!"
            }, status=404)
        exercises = exercises.filter(workout__program=program)
    
    pageNum = request.GET.get("pageNum")
    try:
        pageNum = int(pageNum)
    except ValueError:
        return JsonResponse({
            "error": "Page number must be an integer!"
        }, status=400)
    
    ITEMS_PER_PAGE = 10
    paginator = Paginator(exercises, ITEMS_PER_PAGE)
    
    try:
        page = paginator.page(pageNum)
    except django.core.paginator.EmptyPage:
        return JsonResponse({
            "error": "Requested page number is either empty or invalid"
        }, status=400)

    payload = [exercise.table_serialize() for exercise in page.object_list]

    return JsonResponse({
        "exercises": payload,
        "hasNext": page.has_next(),
        "hasPrevious": page.has_previous()
    }, status=200)



# returns all the journal entries for a given exercise
@login_required
def exerciseEntries(request, exerciseId):
    try:
        exercise = Exercise.objects.get(id=exerciseId, trainee=request.user)
    except Exercise.DoesNotExist:
        return JsonResponse({
            "error": "Exercise with ID does not exist!"
        }, status=404)
    
    entries = Entry.objects.filter(trainee=request.user, exercise=exercise).order_by("-timestamp")

    return JsonResponse({
        "exercise": exercise.name,
        "entries": [entry.graph_serialize() for entry in entries]
    }, safe=False)


# allows the user to add exercises in bulk
@login_required
def addExercises(request):
    if (request.method != 'POST'):
        return JsonResponse({
            "error": "Post request required!"
        }, status=400)
    
    data = json.loads(request.body)

    try:
        workout = Workout.objects.get(id=data["workoutId"], trainee=request.user)
    except Workout.DoesNotExist:
        return JsonResponse({
            "error": "Workout with given ID does not exist!"
        }, status=404)
    
    exercises = data["exercises"]
    exAccumulate = []

    for exercise in exercises:
        name = exercise["name"]
        if (not (name.strip())):
            return JsonResponse({
                "error": "Exercise name cannot be empty!"
            }, status=400)
        
        description = exercise["description"]
        newExercise = Exercise.objects.create(
            trainee=request.user,
            name=name, 
            description=description
            )
        newExercise.workout.add(workout)
        for bodypart in exercise["bodyparts"]:
            try:
                bp = BodyPart.objects.get(id=bodypart)
            except BodyPart.DoesNotExist:
                return JsonResponse({
                    "error": f"Could not add {name}. Bodypart does not exist!"
                }, status=404)
            
            newExercise.body_part.add(bp)
        
        exAccumulate.append(newExercise)
    
    # only save when all exercises pass the check, no partial updates
    for exercise in exAccumulate:
        exercise.save()

    return JsonResponse({
        "message": "Successfully added exercise(s)."
    }, status=201)


#==============================================================================#
#                              SEARCH ROUTES
#==============================================================================#

@login_required
def searchExercises(request):
    if (request.method == 'GET'):
        searchQuery = request.GET.get("q")
        searchQuery = searchQuery.strip()
        qSet = Exercise.objects.filter(trainee=request.user)

        if not searchQuery:
            return JsonResponse({
                "results": []
            }, status=200)
        
        qSet = qSet.filter(name__icontains=searchQuery)

        return JsonResponse({
            "results": [exercise.serialize() for exercise in qSet.order_by('name')[:7]]
        }, status=200)
    

@login_required
def searchWorkoutAndExercises(request):
    if (request.method == 'GET'):
        searchQuery = request.GET.get("q")
        searchQuery = searchQuery.strip()
        
        if not searchQuery:
            return JsonResponse({
                "workouts": [],
                "exercises": []
            }, status=200)
        
        exercises = Exercise.objects.filter(trainee=request.user).filter(name__icontains=searchQuery)
        workouts = Workout.objects.filter(trainee=request.user).filter(name__icontains=searchQuery)

        return JsonResponse({
            "workouts": [workout.serialize() for workout in workouts.order_by('name')[:4]],
            "exercises": [exercise.serialize() for exercise in exercises.order_by('name')[:4]]
        }, status=200)

