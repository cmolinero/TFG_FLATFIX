from django.contrib import admin
from apirest.models import Task, House, Event, Tag, User, AssignedTask, Question, Questionnaire, DoneQuestionnaire, UsersTasksCounter, UsersTasksRecord, Config
from django.contrib.auth.admin import UserAdmin

# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(Task)
admin.site.register(Event)
admin.site.register(House)
admin.site.register(Tag)
admin.site.register(AssignedTask)
admin.site.register(Question)
admin.site.register(Questionnaire)
admin.site.register(DoneQuestionnaire)
admin.site.register(UsersTasksCounter)
admin.site.register(UsersTasksRecord)
admin.site.register(Config)
