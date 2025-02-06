# example/views.py
from django.shortcuts import render
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from example.functions import process_document_ai, format_document_content
import os

def index(request):
    print("Function started")
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
            
            file_url = fs.url(filename)
            print(formatted_content)
            
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