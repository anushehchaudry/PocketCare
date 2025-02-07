from django.shortcuts import render
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from example.functions import process_document_ai, format_document_content, send_to_gemini
import os


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