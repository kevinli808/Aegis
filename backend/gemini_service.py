import os
from dotenv import load_dotenv
import google.genai as genai
from severity_ranker import SeverityRanker

# Load environment variables
load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')

if not api_key:
    print('Warning: GEMINI_API_KEY is not set in environment variables')
else:
    genai.configure(api_key=api_key)


def build_context_prompt(form_data: dict) -> str:
    """Build initial context from help request form data"""
    return f"""
The user has submitted the following help request:

Name: {form_data.get('name', 'N/A')}
Phone: {form_data.get('phone', 'N/A')}
Location: {form_data.get('location', 'N/A')}
City: {form_data.get('city', 'N/A')}, {form_data.get('province', 'N/A')} {form_data.get('postalCode', 'N/A')}

Situation: {form_data.get('situation', 'N/A')}

Medical Conditions: {form_data.get('medicalConditions', 'None reported')}
Immediacy Level: {form_data.get('immediacy', 'N/A')}
Number of People Affected: {form_data.get('numberOfPeople', '1')}

Environmental Hazards: {form_data.get('environmentalHazards', 'None reported')}
Is Child Involved: {'Yes' if form_data.get('isChild') else 'No'}
Has Mobility Limitations: {'Yes' if form_data.get('hasMobilityLimitations') else 'No'}

You are a trained emergency response assistant. Based on the situation described above, provide:
1. Immediate safety recommendations
2. First aid guidance if applicable
3. Resources and next steps
4. Reassurance and support

Be compassionate, clear, and concise. Focus on actionable advice.
"""


async def generate_intro_statement(form_data: dict) -> str:
    """
    Generate a personalized intro statement for the user based on their help request
    
    Args:
        form_data: The help request form data
    
    Returns:
        str: A personalized intro statement with immediate feedback
    """
    if not api_key:
        raise Exception('Gemini API key not configured')
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""You are a compassionate emergency response assistant. Generate a personalized, warm intro statement for someone seeking emergency help.

Their situation:
- Situation: {form_data.get('situation', 'N/A')}
- Location: {form_data.get('city', 'N/A')}, {form_data.get('province', 'N/A')}
- Medical Conditions: {form_data.get('medicalConditions', 'None reported')}
- Immediacy: {form_data.get('immediacy', 'N/A')}
- Number of People: {form_data.get('numberOfPeople', '1')}
- Environmental Hazards: {form_data.get('environmentalHazards', 'None reported')}
- Child Involved: {'Yes' if form_data.get('isChild') else 'No'}
- Mobility Issues: {'Yes' if form_data.get('hasMobilityLimitations') else 'No'}

Create an intro statement that:
1. Welcomes them warmly and shows you understand their specific situation
2. Acknowledges the severity of what they're facing
3. Offers immediate, tailored support relevant to THEIR situation (not generic)
4. Provides 3-4 specific bullet points of help you can offer based on their situation
5. Invites them to ask specific questions about their scenario
6. Is compassionate, professional, and action-oriented

Keep it concise (under 250 words) and immediately actionable."""
        
        response = model.generate_content(prompt)
        return response.text
    
    except Exception as error:
        print(f'Error generating intro statement: {error}')
        raise


async def get_chat_response(conversation_history: list, user_message: str, form_data: dict = None, is_first_message: bool = False) -> str:
    """
    Get response from Gemini API
    
    Args:
        conversation_history: List of previous messages [{"role": "user|model", "content": "..."}]
        user_message: The current user message
        form_data: Form data for context (used on first message)
        is_first_message: Whether this is the first user message
    
    Returns:
        str: The assistant's response
    """
    if not api_key:
        raise Exception('Gemini API key not configured')
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Prepare the query
        query_text = user_message
        if is_first_message and form_data:
            query_text = build_context_prompt(form_data) + f'\n\nUser query: {user_message}'
        
        # Format conversation history for Gemini
        history = []
        for msg in conversation_history:
            history.append({
                'role': msg['role'],
                'parts': [{'text': msg['content']}]
            })
        
        # Start a chat session
        chat = model.start_chat(history=history)
        response = chat.send_message(query_text)
        
        return response.text
    
    except Exception as error:
        print(f'Error getting Gemini response: {error}')
        raise
