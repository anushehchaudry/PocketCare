from google.cloud import documentai
from google.cloud.documentai_toolbox import document as doc_toolbox
import environ
from google.oauth2 import service_account
from presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig
import google.generativeai as genai
from django.core.signing import Signer

signer = Signer()
env = environ.Env()
environ.Env.read_env()

# Read constants from .env file
PROJECT_ID = env('PROJECT_ID')
LOCATION = env('LOCATION')
PROCESSOR_ID = env('PROCESSOR_ID')
MIME_TYPE = env('MIME_TYPE', default='application/pdf')
GEMINI_API_KEY = env('GEMINI_API_KEY')


class EnhancedHIPAADeidentifier:
    def __init__(self):
        self.analyzer = AnalyzerEngine()
        self.anonymizer = AnonymizerEngine()
        
        self._add_custom_recognizers()

    def _add_custom_recognizers(self):
        account_pattern = Pattern(
            name="account_number",
            regex=r"\b\d{8,17}\b",
            score=0.75
        )
        account_recognizer = PatternRecognizer(
            supported_entity="ACCOUNT_NUMBER",
            patterns=[account_pattern]
        )

        license_pattern = Pattern(
            name="medical_license",
            regex=r"\b[A-Z]\d{6}\b",  
            score=0.75
        )
        license_recognizer = PatternRecognizer(
            supported_entity="LICENSE_NUMBER",
            patterns=[license_pattern]
        )

        vin_pattern = Pattern(
            name="vin",
            regex=r"\b[A-HJ-NPR-Z0-9]{17}\b",
            score=0.75
        )
        vin_recognizer = PatternRecognizer(
            supported_entity="VEHICLE_ID",
            patterns=[vin_pattern]
        )

        age_pattern = Pattern(
            name="age_over_89",
            regex=r"\b(9\d|1[0-9]\d)\s*(years?\s*(old|of\s*age)?|yo)\b",
            score=0.75
        )
        age_recognizer = PatternRecognizer(
            supported_entity="AGE_OVER_89",
            patterns=[age_pattern]
        )

        fax_pattern = Pattern(
            name="fax_number",
            regex=r"\b(Fax|FAX|fax):\s*\+?\d{1,3}[-\s]?\d{3}[-\s]?\d{4}\b",
            score=0.75
        )
        fax_recognizer = PatternRecognizer(
            supported_entity="FAX_NUMBER",
            patterns=[fax_pattern]
        )

        self.analyzer.registry.add_recognizer(account_recognizer)
        self.analyzer.registry.add_recognizer(license_recognizer)
        self.analyzer.registry.add_recognizer(vin_recognizer)
        self.analyzer.registry.add_recognizer(age_recognizer)
        self.analyzer.registry.add_recognizer(fax_recognizer)

    def deidentify(self, text):
        entities = [
            "PERSON", "PHONE_NUMBER", "EMAIL_ADDRESS", 
            "US_SSN", "DATE_TIME", "URL", "IP_ADDRESS",
            "LOCATION", "MEDICAL_LICENSE", "ACCOUNT_NUMBER",
            "LICENSE_NUMBER", "VEHICLE_ID", "AGE_OVER_89",
            "FAX_NUMBER"
        ]

        results = self.analyzer.analyze(
            text=text,
            entities=entities,
            language='en'
        )

        operators = {
    "PERSON": OperatorConfig("mask" , {
        "masking_char": "#",
        "chars_to_mask": 10,
        "from_end": False
    }), 
    "PHONE_NUMBER": OperatorConfig("mask", {
        "masking_char": "#",
        "chars_to_mask": 10,
        "from_end": False
    }),
    "EMAIL_ADDRESS": OperatorConfig("mask", {
        "masking_char": "*",
        "chars_to_mask": 100,
        "from_end": False
    }),
    "US_SSN": OperatorConfig("mask", {
        "masking_char": "X",
        "chars_to_mask": 9,
        "from_end": False
    }),
    "DATE_TIME": OperatorConfig("replace", {"new_value": "<DATE>"}),
    "URL": OperatorConfig("mask", {
        "masking_char": "*",
        "chars_to_mask": 100,
        "from_end": False
    }),
    "IP_ADDRESS": OperatorConfig("mask", {
        "masking_char": "*",
        "chars_to_mask": 15,
        "from_end": False
    }),
    "LOCATION": OperatorConfig("replace", {"new_value": "<LOCATION>"}),
    "MEDICAL_LICENSE": OperatorConfig("mask", {
        "masking_char": "#",
        "chars_to_mask": 20,
        "from_end": False
    }),
    "ACCOUNT_NUMBER": OperatorConfig("mask", {
        "masking_char": "#",
        "chars_to_mask": 20,
        "from_end": False
    }),
    "LICENSE_NUMBER": OperatorConfig("mask", {
        "masking_char": "#",
        "chars_to_mask": 20,
        "from_end": False
    }),
    "VEHICLE_ID": OperatorConfig("mask", {
        "masking_char": "#",
        "chars_to_mask": 17,
        "from_end": False
    }),
    "AGE_OVER_89": OperatorConfig("replace", {"new_value": "89+"}),
    "FAX_NUMBER": OperatorConfig("mask", {
        "masking_char": "#",
        "chars_to_mask": 10,
        "from_end": False
    })
}

        anonymized = self.anonymizer.anonymize(
            text=text,
            analyzer_results=results,
            operators=operators,
        
        )

        return anonymized.text
    
DEIDENTIFIER = EnhancedHIPAADeidentifier()
    
def send_to_gemini(formatted_text, user_question, system_prompt):
    """
    Send formatted text and user question to Gemini API using the official Python client
    
    Args:
        formatted_text (str): The formatted text from the document
        user_question (str): The user's question about the document
        system_prompt (str): The system prompt to guide the model's response
        api_key (str): Your Gemini API key
        
    Returns:
        str: Gemini's response
    """
    try:
        formatted_text = signer.unsign(formatted_text)
        user_question = signer.unsign(user_question)
    except:
        raise Exception(f"Security Vulnerability Detected")
    
    try:
        
        # Configure the Gemini API
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Initialize the model
        model = genai.GenerativeModel('gemini-1.5-flash')

        #deidentify the text
        formatted_text = DEIDENTIFIER.deidentify(formatted_text)
        print(formatted_text)
        
        # Construct the prompt
        prompt = f"""{system_prompt} 
Context:
{formatted_text}

Question:
{user_question}

Please analyze the context and answer the question."""
        
        # Generate response
        print("Sending Information")
        response = model.generate_content(prompt)
        print("Gemini has Responded")
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