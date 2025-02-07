# example/views.py
from django.shortcuts import render
from django.core.files.storage import FileSystemStorage

def index(request):
    file_url = None
    user_text = None

    if request.method == 'POST':
        if 'upload' in request.FILES:
            upload = request.FILES['upload']
            fss = FileSystemStorage()
            file = fss.save(upload.name, upload)
            file_url = fss.url(file)

        user_text = request.POST.get('user_text', '')
        
    return render(request, 'index.html', {'file_url': file_url, 'user_text': user_text})