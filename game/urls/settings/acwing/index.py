from django.urls import path
from game.views.settings.acwing.web.apply_code import apply_code as web_ac
from game.views.settings.acwing.web.receive_code import receive_code as web_rc
from game.views.settings.acwing.acapp.apply_code import apply_code as acapp_ac
from game.views.settings.acwing.acapp.receive_code import receive_code as acapp_rc

urlpatterns=[
    path("web/apply_code/",web_ac,name="settings_acwing_web_apply_code"),
    path("web/receive_code/",web_rc,name="settings_acwing_web_receive_code"),
    path("acapp/apply_code",acapp_ac,name="settings_acwing_acapp_apply_code"),
    path("acapp/receive_code/",acapp_rc,name="settings_acwing_acapp_receive_code"),
]
