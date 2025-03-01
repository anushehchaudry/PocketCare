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
from .models import BillAnalysis, QuestionnaireResponse  # Import the QuestionnaireResponse model
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import FileResponse


@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({"message": "CSRF cookie set"})

@ensure_csrf_cookie
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
def api_initial_analyze_bill(request):
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
        response = QuestionnaireResponse.objects.filter(user=request.user).first()
        user_information = {
            'name': response.name,
            'age': response.age,
            'pre_existing_conditions': response.pre_existing_conditions,
            'employment_status': response.employment_status,
            'income': response.income,
            'visits_per_year': response.visits_per_year,
            'medications': response.medications,
        } if response else {}

        signed_content = signer.sign(formatted_content)
        signed_user_information = signer.sign(json.dumps(user_information)) if user_information else None

        system_prompt = """You are a warm, friendly, and empathetic assistant who specializes in helping users understand the details of their medical bills and medical insurance. You have been provided with the full text of the user’s uploaded medical bill as context. Your role is to carefully analyze this context and provide an initial analysis of the bill, including Summary of Charges, Details of Services Billed, What the user’s responsibility Includes, and next steps. Make sure to never mention to the user that information is redacted. Don’t incorporate information you don’t have into the response, like dates.

When answering, please use a conversational tone that is clear, supportive, and personable. Be sure to explain any details in a way that feels approachable and reassuring, ensuring the user feels understood and well-guided.

Here is an example of what you should include in your analysis: 

Hi there! Let’s go through your medical bill together.
I know medical bills can feel confusing and overwhelming, but don't worry—you’re not alone! I’m here to walk you through everything, step by step, so you know exactly what this bill means and what to do next.
Summary of Charges:
Let’s break down the numbers:
Total Charges: $36,114.31 – This is the full cost of your medical services before insurance adjustments.
Insurance Covered: $34,139.31 – Great news! Your insurance has already covered a big chunk of this bill.
Your Payments So Far: $0.00 – You haven’t made any payments toward this bill yet.
Your Responsibility: $1,975.00 – This is the final amount you owe after insurance has done its part.
What Was This Bill For?:
Type of Service: Surgery at University Hospital Cardiac Prep & Recovery on July 17, 2024 – This means the charges are related to a procedure and the recovery care you received that day.
Provider: University of Utah Health – The hospital or medical center that provided your care.
Insurance Provider: Medicare (A & B) – This is your insurance, which helped cover a large portion of your bill.
Why Do You Still Owe $1,975.00?:
Even though insurance covered most of the cost, there are a few common reasons you might still have a balance:
Copayments: A fixed fee that insurance requires for certain services.
Deductible: The amount you have to pay out-of-pocket before insurance kicks in fully.
Coinsurance: A percentage of the total bill that you’re responsible for paying after meeting your deductible.
Next Steps & Payment Options:
You have a few ways to take care of this bill:
Online: Pay quickly at the website listed on the bill.
By Mail: Send a payment to the address listed on the bill
Need Help? If this amount is a financial burden, you might qualify for assistance. Call the number on your bill to ask about options—they’re there to help!
Medical bills can be tricky, but I hope this breakdown makes everything clearer for you! If anything doesn’t look right or if you have questions about a specific charge, I’d be happy to help you go through it. Let me know how I can support you!
"""
        initial_analysis = send_to_gemini(signed_content, signed_user_information, None, system_prompt)

        
        storage.delete(path)
        
        return Response({
            'status': 'success',
            'analysis': initial_analysis,
            'content': formatted_content
        })
        
    except Exception as e:
        if path:
            storage.delete(path)
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        user_question = request.POST.get('question', '')

        response = QuestionnaireResponse.objects.filter(user=request.user).first()
        user_information = {
            'name': response.name,
            'age': response.age,
            'pre_existing_conditions': response.pre_existing_conditions,
            'employment_status': response.employment_status,
            'income': response.income,
            'visits_per_year': response.visits_per_year,
            'medications': response.medications,
        } if response else {}

        signed_content = signer.sign(formatted_content)
        signed_question = signer.sign(user_question) if user_question else None
        signed_user_information = signer.sign(json.dumps(user_information)) if user_information else None
        analysis = None
        if user_question:
            system_prompt = """You are a warm, friendly, and empathetic assistant who specializes in helping users understand the details of their medical bills and medical insurance. You have been provided with the full text of the user’s uploaded medical bill as context. Your role is to carefully analyze this context and answer any questions strictly related to the medical bill or medical insurance.

When answering, please use a conversational tone that is clear, supportive, and personable. Be sure to explain any details in a way that feels approachable and reassuring, ensuring the user feels understood and well-guided.Make sure to never mention to the user that information is redacted. Don’t incorporate information you don’t have into the response, like dates.

If answering questions about bill details, charges, insurance information, or any related topics, please provide a thorough yet warm explanation using the context provided below that makes the user feel understood and reassured.

Here is an example of the tone you should have when answering questions: Hi there! I understand that medical bills can be confusing, so let’s break this down in a friendly, straightforward way:
Your total charges came to $627.00. Fortunately, you received $313.50 in adjustments (likely due to discounts or write-offs), which brings your current balance down to $313.50.
Let’s look at the details:
Visit 1:
You had an evaluation and management appointment. The original charge was $157.00, but with an uninsured discount applied, it was reduced to $78.50.
Visit 2:
This visit included an evaluation, management, and a Pap smear. The initial charge was $470.00. After adjustments of $172.50 and $62.50, the remaining balance for this visit came to $235.00.
When you add the balances from both visits ($78.50 + $235.00), you get the total amount due of $313.50.
If you have any questions or need more details, your bill also includes contact information via phone, online, or mail. I’m here to help if you need any further clarification!
If the question is not related to the medical bill or medical insurance, please respond with:
Unfortunately I can’t help with that query. I’m happy to answer any other questions regarding your medical bill or insurance details.
"""
        analysis = send_to_gemini(signed_content, signed_user_information, signed_question, system_prompt)
        
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

        response = QuestionnaireResponse.objects.filter(user=request.user).first()
        user_information = {
            'name': response.name,
            'age': response.age,
            'pre_existing_conditions': response.pre_existing_conditions,
            'employment_status': response.employment_status,
            'income': response.income,
            'visits_per_year': response.visits_per_year,
            'medications': response.medications,
        } if response else {}
        signed_user_information = signer.sign(json.dumps(user_information)) if user_information else None


        system_prompt = """You are a warm, friendly, and empathetic assistant who specializes in helping users understand the details of insurance plans and summaries of benefits. You have been provided with the full text of two insurance documents as context. Your role is to carefully analyze this context and answer any questions strictly related to the details, differences, or comparisons between these two insurance plans.

When answering, please use a conversational tone that is clear, supportive, and personable. Be sure to explain any details in a way that feels approachable and reassuring, ensuring the user feels understood and well-guided.

If the user’s question pertains to coverage details, deductibles, benefits, policy differences, or any related topics within the documents, provide a thorough yet warm explanation using the context provided below that makes the user feel understood and reassured.

Here is an example of the tone you should have when answering questions: Hi there! I understand that medical bills can be confusing, so let’s break this down in a friendly, straightforward way:
Your total charges came to $627.00. Fortunately, you received $313.50 in adjustments (likely due to discounts or write-offs), which brings your current balance down to $313.50.
Let’s look at the details:
Visit 1:
You had an evaluation and management appointment. The original charge was $157.00, but with an uninsured discount applied, it was reduced to $78.50.
Visit 2:
This visit included an evaluation, management, and a Pap smear. The initial charge was $470.00. After adjustments of $172.50 and $62.50, the remaining balance for this visit came to $235.00.
When you add the balances from both visits ($78.50 + $235.00), you get the total amount due of $313.50.
If you have any questions or need more details, your bill also includes contact information via phone, online, or mail. I’m here to help if you need any further clarification!
If the question is not related to the insurance documents or comparisons between them, please respond with:
Unfortunately I can’t help with that query. I’m happy to answer any other questions regarding the insurance plans or summaries of benefits.
"""
        comparison = send_to_gemini(signed_content, signed_question, signed_user_information, system_prompt)
        
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
                employment_status=data.get('employment_status', ''),
                income=int(data.get('income', 0)),
                visits_per_year=int(data.get('visits_per_year', 0)),
                medications=data.get('medications', ''),
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
                    'employment_status': response.employment_status,
                    'income': response.income,
                    'visits_per_year': response.visits_per_year,
                    'medications': response.medications,
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
            response.employment_status = data.get('employment_status', response.employment_status)
            response.income = data.get('income', response.income)
            response.visits_per_year = int(data.get('visits_per_year', response.visits_per_year))
            response.medications = data.get('medications', response.medications)
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_analysis(request):
    user = request.user
    file_name = request.data.get('fileName')
    analysis = request.data.get('analysis')
    formatted_content = request.data.get('content')
    
    if not file_name or not analysis:
        return Response({'status': 'error', 'message': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)
    
    BillAnalysis.objects.create(
        user=user,
        file_name=file_name,
        analysis=analysis,
        content=formatted_content  # You can add the content if needed
    )
    
    return Response({'status': 'success'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_docs(request):
    docs = BillAnalysis.objects.filter(user=request.user)
    data = [
        {
            'id': doc.id,
            'file_name': doc.file_name,
            'analysis': doc.analysis,
            'content': doc.content,
        }
        for doc in docs
    ]
    return Response({'status': 'success', 'data': data})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_doc(request, bill_id):
    try:
        bill = BillAnalysis.objects.get(id=bill_id, user=request.user)
        bill.delete()
        return Response({'status': 'success', 'message': 'Document deleted successfully'})
    except BillAnalysis.DoesNotExist:
        return Response({'status': 'error', 'message': 'Document not found'}, status=404)
    