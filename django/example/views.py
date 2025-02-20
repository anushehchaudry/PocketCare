from django.shortcuts import render, redirect
from django.core.files.storage import get_storage_class, FileSystemStorage
from django.core.signing import Signer
from django.conf import settings
import os
import hashlib
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from example.functions import process_document_ai, format_document_content, send_to_gemini

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
    if request.method == 'POST' and request.FILES.get('upload'):
        storage = get_storage_class()(location=settings.MEDIA_ROOT)
        signer = Signer()
        
        uploaded_file = request.FILES['upload']
        name = hashlib.sha256(str(uploaded_file.name).encode()).hexdigest()[:12]
        secure_filename = f"{name}_{uploaded_file.name}"
        
        path = storage.save(secure_filename, uploaded_file)
        file_path = storage.path(path)
        
        try:
            doc = process_document_ai(file_path)
            formatted_content = format_document_content(doc)
            user_text = request.POST.get('user_text', '')

            signed_content = signer.sign(formatted_content)
            signed_user_text = signer.sign(user_text) if user_text else None

            gemini_response = None
            if user_text:
                gemini_response = send_to_gemini(signed_content, signed_user_text)
            
            storage.delete(path)
            
            return render(request, 'index.html', {
                'file_url': storage.url(path) if path else None,
                'processed_content': formatted_content,
                'user_text': user_text,
                'gemini_response': gemini_response
            })
            
        except Exception as e:
            storage.delete(path)
            return render(request, 'index.html', {
                'error': f"Error processing document: {str(e)}"
            })
            
    return render(request, 'index.html')

@login_required
def compare_documents(request):
    if request.method == 'POST' and request.FILES.get('upload1') and request.FILES.get('upload2'):
        storage = get_storage_class()(location=settings.MEDIA_ROOT)
        signer = Signer()
        
        def secure_filename(file):
            name = hashlib.sha256(str(file.name).encode()).hexdigest()[:12]
            return f"{name}_{file.name}"

        uploaded_file1 = request.FILES['upload1']
        uploaded_file2 = request.FILES['upload2']
        
        filename1 = secure_filename(uploaded_file1)
        filename2 = secure_filename(uploaded_file2)
        
        path1 = storage.save(filename1, uploaded_file1)
        path2 = storage.save(filename2, uploaded_file2)
        
        file_path1 = storage.path(path1)
        file_path2 = storage.path(path2)
        
        try:
            doc1 = process_document_ai(file_path1)
            doc2 = process_document_ai(file_path2)
            
            formatted_content1 = format_document_content(doc1)
            formatted_content2 = format_document_content(doc2)
            
            user_question = request.POST.get('comparison_question', '')
            
            signed_question = signer.sign(user_question)
            
            comparison_response = None
            if user_question:
                combined_content = f"""Document 1:
{formatted_content1}

Document 2:
{formatted_content2}

Please compare these two insurance documents and answer the following question:
{user_question}

Focus on providing a clear, structured comparison that highlights the key differences and similarities relevant to the question."""
                
                signed_content = signer.sign(combined_content)
                comparison_response = send_to_gemini(signed_content, signed_question)
            
            storage.delete(path1)
            storage.delete(path2)
            
            return render(request, 'compare.html', {
                'comparison_response': comparison_response,
                'question': user_question
            })
            
        except Exception as e:
            storage.delete(path1)
            storage.delete(path2)
            return render(request, 'compare.html', {
                'error': f"Error processing documents: {str(e)}"
            })
            
    return render(request, 'compare.html')
