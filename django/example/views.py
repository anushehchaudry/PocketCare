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
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
import json
from django.http import JsonResponse
from .models import QuestionnaireResponse  # Import the QuestionnaireResponse model
from django.middleware.csrf import get_token
    
@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    try:
        data = request.data
        user = authenticate(request, username=data.get('email'), password=data.get('password'))
        if user is not None:
            login(request, user)
            response = JsonResponse({
                'status': 'success',
                'message': 'Login successful'
            })
            response['X-CSRFToken'] = get_token(request)
            return response
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid credentials'
            }, status=401)
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def api_register(request):
    try:
        form_data = {
            'username': request.data.get('email'), 
            'password1': request.data.get('password'), 
            'password2': request.data.get('confirmPassword'), 
        }
        form = UserCreationForm(form_data)
        if form.is_valid():
            user = form.save()
            response = JsonResponse({
                'status': 'success',
                'message': 'Registration successful'
            })
            response['X-CSRFToken'] = get_token(request)
            return response
        else:
            error_messages = []
            for field, errors in form.errors.items():
                field_name = {
                    'username': 'Email',
                    'password1': 'Password',
                    'password2': 'Confirm Password'
                }.get(field, field.title())
                
                for error in errors:
                    if "username already exists" in error.lower():
                        error_messages.append("An account with this email already exists.")
                    else:
                        error_messages.append(f"{field_name}: {error}")
            
            return JsonResponse({
                'status': 'error',
                'message': error_messages[0] if error_messages else 'Registration failed',
                'errors': error_messages
            }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid request data',
            'errors': [str(e)]
        }, status=400)

@api_view(['POST'])
def api_logout(request):
    if request.method == 'POST':
        logout(request)
        return JsonResponse({
            'status': 'success',
            'message': 'Logout successful'
        })
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    }, status=405)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_analyze_bill(request):
    if 'file' not in request.FILES:
        return Response({'status': 'error', 'message': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    storage = get_storage_class()(location=settings.MEDIA_ROOT)
    signer = Signer()
    
    uploaded_file = request.FILES['file']
    name = hashlib.sha256(str(uploaded_file.name).encode()).hexdigest()[:12]
    secure_filename = f"{name}_{uploaded_file.name}"
    
    try:
        path = storage.save(secure_filename, uploaded_file)
        file_path = storage.path(path)
        
        doc = process_document_ai(file_path)
        formatted_content = format_document_content(doc)
        user_question = request.data.get('question', '')

        signed_content = signer.sign(formatted_content)
        signed_question = signer.sign(user_question) if user_question else None

        analysis = None
        if user_question:
            analysis = send_to_gemini(signed_content, signed_question)
        
        storage.delete(path)
        
        return Response({
            'status': 'success',
            'analysis': analysis,
            'content': formatted_content
        })
        
    except Exception as e:
        if path:
            storage.delete(path)
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_compare_insurance(request):
    if 'file1' not in request.FILES or 'file2' not in request.FILES:
        return Response({'status': 'error', 'message': 'Two files are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    storage = get_storage_class()(location=settings.MEDIA_ROOT)
    signer = Signer()
    
    file1 = request.FILES['file1']
    file2 = request.FILES['file2']
    
    name1 = hashlib.sha256(str(file1.name).encode()).hexdigest()[:12]
    name2 = hashlib.sha256(str(file2.name).encode()).hexdigest()[:12]
    
    path1 = None
    path2 = None
    
    try:
        path1 = storage.save(f"{name1}_{file1.name}", file1)
        path2 = storage.save(f"{name2}_{file2.name}", file2)
        
        doc1 = process_document_ai(storage.path(path1))
        doc2 = process_document_ai(storage.path(path2))
        
        content1 = format_document_content(doc1)
        content2 = format_document_content(doc2)
        
        question = request.data.get('question', '')
        
        combined_content = f"""Document 1:
{content1}

Document 2:
{content2}

Please compare these two insurance documents and answer the following question:
{question}

Focus on providing a clear, structured comparison that highlights the key differences and similarities relevant to the question."""
        
        signed_content = signer.sign(combined_content)
        signed_question = signer.sign(question)
        
        comparison = send_to_gemini(signed_content, signed_question)
        
        storage.delete(path1)
        storage.delete(path2)
        
        return Response({
            'status': 'success',
            'comparison': comparison
        })
        
    except Exception as e:
        if path1:
            storage.delete(path1)
        if path2:
            storage.delete(path2)
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_questionnaire(request):
    try:
        data = request.data
      
        try:
            response = QuestionnaireResponse.objects.create(
                user=request.user,
                name=data.get('name', ''),
                age=int(data.get('age', 0)),
                pre_existing_conditions=data.get('pre_existing_conditions', ''),
                overall_health=data.get('overall_health', '')
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Questionnaire saved successfully'
            })
        except Exception as model_error:
            return JsonResponse({
                'status': 'error',
                'message': f'Failed to create questionnaire: {str(model_error)}',
                'errors': [str(model_error)]
            }, status=500)
            
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': 'Failed to process request',
            'errors': [str(e)]
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_questionnaire_status(request):
    try:
        response = QuestionnaireResponse.objects.filter(user=request.user.id).first()
        if response:
            return JsonResponse({
                'status': 'success',
                'hasCompleted': True,
                'data': {
                    'name': response.name,
                    'age': response.age,
                    'pre_existing_conditions': response.pre_existing_conditions,
                    'overall_health': response.overall_health
                }
            })
            
        return JsonResponse({
            'status': 'success',
            'hasCompleted': False,
            'data': None
        })
    except Exception as e:
        print(f"Error checking questionnaire status: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    try:
        data = request.data
        response = QuestionnaireResponse.objects.filter(user=request.user).first()
        if response:
            response.name = data.get('name', response.name)
            response.age = int(data.get('age', response.age))
            response.pre_existing_conditions = data.get('pre_existing_conditions', response.pre_existing_conditions)
            response.overall_health = data.get('overall_health', response.overall_health)
            response.save()
            return JsonResponse({
                'status': 'success',
                'message': 'Profile updated successfully'
            })
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Profile not found'
            }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': 'Failed to update profile',
            'errors': [str(e)]
        }, status=500)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_profile(request):
    try:
        user = request.user
        response = QuestionnaireResponse.objects.filter(user=user).first()
        if response:
            response.delete()
        user.delete()  # Delete the user and their login information
        return JsonResponse({
            'status': 'success',
            'message': 'Profile and user deleted successfully'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': 'Failed to delete profile',
            'errors': [str(e)]
        }, status=500)