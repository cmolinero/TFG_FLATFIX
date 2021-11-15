from django.shortcuts import render
from apirest.models import Task, Event, House, Tag, User, AssignedTask, Questionnaire, DoneQuestionnaire, Question, UsersTasksCounter, UsersTasksRecord, Config, Notification
from apirest import serializers
from rest_framework import viewsets, generics, mixins
from rest_framework import permissions, decorators
from rest_framework.views import Response, status
from rest_framework.decorators import action
import datetime
from django.db.models import Q
from django.utils import timezone
import random
import numpy as np



# Create your views here.


#Función auxiliar que realiza la función de ruleta. Por ahora determina al usuario con menor número de veces
#que ha realizado la tarea en cuestión.
def ruleta(task, house, n_users):
    possible_users = User.objects.filter(house = house).all()
        #Comprobamos también si existe el Counter o no en todos los usuarios, y así ya los creamos todos.
    for user in possible_users:
        counter = UsersTasksCounter.objects.get_or_create(user = user, task = task)
    users = []
    #Ordenamos a los usuarios de la casa bajo dos criterios: por un lado, los que menos veces hayan hecho la tarea, y por otro lado,
    #los fallos que han tenido al hacerla.
    config  = Config.objects.first()
    counters = list(UsersTasksCounter.objects.filter(task = task, user__house = house).all().order_by('counter')[:n_users])
    mistakes = list(UsersTasksCounter.objects.filter(task = task, user__house = house).all().order_by('-mistakes')[:n_users])

    flag_liked = False
    puntuations = []
    for user in possible_users:
        puntuations.append(user.personal_rating)
        if task in user.liked_tasks.all():
            flag_liked = True

    if not flag_liked:
        #Procedemos ahora a calcular la varianza de las puntuaciones, para ver si todos lo están haciendo
        #más o menos bien.
        deviation = np.std(puntuations)
        print("desviación",deviation)
        if deviation > config.good_deviation:
            flag_liked = True


    for i in range(0, n_users):
        print("Mistakes:", mistakes[0].user.username)
        print("Counters:", counters[0].user.username)
        print("Usuarios:", users)

        while (mistakes[0].user in users):
            print("echando mistakes", mistakes[0].user.username)
            mistakes.pop(0)

        while (counters[0].user in users):
            print("echando counters", counters[0].user.username)
            counters.pop(0)

        if (mistakes[0] and counters[0]):
            prob = random.random()
            #Vamos ahora a ver si alguno de los dos no les gusta esta tarea, y si tienen buena puntuación, les favorecemos:
            if flag_liked:
                if task in mistakes[0].user.disliked_tasks.all():
                    if mistakes[0].user.personal_rating >= config.good_puntuation:
                        prob = prob*1.1

                if task in counters[0].user.disliked_tasks.all():
                    if counters[0].user.personal_rating >= config.good_puntuation:
                        prob=prob/1.1

            #Ahora hacemos la comprobación dentro de si está la tarea entre las que les gusta, beneficiando justo al revés.
            if flag_liked:
                if task in mistakes[0].user.liked_tasks.all():
                    if mistakes[0].user.personal_rating >= config.good_puntuation:
                        prob = prob/1.1

                if task in counters[0].user.liked_tasks.all():
                    if counters[0].user.personal_rating >= config.good_puntuation:
                        prob = prob*1.1


            print("probabilidad:" ,prob)
            print("Fallos del usuario:", mistakes[0].mistakes)

            if mistakes[0].mistakes >= config.n1_mistakes and mistakes[0].mistakes < config.n2_mistakes:

                if prob <= config.p1_mistakes:
                    users.append(mistakes[0].user)
                    print("mistakes 1 prob",config.p1_mistakes, mistakes[0].user.username)
                    mistakes.pop(0)
                else:
                    users.append(counters[0].user)
                    print("counters 1 prob",config.p1_mistakes, counters[0].user.username)
                    counters.pop(0)

            elif mistakes[0].mistakes >= config.n2_mistakes and mistakes[0].mistakes < config.n3_mistakes:
                if prob <= config.p2_mistakes:
                    users.append(mistakes[0].user)
                    print("mistakes 2 prob",config.p2_mistakes, mistakes[0].user.username)
                    mistakes.pop(0)
                else:
                    users.append(counters[0].user)
                    print("counters 2 prob",config.p2_mistakes, counters[0].user.username)
                    counters.pop(0)

            elif mistakes[0].mistakes >= config.n3_mistakes and mistakes[0].mistakes < config.n4_mistakes:
                if prob <= config.p3_mistakes:
                    users.append(mistakes[0].user)
                    print("mistakes 3 prob",config.p3_mistakes, mistakes[0].user.username)
                    mistakes.pop(0)
                else:
                    users.append(counters[0].user)
                    print("counters 3 prob",config.p3_mistakes, counters[0].user.username)
                    counters.pop(0)

            else:
            #elif mistakes[0].mistakes >= config.n4_mistake:
                if prob <= config.p4_mistakes:
                    users.append(mistakes[0].user)
                    print("mistakes 4, prob",config.p4_mistakes, mistakes[0].user.username)
                    mistakes.pop(0)
                else:
                    users.append(counters[0].user)
                    print("counters 4 prob",config.p4_mistakes, counters[0].user.username)
                    counters.pop(0)

        elif mistakes[0]:
            users.append(mistakes[0].user)
            print("solo mistakes", mistakes[0].user.username)
            mistakes.pop(0)

        else:
            users.append(counters[0].user)
            print("solo counters", counters[0].user.username)
            counters.pop(0)

    print("Usuarios:", users)
    return users



#TODO: Extraña razón por la que tiene que ser Model para que salga pero bueno. Lo hacemos como viewset
#para que la opción salga en el apiroot que es lo que queremos mostrar.
class RegisterView(generics.CreateAPIView):
    """
    Registro de la aplicación. Una vez se registre, puede iniciar sesión en Log In con el nombre de usuario y contraseña.
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = serializers.RegisterSerializer


class ConfigViewSet(viewsets.ModelViewSet):
    queryset = Config.objects.all()
    permission_classes = [permissions.IsAdminUser]
    serializer_class = serializers.ConfigSerializer

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet de los usuarios de la aplicación.
    """
    serializer_class = serializers.UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'head','put','patch']


    #TODO: MODIFICAR GET QUERYSET
    def get_queryset(self):
        user = self.request.user

        return User.objects.filter(house = user.house).order_by('-date_joined')


    @action(detail = False, methods = ['get'])
    def get_personal_user(self, request):
        user = request.user
        queryset = User.objects.get(username=user.username)
        serializer = serializers.UserSerializer(queryset, context = {'request': request})
        return Response(serializer.data)

    @action(detail = False, methods = ['put'], serializer_class = serializers.House_UserSerializer)
    def assign_house(self, request):
        serializer = serializers.House_UserSerializer(data = request.data)
        if serializer.is_valid():
            user = request.user
            if not user.house:
                house = House.objects.filter(code = serializer.validated_data['code']).first()
                user.house = house
                user.moderator_number = house.n_users
                house.n_users += 1
                user.save()
                house.save()
                return Response(status = status.HTTP_200_OK)
            else:
                return Response(status = status.HTTP_422_UNPROCESSABLE_ENTITY)






    @action(detail = False, methods = ['get'])
    def assignedtasks(self, request):
        user = request.user
        #TODO:Parece ser que funciona esta query con igual, aunque no tiene mucho sentido
        queryset = AssignedTask.objects.filter(users = user)
        serializer = serializers.AssignedTaskSerializer(queryset, many = True, context={'request': request})
        return Response(serializer.data)

    @action(detail = False, methods = ['get'])
    def records(self, request):
        user = request.user
        queryset = UsersTasksRecord.objects.filter(user = user)
        serializer = serializers.UsersTasksRecordSerializer(queryset, many = True, context= {'request': request})
        return Response(serializer.data)

    @action(detail = False, methods = ['get'])
    def is_moderator(self, request):
        user = request.user
        if user == user.house.moderator:
            return Response(True)
        else:
            return Response(False)

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all().order_by('name')
    serializer_class = serializers.TagSerializer
    permission_classes = [permissions.IsAuthenticated]

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.order_by('name')
    serializer_class = serializers.TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    #TODO: Crear una nueva acción, asociada a una tarea específica, con la que se crean tareas.

    @action(detail = True, methods = ['get'])
    def tags(self, request, pk):
        queryset= self.get_object()
        serializer = serializers.TaskSerializer(queryset, context={'request': request})
        queryset = Tag.objects.filter(pk__in = serializer.data['tags'])

        return Response(serializers.TagSerializer(queryset, many = True, context={'request': request}).data)

    # @action(detail = True, methods = ['get'])
    # def caldifficulty(self, request, pk):
    #     queryset = self.get_object().tags.all()
    #     serializer = serializers.TagSerializer(queryset, many = True, context = {'request': request})
    #     difficulty = 0
    #     for t in serializer.data:
    #         difficulty = difficulty + t['difficulty']


        return Response (difficulty)

    #Método para crear una rutina puntual. TODO: Unirlo con el otro quizás, o no.
    @action(detail = True, methods = ['post'], serializer_class = serializers.SingleTaskSerializer)
    def create_single_task(self, request, pk):
        serializer = serializers.SingleTaskSerializer(data = request.data)
        if serializer.is_valid():
            date = serializer.validated_data['date']
            n_users = serializer.validated_data['n_users']
            day_time = serializer.validated_data['day_time']
            task = self.get_object()
            user = request.user

            #Comprobamos que si no permite que no sea múltiple, si ya existe una no se pueda crear.
            if not task.multiple and AssignedTask.objects.filter(task = task, date = date).exists():
                return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)

            elif task.multiple and AssignedTask.objects.filter(task = task, date = date, day_time = day_time).exists():
                return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            #TODO: Parece ser que así el filtro funciona
            house = user.house
            assigned_task = AssignedTask()
            assigned_task.date = date
            assigned_task.house = house
            assigned_task.task = task
            assigned_task.n_users = n_users
            assigned_task.assigned = True
            assigned_task.day_time = day_time
            assigned_task.save()
            users = ruleta(task, house, n_users)


            #A continuación creamos los record correspondientes a cada usuario

            for user in users:
                assigned_task.users.add(user)
                record = UsersTasksRecord()
                record.user = user
                record.assigned_task = assigned_task
                record.date = assigned_task.date
                record.save()






            assigned_task.save()


            serializer = serializers.AssignedTaskSerializer(assigned_task, context = {'request': request})

            return Response(serializer.data)
        else:
            return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    #Con este método, creamos a partir de una Task, una rutina de AssignedTask. Creamos las tres primeras teniendo en cuenta
    #el periodo que se nos indica a partir de la fecha de inicio que se nos pasa.
    @action(detail = True, methods = ['post'], serializer_class = serializers.RoutineSerializer)
    def create_routine(self, request, pk):

        serializer = serializers.RoutineSerializer(data = request.data)
        if serializer.is_valid():
            date = serializer.validated_data['date']
            period = serializer.validated_data['period']
            n_users = serializer.validated_data['n_users']
            task = self.get_object()

            for c in range(0,3):
                assigned_task = AssignedTask()
                assigned_task.task = task
                assigned_task.house = request.user.house
                assigned_task.period = period
                assigned_task.date = date + c*datetime.timedelta(days=period)
                assigned_task.routine = True
                assigned_task.n_users = n_users
                assigned_task.save()

            task.last_routine = date + 3*datetime.timedelta(days=period)
            task.save()

            return Response(status=status.HTTP_200_OK)

        else:
            return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)


    @action(detail=True, methods = ['post'])
    def like_task(self,request,pk):
        task = self.get_object()
        user = request.user


        if task in user.liked_tasks.all():
            if user.liked_tasks.all().count() <= (user.disliked_tasks.all().count()):
                return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            user.liked_tasks.remove(task)


        elif user.liked_tasks.all().count() == 3:
            return Response(status=status.HTTP_403_FORBIDDEN)

        else:
            user.liked_tasks.add(task)
            if task in user.disliked_tasks.all():
                user.disliked_tasks.remove(task)

        user.save()
        return Response(status=status.HTTP_200_OK)




    @action(detail=True, methods = ['post'])
    def dislike_task(self,request,pk):
        task = self.get_object()
        user = request.user


        if task in user.disliked_tasks.all():
            user.disliked_tasks.remove(task)

        elif user.disliked_tasks.all().count() == 3:
            return Response(status=status.HTTP_403_FORBIDDEN)

        else:
            if user.liked_tasks.all().count() <= user.disliked_tasks.all().count():
                return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            else :
                if task in user.liked_tasks.all():
                    if (user.liked_tasks.all().count() - 1)<= user.disliked_tasks.all().count():
                        #TODO, enviar otro código de error para este caso específico.
                        return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)

                    user.liked_tasks.remove(task)

                user.disliked_tasks.add(task)



        user.save()
        return Response(status=status.HTTP_200_OK)



class HouseViewSet(viewsets.ModelViewSet):
    queryset = House.objects.all().order_by('name')
    serializer_class = serializers.HouseSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail = True, methods = ['get'])
    def users(self, request, pk):
        queryset = User.objects.filter(house = pk)
        serializer = serializers.UserSerializer(queryset, many = True, context={'request': request})
        return Response(serializer.data)

    @action(detail = True, methods = ['get'])
    def tasks(self, request, pk):
        queryset = Task.objects.filter(house__isnull = True)
        serializer = serializers.TaskSerializer(queryset, many = True, context = {'request': request})
        return Response(serializer.data)

    @action(detail = True, methods = ['get'])
    def customtasks(self, request, pk):
        queryset = Task.objects.filter(house = pk)
        serializer = serializers.TaskSerializer(queryset, many = True, context = {'request': request})
        return Response(serializer.data)

    @action(detail = True, methods = ['get'])
    def assignedtasks(self, request, pk):
        queryset = AssignedTask.objects.filter(house = pk)
        serializer = serializers.AssignedTaskSerializer(queryset, many = True, context = {'request': request})
        return Response(serializer.data)

    @action(detail = True, methods = ['get'])
    def events(self, request, pk):
        queryset = Event.objects.filter(house = pk)
        serializer = serializers.EventSerializer(queryset, many = True, context = {'request': request})
        return Response(serializer.data)

    @action(detail = True, methods = ['get'])
    def next_events(self, request, pk):
        queryset = Event.objects.filter(house = pk).filter(date__gte = timezone.now().date())
        serializer = serializers.EventSerializer(queryset, many = True, context = {'request': request})
        return Response(serializer.data)

    @action(detail = True, methods = ['get'])
    def next_assigned_tasks(self, request, pk):
        queryset = AssignedTask.objects.filter(house = pk).filter(date__gte = timezone.now().date())
        serializer = serializers.AssignedTaskSerializer(queryset, many = True, context = {'request': request})
        return Response(serializer.data)


    #Función con la que cada lunes se checkea
    @action(detail = True, methods = ['get'])
    def check_time_tasks(self, request, pk):
        #TODO Pensar si en la assigned_task poner una flag para que no se vuelva a entrar. Creo que eso ya
        #está conseguido, pero toca pensar mejor cómo ver para que si no se entra en lunes qué pasa. A lo mejor
        #hay que darle un par de vueltas.
        house = self.get_object()
        #Comprobamos antes de nada que sea lunes. La comprobación solo se hace este día de la semana.
        if datetime.datetime.today().weekday() == 0 and house.time_revision_flag == False:
            #Cogemos las tareas de esta casa que ya han sido terminadas o que no se hicieron.
            assigned_tasks = AssignedTask.objects.filter(house = house).filter(Q(checked = True) | Q(undone = True)).all()
            today = timezone.now().date()
            for at in assigned_tasks:

                if today >= at.date + datetime.timedelta(days = 30) and at.time_revision == 1:
                    users = at.users.all()
                    #Aumentamos el indicador de en qué fase está, para que ya no entre otra vez dentro del bucle si la función es llamada.
                    at.time_revision = 2
                    at.save()
                    if at.checked == True:
                        #Por un lado, reducimos la puntuación que estas ofrecían al haber pasado ya un mes.
                        for u in users:
                            u.personal_rating += - 0.75*at.task.difficulty
                            u.save()
                            record = UsersTasksRecord.objects.filter(user = u, assigned_task = at).first()
                            counter = UsersTasksCounter.objects.filter(user = u, task = at.task).first()
                            if record.moderator_checked == True:
                                counter.counter +=  - 0.75
                            else:
                                counter.mistakes +=  - 0.75
                            #TODO Pensar en cuando se le suma menos puntos
                            counter.save()


                    elif at.undone == True:
                        for u in users:
                            u.personal_rating += 0.75*at.task.difficulty
                            u.save()
                            counter = UsersTasksCounter.objects.filter(user = u, task = at.task).first()
                            counter.mistakes += - 0.75
                            counter.save()

                    print("antigua")

                elif today >= at.date + datetime.timedelta(days=15) and at.time_revision == 0:
                    users = at.users.all()
                    at.time_revision = 1
                    at.save()
                    if at.checked == True:
                        #Por un lado, reducimos la puntuación que estas ofrecían al haber pasado ya medio mes.
                        for u in users:
                            u.personal_rating += - 0.5*at.task.difficulty
                            u.save()
                            record = UsersTasksRecord.objects.filter(user = u, assigned_task = at).first()
                            counter = UsersTasksCounter.objects.filter(user = u, task = at.task).first()
                            if record.moderator_checked == True:
                                counter.counter +=  - 0.5
                            else:
                                counter.mistakes +=  - 0.5

                            counter.save()

                    elif at.undone == True:
                        for u in users:
                            u.personal_rating += 0.5*at.task.difficulty
                            u.save()
                            counter = UsersTasksCounter.objects.filter(user = u, task = at.task).first()
                            counter.mistakes += - 0.5
                            counter.save()

                    print("Un poco antigua")

            house.time_revision_flag = True
            house.save()
            return Response(status=status.HTTP_200_OK)
        else:
            if house.time_revision_flag == True:
                house.time_revision_flag = False
                house.save()
            return Response(status = status.HTTP_403_FORBIDDEN)




    #Función con la que cada vez que un usuario de una casa entre en la aplicación, se comprueban aquellas AssignedTask
    #que aún no estén asignadas, y que queden menos de 3 días para que tengan que ser realizadas, y por tanto se asignan
    #a través de la ruleta.
    @action(detail = True, methods = ['get'])
    def assign_next_tasks(self, request, pk):
        #Buscamos aquellas tareas de rutina que aún no están asignadas.
        assigned_tasks = AssignedTask.objects.filter(routine = True).filter(assigned = False).all()
        house = self.get_object()
        #Para cada una de ellas, comprobamos que queden menos de 5 días para que tengan que ser realizadas.
        for assigned_task in assigned_tasks:
            today = timezone.now().date()
            today += datetime.timedelta(days=6)
            if today >= assigned_task.date:
                #En ese caso, les asignamos los usuarios correspondientes.
                users = ruleta(assigned_task.task, house, assigned_task.n_users)
                assigned_task.assigned = True
                assigned_task.save()
                #A continuación, creamos los records de estas tareas para que posteriormente se rellenen los checked.
                for user in users:
                    assigned_task.users.add(user)
                    record = UsersTasksRecord()
                    record.user = user
                    record.assigned_task = assigned_task
                    record.date = assigned_task.date
                    record.save()

                assigned_task.save()

        return Response(status=status.HTTP_200_OK)

    #Método con el que se comprueban las tareas que no se han realizado y su fecha ha pasado, y se penaliza al usuario.
    @action(detail = True, methods = ['get'])
    def undone_tasks(self, request, pk):
        assigned_tasks = AssignedTask.objects.filter(checked = False, undone = False).filter(date__lt = timezone.now().date()).all()
        for assigned_task in assigned_tasks:
            #La indicamos Undone.
            assigned_task.undone = True
            assigned_task.save()
            notification = Notification()
            notification.house = request.user.house
            notification.text = "La tarea " + assigned_task.task.name + " del día " + str(assigned_task.date) + " no ha sido terminada."
            notification.save()
            #TODO: Comprobar si es rutina, para entonces crear la siguiente.
            #Por no haber realizado la tarea en su debido tiempo, le restamos la mitad de su puntuación.
            for user in assigned_task.users.all():
                #Una vez almacenamos el récord, penalizamos la puntuación a cada usuario por no haberlo hecho.
                #TODO: Por ahora se penaliza a todo el mundo igual, es una opción mirar si se resta más o menos según
                #los otros checked.
                user.personal_rating += -(assigned_task.task.difficulty/2)
                user.save()
                #Además, en la tabla UsersTasks le sumamos una al contador de fallos.
                counter = UsersTasksCounter.objects.get_or_create(user = user, task = assigned_task.task)[0]
                counter.mistakes += 1
                counter.save()
        return Response(status = status.HTTP_200_OK)

    #Método con el que se comprueba si ha pasado el tiempo determinado y se asigna un nuevo moderador al piso.
    @action(detail=True, methods = ['get'])
    def choose_moderator(self, request, pk):
        house = self.get_object()
        users = User.objects.filter(house = house).all()
        if not house.moderator:
            house.moderator = User.objects.filter(moderator_number = 0).first()
            house.moderator_date = timezone.now().date()
            house.save()
            return Response(status=status.HTTP_200_OK)
        else:
            today = timezone.now().date()
            if today >= house.moderator_date + datetime.timedelta(days=7):
                for u in users:
                    u.moderator_number = (u.moderator_number + 1) % house.n_users
                house.moderator = User.objects.filter(moderator_number = 0).first()
                house.moderator_date = house.moderator_date + datetime.timedelta(days=7)
                house.save()
                return Response(status=status.HTTP_200_OK)
            else:
                return Response(status = status.HTTP_422_UNPROCESSABLE_ENTITY)








class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('name')
    serializer_class = serializers.EventSerializer
    permission_classes = [permissions.IsAuthenticated]

class AssignedTaskViewSet(viewsets.ModelViewSet):
    #queryset = AssignedTask.objects.filter(users = self.request.user).order_by('task__name')
    serializer_class = serializers.AssignedTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        return AssignedTask.objects.filter(house = user.house).order_by('date')


    @action(detail = False, methods = ['post'], serializer_class = serializers.AssignedTaskByDaySerializer)
    def get_assignedtasks_by_day(self, request):
        user = request.user
        serializer = serializers.AssignedTaskByDaySerializer(data = request.data)
        if serializer.is_valid():
            date = serializer.validated_data['date']
        else:
            return Response(status = status.HTTP_422_UNPROCESSABLE_ENTITY)

        queryset = AssignedTask.objects.filter(date=date, house = user.house)
        serializer = serializers.AssignedTaskSerializer(queryset, many = True, context = {'request': request})
        return Response(serializer.data)

    @action(detail = False, methods = ['post'], serializer_class = serializers.AssignedTaskByMonthSerializer)
    def get_assignedtasks_by_month(self, request):
        user = request.user
        serializer = serializers.AssignedTaskByMonthSerializer(data = request.data)
        if serializer.is_valid():
            month = serializer.validated_data['month']
            year = serializer.validated_data['year']
        queryset = AssignedTask.objects.filter(date__year=year, date__month=month, house = user.house)
        assigned_tasks = queryset.all()
        markedDates = {}
        for at in assigned_tasks:
            if user in at.users.all():
                dict  = {"marked":True, "dotColor":"red"}
            else:
                dict  = {"marked":True, "dotColor":"blue"}

            markedDates[at.date.strftime("%Y-%m-%d")] = dict

        print(markedDates)
        return Response(data = markedDates)


    @action(detail = False, methods = ['get'])
    def get_personal_tasks(self, request):
        user = request.user
        queryset = AssignedTask.objects.filter(users=user).order_by('date')
        serializer = serializers.AssignedTaskSerializer(queryset, many = True, context = {'request': request})
        return Response(serializer.data)

    @action(detail = False, methods = ['get'])
    def get_moderator_tasks(self, request):
        user = request.user
        queryset = AssignedTask.objects.filter(house = user.house).filter(undone = False).filter(assigned = True).filter(checked=False).order_by('date')
        serializer = serializers.AssignedTaskSerializer(queryset, many = True, context = {'request': request})
        return Response(serializer.data)

    @action(detail = True, methods = ['get'])
    def get_records(self, request, pk):
        assigned_task = self.get_object()
        queryset = UsersTasksRecord.objects.filter(assigned_task = assigned_task)
        serializer = serializers.UsersTasksRecordSerializer(queryset, many=True, context = {'request':request})
        return Response(serializer.data)

    #Función con la que el usuario hace check de forma personal.
    @action(detail = True, methods = ['get'])
    def user_check(self, request, pk):
        assigned_task = self.get_object()
        #Si el moderador ya ha hecho checked sobre la tarea, o bien la ha marcado como undone, el usuario ya no puede hacer check.
        if assigned_task.checked or assigned_task.undone:
            return Response(status = status.HTTP_403_FORBIDDEN)
        else:
            record = UsersTasksRecord.objects.filter(user = request.user).filter(assigned_task = assigned_task).first()
            record.personal_checked = True
            record.save()
            notification = Notification()
            notification.house = request.user.house
            notification.text = request.user.username + " ha hecho check sobre la tarea " + assigned_task.task.name + " del día " + str(assigned_task.date)
            notification.save()
            return Response(status = status.HTTP_200_OK)

    @action(detail = True, methods = ['get'])
    def global_check(self, request, pk):
        #Comprobamos que no está ya checked.
        assigned_task = self.get_object()

        #También hemos de comprobar que el usuario que lo quiere realizar es el moderador en cuestión:
        if request.user == assigned_task.house.moderator:
            #Solo cuando la tarea no está checkeada, el moderador puede entrar a evaluar cada uno de los usuarios en el record correspondiente.
            if assigned_task.checked == False and assigned_task.undone == False:
                assigned_task.checked = True
                assigned_task.save()

                records = UsersTasksRecord.objects.filter(assigned_task = assigned_task).all()

                for record in records:
                    user = record.user
                    if record.personal_checked == True and record.moderator_checked == True:
                        user.personal_rating += assigned_task.task.difficulty
                        user.save()

                    elif record.personal_checked == True and record.moderator_checked == True:
                        record.user.personal_rating += assigned_task.task.difficulty * 0.25
                        user.save()

                    elif record.personal_checked == False and record.moderator_checked == True:
                        record.user.personal_rating += assigned_task.task.difficulty * 0.5
                        user.save()

                    #Añadimos a la tabla UsersTasksCounter que el usuario ha hecho una tarea más.
                    counter = UsersTasksCounter.objects.filter(user = user).filter(task = assigned_task.task).first()
                    if not counter:
                        counter = UsersTasksCounter()
                        counter.user = user
                        counter.task = assigned_task.task
                        counter.date = assigned_task.date
                    else:
                        counter.date = assigned_task.date

                    counter.save()
                    #Comprobamos que si, al realizar el global_check, el checked del moderador es False,
                    #se contabiliza como un mistake en el counter.
                    if record.moderator_checked == False:
                        counter.mistakes += 1
                    else:
                        counter.counter += 1
                    counter.save()


                #Comprobamos si se trata de una tarea de rutina para así crear la siguiente.
                if assigned_task.routine == True:
                    #Modificamos el last_routine del Task para que así tengamos en referencia la última rutina creada.
                    task = assigned_task.task
                    task.last_routine += datetime.timedelta(days=assigned_task.period)
                    task.save()

                    #A continuación creamos la nueva AssignedTask con la próxima fecha y la guardamos.
                    new_task = AssignedTask()
                    new_task.task = assigned_task.task
                    new_task.routine = True
                    new_task.date = task.last_routine
                    new_task.house = assigned_task.house
                    new_task.period = assigned_task.period
                    new_task.n_users = assigned_task.n_users
                    new_task.save()

                    #Devolvemos la nueva rutina creada.
                    serializer = serializers.AssignedTaskSerializer(new_task, context = {'request': request})
                    return Response(serializer.data)

                #Si no es de rutina, tan solo devolvemos que ha funcionado correctamente.
                else:
                    return Response(status=status.HTTP_200_OK)

            #Si ya está checked, indicamos que no se puede volver a hacer check puesto que ya está realizada.
            else:
                return Response(status = status.HTTP_403_FORBIDDEN)
        else:
            return Response(status = status.HTTP_403_FORBIDDEN)

class QuestionnaireViewSet(viewsets.ModelViewSet):
    queryset = Questionnaire.objects.all().order_by('name')
    serializer_class = serializers.QuestionnaireSerializer
    permission_classes = [permissions.IsAuthenticated]

class DoneQuestionnaireViewSet(viewsets.ModelViewSet):
    queryset = DoneQuestionnaire.objects.all().order_by('questionnaire__name')
    serializer_class = serializers.DoneQuestionnaireSerializer
    permission_classes = [permissions.IsAuthenticated]

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all().order_by('title')
    serializer_class = serializers.QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

class UsersTasksCounterViewSet(viewsets.ModelViewSet):
    queryset = UsersTasksCounter.objects.all().order_by('user__username')
    serializer_class = serializers.UsersTasksCounterSerializer
    permission_classes = [permissions.IsAuthenticated]

class UsersTasksRecordViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.UsersTasksRecordSerializer
    permission_classes = [permissions.IsAuthenticated]


    def get_queryset(self):
        user = self.request.user

        return UsersTasksRecord.objects.filter(user__house = user.house).order_by('assigned_task__date')


    @action(detail = False, methods = ['get'])
    def get_personal_records(self, request):
        user = request.user
        queryset = UsersTasksRecord.objects.filter(user=user).order_by('assigned_task__date')
        serializer = serializers.UsersTasksRecordSerializer(queryset, many = True, context = {'request': request})
        return Response(serializer.data)

    @action(detail = False, methods = ['get'])
    def get_moderator_records(self, request):
        user = request.user
        queryset = UsersTasksRecord.objects.filter(user__house = user.house).filter(assigned_task__undone = False).filter(assigned_task__assigned = True).filter(assigned_task__checked=False).order_by('assigned_task__date')
        serializer = serializers.UsersTasksRecordSerializer(queryset, many = True, context = {'request': request})
        return Response(serializer.data)

    #Función con la que indicamos que hemos completado una tarea, lo modificamos y además si se trata de routine
    #almacenamos en last_routine de su Task esta fecha y creamos una nueva con la fecha próxima correspondiente.
    #También ya realizamos todo lo demás es en este momento cuando se comprueba todos los demás check.
    @action(detail = True, methods = ['get'])
    def moderator_check(self, request, pk):
        #Comprobamos que no está ya checked.
        record = self.get_object()
        assigned_task = record.assigned_task
        #Comprobamos lo primero que el usuario que está accediendo al método es el moderador esta semana:
        if request.user == assigned_task.house.moderator:
            #Solo cuando la tarea está checkeada, el moderador puede entrar a evaluar cada uno de los usuarios en el record correspondiente.
            if assigned_task.checked == False and assigned_task.undone == False and record.moderator_checked == False:
                record.moderator_checked = True
                record.save()
                notification = Notification()
                notification.house = request.user.house
                notification.text = "El moderador ha hecho check sobre " + record.user.username + " en la tarea " + record.assigned_task.task.name + " del día " + str(record.date)
                print(notification.text)
                notification.save()

                return Response(status = status.HTTP_200_OK)
            else:
                return Response(status = status.HTTP_422_UNPROCESSABLE_ENTITY)
        else:
            return Response(status = status.HTTP_403_FORBIDDEN)



class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        return Notification.objects.filter(house = user.house, date = timezone.now().date()).order_by('-id')[:5]
