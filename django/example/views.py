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

@login_required
def compare_documents(request):
    if request.method == 'POST' and request.FILES.get('upload1') and request.FILES.get('upload2'):
        uploaded_file1 = request.FILES['upload1']
        uploaded_file2 = request.FILES['upload2']
        fs = FileSystemStorage()
        
        # Save both files
        filename1 = fs.save(uploaded_file1.name, uploaded_file1)
        filename2 = fs.save(uploaded_file2.name, uploaded_file2)
        
        file_path1 = os.path.join(settings.MEDIA_ROOT, filename1)
        file_path2 = os.path.join(settings.MEDIA_ROOT, filename2)
        
        try:
            # Process both documents
            doc1 = process_document_ai(file_path1)
            doc2 = process_document_ai(file_path2)
            
            formatted_content1 = format_document_content(doc1)
            formatted_content2 = format_document_content(doc2)
            
            user_question = request.POST.get('comparison_question', '')
            
            comparison_response = None
            if user_question:
                # Create a prompt that asks Gemini to compare the two documents
                combined_content = f"""Document 1:
{formatted_content1}

Document 2:
{formatted_content2}

Please compare these two insurance documents and answer the following question:
{user_question}

Focus on providing a clear, structured comparison that highlights the key differences and similarities relevant to the question."""
                
                comparison_response = send_to_gemini(combined_content, user_question)
            
            return render(request, 'compare.html', {
                'file1_url': fs.url(filename1),
                'file2_url': fs.url(filename2),
                'comparison_response': comparison_response,
                'question': user_question
            })
            
        except Exception as e:
            return render(request, 'compare.html', {
                'error': f"Error processing documents: {str(e)}"
            })
            
    return render(request, 'compare.html')
