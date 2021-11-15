from django.db import models
from django.contrib.auth.models import AbstractUser
import datetime
from django.utils import timezone
from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from rest_framework.authtoken.models import Token
import random



# Create your models here. 
class Config(models.Model):
    n1_mistakes = models.IntegerField(default = 1)
    n2_mistakes = models.IntegerField(default = 2)
    n3_mistakes = models.IntegerField(default = 3)
    n4_mistakes = models.IntegerField(default = 4)
    p1_mistakes = models.FloatField(default = 0.20)
    p2_mistakes = models.FloatField(default = 0.4)
    p3_mistakes = models.FloatField(default = 0.60)
    p4_mistakes = models.FloatField(default = 0.80)
    n_tag_groups = models.IntegerField(default = 4)
    n_time_revisions = models.IntegerField(default = 2)
    max_liked_disliked_tasks = models.IntegerField(default = 3)
    good_puntuation = models.IntegerField(default = 1000)
    bad_puntuation = models.IntegerField(default = -1000)
    max_puntuation = models.IntegerField(default = 2000)
    min_puntuation = models.IntegerField(default = -2000)
    good_deviation = models.IntegerField(default = 100)

    #TODO seguir añadiendo campos
    def __str__(self):
        return 'config'




class House(models.Model):
    name = models.CharField(max_length=128, unique = True)
    average_rating = models.IntegerField(default = 0)
    average_mind_status = models.IntegerField(default = 0)
    #Moderador que irá variando cada semana. Es uno de los usuarios del piso
    #Lo de related_name es para que no cree una backwards relationship.
    moderator = models.ForeignKey('User', on_delete = models.SET_NULL, null = True, related_name='+')
    #Indicamos también aquí la última fecha que se asignó.
    moderator_date = models.DateField(null = True)
    n_users = models.IntegerField(default = 0)
    time_revision_flag = models.BooleanField(default = False)
    code = models.IntegerField(default = 0)

    def __str__(self):
        return self.name


def getCode():
    not_unique = True
    while not_unique:
        code = random.randint(10000, 99999)
        if not House.objects.filter(code = code):
            not_unique = False
    return code


class User(AbstractUser):
    house = models.ForeignKey(House, on_delete = models.CASCADE, null=True)
    personal_rating = models.IntegerField(default = 0)
    mind_status = models.IntegerField(default = 0)
    moderator_number = models.IntegerField(default = 0)
    liked_tasks = models.ManyToManyField('Task', related_name='liked_tasks')
    disliked_tasks = models.ManyToManyField('Task', related_name='disliked_tasks')

    def __str__(self):
        return self.username



#Señal con la que creamos el token del usuario cuando se registra.
@receiver(post_save, sender=User)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)


class Tag(models.Model):
    name = models.CharField(max_length = 128, unique = True)
    difficulty = models.IntegerField(null = False)
    group = models.IntegerField(default = 1)

    def __str__(self):
        return self.name


class Task(models.Model):
    name = models.CharField(max_length = 128, unique = True)
    description = models.CharField(max_length = 400, null = True)
    #Dificultad de la tarea que va ligada a las etiquetas. Cuando un individuo la complete,
    #será este valor el que le reporte puntos.
    difficulty = models.FloatField(default = 0)
    #Indicamos las etiquetas asociadas a la tarea (larga, corta, individual, difícil...)
    #es con todas estas con la que calculamos el campo dificultad.
    tags = models.ManyToManyField(Tag)
    #Aquí indicamos si es null que no es creada en ninguna casa, si no es null
    #significa que pertenece solo a esa casa.
    house = models.ForeignKey(House, on_delete = models.CASCADE, null = True)
    last_routine = models.DateField(null = True)
    multiple = models.BooleanField(default = False)

    def __str__(self):
        return self.name

@receiver(m2m_changed, sender=Task.tags.through)
def update_difficulty(sender, instance, **kwargs):
    tags = instance.tags.all()
    for tag in tags:
        instance.difficulty += tag.difficulty
    instance.save()

#Dentro de las tareas disponibles, en cuanto se asigna en un hogar a algún miembro
#se instancia esta clase.
class AssignedTask(models.Model):
    name = models.CharField(max_length = 128, default= "tarea asignada")
    task = models.ForeignKey(Task, on_delete = models.CASCADE)
    house = models.ForeignKey(House, on_delete = models.CASCADE)
    users = models.ManyToManyField(User, blank = True)
    n_users = models.IntegerField(default = 1)
    date = models.DateField(default = timezone.now)
    checked = models.BooleanField(default = False)
    undone = models.BooleanField(default = False)
    assigned = models.BooleanField(default = False)
    routine = models.BooleanField(default = False)
    period = models.IntegerField(default = 0)
    time_revision = models.IntegerField(default = 0)
    day_time = models.IntegerField(default=0)


    def save(self, *args, **kwargs):
        self.name = self.task.name + " " + str(self.date)
        super(AssignedTask, self).save(*args, **kwargs)



    def __str__(self):
        return self.name



class Event(models.Model):
    name = models.CharField(max_length = 128, unique = True)
    house = models.ForeignKey(House, on_delete = models.CASCADE, null=True)
    users = models.ManyToManyField(User)
    date = models.DateField(default = timezone.now)

    def __str__(self):
        return self.name


class Question(models.Model):
    title = models.CharField(max_length = 400, unique = True)
    first_answer = models.CharField(max_length = 400)
    second_answer = models.CharField(max_length = 400)
    third_answer = models.CharField(max_length = 400)
    first_points = models.IntegerField(default = 0)
    second_points = models.IntegerField(default = 0)
    third_points = models.IntegerField(default = 0)

class Questionnaire(models.Model):
    name = models.CharField(max_length = 180)
    description = models.CharField(max_length = 180)
    questions = models.ManyToManyField(Question)

    def __str__(self):
        return self.name

class DoneQuestionnaire(models.Model):
    name = models.CharField(max_length = 180)
    questionnaire = models.ForeignKey(Questionnaire, on_delete = models.CASCADE)
    user = models.ForeignKey(User, on_delete = models.CASCADE)
    points = models.IntegerField()

    def __str__(self):
        return self.user.username + " " + self.questionnaire.name


class UsersTasksCounter(models.Model):

    user = models.ForeignKey(User, on_delete = models.CASCADE, null = False)
    task = models.ForeignKey(Task, on_delete = models.CASCADE, null = False)
    counter = models.FloatField(default = 0)
    date = models.DateField(null = True)
    mistakes = models.FloatField(default = 0)

    def __str__(self):
        return self.user.username + " " + self.task.name + " counter"

class UsersTasksRecord(models.Model):
    user = models.ForeignKey(User, on_delete = models.CASCADE, null = False)
    assigned_task = models.ForeignKey(AssignedTask, on_delete = models.CASCADE, null = False)
    personal_checked = models.BooleanField(default = False)
    moderator_checked = models.BooleanField(default = False)
    date = models.DateField(null = False)


    def __str__(self):
        return self.user.username + " " + self.assigned_task.name + " record"

class Notification(models.Model):
    text = models.CharField(max_length = 300)
    date = models.DateField(default = timezone.now().date())
    house = models.ForeignKey(House, on_delete = models.CASCADE, null = False)
