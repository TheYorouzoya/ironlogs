from django.contrib import admin
from .models import *

# Register your models here.
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ["name", "trainee"]

class EntryAdmin(admin.ModelAdmin):
    list_display = ["exercise", "trainee", "sets", "reps", "intensity", "timestamp"]

admin.site.register(User)
admin.site.register(Program)
admin.site.register(Workout)
admin.site.register(Exercise, ExerciseAdmin)
admin.site.register(Entry, EntryAdmin)
admin.site.register(BodyPart)
admin.site.register(Day)