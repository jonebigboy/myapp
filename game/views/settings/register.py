from django.contrib.auth import login
from django.http import JsonResponse
from django.contrib.auth.models import User
from game.models.player.player import Player



def register(request):
    data=request.GET
    username=data.get("username","").strip() #返回username 没有的话为空
    password=data.get("password","").strip()
    password_confirm=data.get("password_confirm","").strip()
    if not username or not password:
        return JsonResponse({
            'result':"用户名或者密码不能为空"
        })
    if password!=password_confirm:
        return JsonResponse({
            'result':"2次密码不相同"
        })
    if User.objects.filter(username=username).exists():
        return JsonResponse({
            'result':"用户名重复"
        })
    user=User(username=username)
    user.set_password(password)
    user.save()
    Player.objects.create(user=user,photo="https://img1.baidu.com/it/u=641861961,425940025&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500")
    login(request,user)
    return JsonResponse({
        'result':"success",
    })


