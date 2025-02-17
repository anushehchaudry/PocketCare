from django.shortcuts import render, redirect
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from example.functions import process_document_ai, format_document_content, send_to_gemini
import os

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')
    else:
        form = UserCreationForm()
    return render(request, 'register.html', {'form': form})

def user_login(request):
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('index')
    else:
        form = AuthenticationForm()
    return render(request, 'login.html', {'form': form})

@login_required
def user_logout(request):
    logout(request)
    return redirect('login')

@login_required
def profile(request):
    return render(request, 'profile.html')

@login_required
def index(request):
    print("Function started")
    print(request.POST)
    if request.method == 'POST' and request.FILES.get('upload'):
        print("hello, made it here")
        uploaded_file = request.FILES['upload']
        fs = FileSystemStorage()
        
        filename = fs.save(uploaded_file.name, uploaded_file)
        file_path = os.path.join(settings.MEDIA_ROOT, filename)
        
        try:
            print("now here")
            doc = process_document_ai(file_path)
            print("now here")
            formatted_content = format_document_content(doc)
            user_text = request.POST.get('user_text', '')

            file_url = fs.url(filename)

            gemini_response = None
            if user_text:
                print("sending to gemini")
                gemini_response = send_to_gemini(formatted_content, user_text)
            
            print(gemini_response)
            
            return render(request, 'index.html', {
                'file_url': file_url,
                'processed_content': formatted_content
            })
            
        except Exception as e:
            print(e)
            # Handle any errors
            return render(request, 'index.html', {
                'error': f"Error processing document: {str(e)}"
            })
            
    return render(request, 'index.html')

