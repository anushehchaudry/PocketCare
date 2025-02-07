from google.cloud import documentai
from google.cloud.documentai_toolbox import document as doc_toolbox
import environ
from google.oauth2 import service_account
import google.generativeai as genai

env = environ.Env()
environ.Env.read_env()

# Read constants from .env file
PROJECT_ID = env('PROJECT_ID')
LOCATION = env('LOCATION')
PROCESSOR_ID = env('PROCESSOR_ID')
MIME_TYPE = env('MIME_TYPE', default='application/pdf')
GEMINI_API_KEY = env('GEMINI_API_KEY')

def send_to_gemini(formatted_text, user_question):
    """
    Send formatted text and user question to Gemini API using the official Python client
    
    Args:
        formatted_text (str): The formatted text from the document
        user_question (str): The user's question about the document
        api_key (str): Your Gemini API key
        
    Returns:
        str: Gemini's response
    """
    try:
        # Configure the Gemini API
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Initialize the model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Construct the prompt
        prompt = f"""Context:
{formatted_text}

Question:
{user_question}

Please analyze the context and answer the question."""
        
        # Generate response
        print("rn sedning")
        response = model.generate_content(prompt)
        print("gemini has responded")
        return response.text
        
    except Exception as e:
        raise Exception(f"Error communicating with Gemini API: {str(e)}")


def process_document_ai(file_path):
    """
    Process a document using Document AI and return formatted content
    """
    credentials = service_account.Credentials.from_service_account_file(
        env('GOOGLE_APPLICATION_CREDENTIALS')
    )
    
    # Set client options without credentials
    client_options = {
        "api_endpoint": f"{LOCATION}-documentai.googleapis.com"
    }
    
    # Pass credentials separately from client_options
    documentai_client = documentai.DocumentProcessorServiceClient(
        client_options=client_options,
        credentials=credentials
    )
    
    resource_name = documentai_client.processor_path(PROJECT_ID, LOCATION, PROCESSOR_ID)
    
    with open(file_path, "rb") as file:
        content = file.read()
        
    raw_document = documentai.RawDocument(content=content, mime_type=MIME_TYPE)
    request = documentai.ProcessRequest(name=resource_name, raw_document=raw_document)
    result = documentai_client.process_document(request=request)
    
    return result.document

def format_document_content(doc):
    """
    Format the document in a way we can actually pass it to the model
    """
    formatted_output = []
    wrapped_doc = doc_toolbox.Document.from_documentai_document(doc)
    
    formatted_output.append("DOCUMENT TEXT:")
    formatted_output.append(doc.text)
    formatted_output.append("\n")
    
    formatted_output.append("TABLES FOUND IN DOCUMENT:")
    for page in wrapped_doc.pages:
        for table_index, table in enumerate(page.tables):
            
            df = table.to_dataframe()
            formatted_output.append(f"Table {table_index+1}\n")
            table_str = df.to_string(index=False)
            formatted_output.append(table_str)
            formatted_output.append("\n")
    
    formatted_output.append("\nFORM FIELDS:")
    for page in doc.pages:
        for field in page.form_fields:
            name = field.field_name.text_anchor.content.strip()
            value = field.field_value.text_anchor.content.strip()
            formatted_output.append(f"{name}: {value}")
    
    if hasattr(doc, 'entities') and doc.entities: 
        formatted_output.append("\nENTITIES DETECTED:")
        for entity in doc.entities:
            entity_text = entity.mention_text
            entity_type = entity.type_
            formatted_output.append(f"{entity_type}: {entity_text}")
        
    return "\n".join(formatted_output)