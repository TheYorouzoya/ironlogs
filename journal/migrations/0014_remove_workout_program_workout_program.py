# Generated by Django 5.0.4 on 2024-05-15 17:39

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('journal', '0013_remove_exercise_workout_remove_workout_program_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='workout',
            name='program',
        ),
        migrations.AddField(
            model_name='workout',
            name='program',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='journal.program'),
        ),
    ]