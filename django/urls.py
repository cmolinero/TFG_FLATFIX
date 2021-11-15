from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from apirest import views
from rest_framework.authtoken.views import obtain_auth_token


router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet, basename = 'user')
router.register(r'tasks', views.TaskViewSet)
router.register(r'tags', views.TagViewSet)
router.register(r'events', views.EventViewSet)
router.register(r'houses', views.HouseViewSet)
router.register(r'assignedtasks', views.AssignedTaskViewSet, basename = 'assignedtask')
router.register(r'questions', views.QuestionViewSet)
router.register(r'questionnaires', views.QuestionnaireViewSet)
router.register(r'donequestionnaires', views.DoneQuestionnaireViewSet)
router.register(r'userstaskscounters', views.UsersTasksCounterViewSet)
router.register(r'userstasksrecords', views.UsersTasksRecordViewSet, basename = 'userstasksrecord')
router.register(r'config', views.ConfigViewSet)
router.register(r'notifications', views.NotificationViewSet, basename = 'notification')





# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    path('api-token-auth/', obtain_auth_token, name = 'api-token-auth'),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path(r'register/', views.RegisterView.as_view(), name='register_user'),
    path('', include(router.urls)),

]
