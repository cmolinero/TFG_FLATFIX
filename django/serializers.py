from apirest.models import Task, Event, House, Tag, User, AssignedTask, Question, Questionnaire, DoneQuestionnaire, UsersTasksCounter, UsersTasksRecord, Config, Notification
from rest_framework import serializers
from django.utils import timezone
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password





class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
            required=True,
            validators=[UniqueValidator(queryset=User.objects.all())]
            )

    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )


        user.set_password(validated_data['password'])
        user.save()

        return user



class HouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = House
        fields = ['id','url', 'name', 'average_rating', 'average_mind_status', 'n_users', 'moderator', 'moderator_date', 'code']
        read_only_fields = ['id','moderator', 'moderator_date', 'average_rating', 'average_mind_status', 'n_users', 'code']

    def create(self, validated_data):
        house = House.objects.create(
            name = validated_data['name'],
            code = getCode()
        )


class UserSerializer(serializers.ModelSerializer):
    house = HouseSerializer()
    class Meta:
        model = User
        fields = ['id','url', 'username', 'email', 'house', 'personal_rating', 'mind_status', 'moderator_number', 'first_name', 'last_name', 'liked_tasks', 'disliked_tasks']
        read_only_fields = ['id','moderator_number', 'mind_status', 'personal_rating', 'url', 'house', 'username']
        extra_kwargs = {'password': {'write_only': True}}



        def create(self, validated_data):
            user = User.objects.create(
                username=validated_data['username'],
                email=validated_data['email'],
            )

            user.set_password(validated_data['password'])
            user.save()

            return user


class ConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = Config
        fields = ['n1_mistakes', 'n2_mistakes', 'n3_mistakes', 'n4_mistakes','p1_mistakes', 'p2_mistakes', 'p3_mistakes', 'p4_mistakes']




class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'url', 'name', 'tags', 'house', 'last_routine', 'difficulty','multiple']
        read_only_fields = ['id','difficulty','last_routine']



class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['url', 'name', 'date', 'house', 'users']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'url', 'name', 'difficulty', 'group']
        read_only_fields = ['id', 'difficulty', 'name', 'url', 'group']

class AssignedTaskSerializer(serializers.ModelSerializer):
    users = UserSerializer(many=True)
    task = TaskSerializer()
    class Meta:
        model = AssignedTask
        fields = ['id','url', 'task', 'house', 'users', 'date', 'checked', 'assigned', 'routine', 'period', 'undone', 'n_users', 'name']
        read_only_fields = ['id', 'name', 'url', 'assigned', 'routine', 'undone']


class QuestionnaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Questionnaire
        fields = ['url', 'name', 'description', 'questions']

class DoneQuestionnaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoneQuestionnaire
        fields = ['url', 'name', 'questionnaire', 'user', 'points']

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['url', 'title', 'first_answer', 'second_answer', 'third_answer', 'first_points', 'second_points', 'third_points']


class UsersTasksCounterSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsersTasksCounter
        fields = ['url', 'user', 'task', 'counter', 'date', 'mistakes']
        read_only_fields = ['user', 'task', 'counter', 'date', 'mistakes']

class UsersTasksRecordSerializer(serializers.ModelSerializer):
    assigned_task = AssignedTaskSerializer()
    user = UserSerializer()
    class Meta:
        model = UsersTasksRecord
        fields = ['id','url', 'user', 'assigned_task', 'date', 'personal_checked', 'moderator_checked']
        read_only_fields = ['id']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'text', 'date']
        read_only_fields = ['id', 'text', 'date']

class RoutineSerializer(serializers.Serializer):

    period = serializers.IntegerField()
    date = serializers.DateField()
    n_users = serializers.IntegerField()

class SingleTaskSerializer(serializers.Serializer):
    date = serializers.DateField()
    n_users = serializers.IntegerField()
    day_time = serializers.IntegerField()

class House_UserSerializer(serializers.Serializer):
    code = serializers.IntegerField()

class AssignedTaskByDaySerializer(serializers.Serializer):
    date = serializers.DateField()

class AssignedTaskByMonthSerializer(serializers.Serializer):
    month = serializers.IntegerField()
    year = serializers.IntegerField()
