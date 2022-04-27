from django.http import HttpResponse



def index(request):
    index1="my web"
    return HttpResponse(index1)

# Create your views here.
