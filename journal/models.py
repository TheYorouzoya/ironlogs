from django.db import models
from django.contrib.auth.models import AbstractUser

import django.utils.timezone
import uuid

class User(AbstractUser):
    username = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        primary_key=True
    )
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    date_joined = models.DateTimeField(default=django.utils.timezone.now)
    current_program = models.ForeignKey(
        'Program',
        null=True,
        on_delete=models.SET_NULL,
        related_name="currentProgram"
    )

    class Meta:
        indexes = [
            models.Index(fields=["username"])
        ]

    def __str__(self):
        return f"{self.username}"    
    

class Program(models.Model):
    id = models.UUIDField(
        primary_key=True,
        editable=False,
        default=uuid.uuid4,
        verbose_name='Program UUID',
    )
    trainee = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='Trainee'
    )
    name = models.CharField(max_length=128)
    description = models.CharField(
        max_length=2000,
        help_text="A brief description of the program",
        blank=True,
        null=True
    )

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "isCurrent": self.trainee.current_program == self
        }

    def __str__(self):
        return f"{self.name} workout program created by {self.trainee}"


class Workout(models.Model):
    id = models.UUIDField(
        primary_key=True,
        editable=False,
        default=uuid.uuid4,
        verbose_name='Workour UUID'
    )
    name = models.CharField(max_length=128)
    program = models.ForeignKey(
        'Program',
        on_delete=models.CASCADE
    )
    trainee = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
    )
    day = models.ManyToManyField(
        'Day'
    )

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "days": [day.serialize() for day in self.day.all()]
        }

    def __str__(self):
        return f"{self.trainee}'s {self.name} workout"


class Exercise(models.Model):
    id = models.UUIDField(
        primary_key=True,
        editable=False,
        default=uuid.uuid4,
        verbose_name='Exercise UUID'
    )
    trainee = models.ForeignKey(
        'User',
        on_delete=models.CASCADE
    )
    workout = models.ManyToManyField('Workout')
    name = models.CharField(max_length=200, db_index=True)
    body_part = models.ManyToManyField('BodyPart')
    sub_body_part = models.CharField(max_length=200, null=True)
    description = models.CharField(
        max_length=2000,
        help_text="A brief description of the exercise",
        blank=True,
        null=True
    )

    def serialize(self):
        return {
            "id": self.id,
            # "workout": self.workout.id,
            "name": self.name,
            "bodypart": [part.serialize() for part in self.body_part.all()],
            "subBodyPart": self.sub_body_part,
            "description": self.description
        }
    
    def table_serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "workouts": [
                {
                    "id": workout.id,
                    "name": workout.name
                } for workout in self.workout.all()
            ],
            "programs": [
                {
                    "id": workout.program.id,
                    "name": workout.program.name
                } for workout in self.workout.all()
            ],
            "bodyparts": [
                {
                    "id": bodypart.id,
                    "name": bodypart.name
                } for bodypart in self.body_part.all()
            ]
        }

    def __str__(self):
        return f"{self.name}"


class Entry(models.Model):
    id = models.UUIDField(
        primary_key=True,
        editable=False,
        default=uuid.uuid4,
        verbose_name='Entry UUID'
    )
    trainee = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
    )
    exercise = models.ForeignKey(
        'Exercise',
        null=True,
        on_delete=models.SET_NULL,
    )
    sets = models.PositiveSmallIntegerField()
    reps = models.PositiveSmallIntegerField()
    intensity = models.DecimalField(
        max_digits=6,
        decimal_places=2
    )
    timestamp = models.DateField(
        default=django.utils.timezone.now,
        null=False
    )

    class Meta:
        indexes = [
            models.Index(fields=["trainee", "timestamp"])
        ]

    def serialize(self):
        return {
            "id": self.id,
            "exercise": {
                "id": self.exercise.id,
                "name": self.exercise.name
            },
            "sets": self.sets,
            "reps": self.reps,
            "intensity": self.intensity,
        }
    
    def graph_serialize(self):
        return {
            "id": self.id,
            "sets": self.sets,
            "reps": self.reps,
            "intensity": self.intensity,
            "date": self.timestamp
        }

    def __str__(self):
        return (f"{self.timestamp}: {self.exercise} for "  +
               f"{self.sets} sets and {self.reps} reps using {self.intensity}kg weight")
    

class BodyPart(models.Model):
    id = models.UUIDField(
        primary_key=True,
        editable=False,
        default=uuid.uuid4,
        verbose_name='Bodypart UUID'
    )
    name = models.CharField(max_length=120)

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name
        }

    def __str__(self):
        return f"{self.name}"
    

class Day(models.Model):
    class DayChoices(models.IntegerChoices):
        SUNDAY = 6 , 'Sunday'
        MONDAY = 0 , 'Monday'
        TUESDAY = 1 , 'Tuesday'
        WEDNESDAY = 2 , 'Wednesday'
        THURSDAY = 3 , 'Thursday'
        FRIDAY = 4 , 'Friday'
        SATURDAY = 5 , 'Saturday'

    day = models.PositiveSmallIntegerField(choices=DayChoices)

    def serialize(self):
        return {
            "day": self.get_day_display(),
            "dayNum": self.day
        }

    def __str__(self):
        return f"Day {self.day}: {self.get_day_display()}"
