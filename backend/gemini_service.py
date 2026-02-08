import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
from severity_ranker import SeverityRanker

# Load environment variables
load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')

if not api_key:
    print('Warning: GEMINI_API_KEY is not set in environment variables')
else:
    genai.configure(api_key=api_key)


def _build_incident_summary(data: dict) -> str:
    """Build a concise summary of incident data for the scoring prompt."""
    situation = data.get("situation") or data.get("type") or "unspecified"
    symptoms = data.get("symptoms", [])
    if isinstance(symptoms, list):
        symptoms_str = ", ".join(str(s) for s in symptoms) if symptoms else "none"
    else:
        symptoms_str = str(symptoms)
    return f"""
Incident Type: {data.get('type', 'unknown')}
Situation Description: {situation}
Medical Conditions / Symptoms: {symptoms_str}
Safety Status: {data.get('safety_status', 'unknown')}
Immediacy Level: {data.get('immediacy', 'unknown')}
Number of People Affected: {data.get('num_people', 1)}
Child Involved: {data.get('isChild', False)}
Mobility Limitations: {data.get('hasMobilityLimitations', False)}
Environmental Hazards: {data.get('environmentalHazards', 'none')}
Immediate Danger Flag: {data.get('immediate_danger', False)}
"""


async def score_incident_with_gemini(data: dict) -> dict:
    """
    Use Gemini to analyze incident data and return a priority score and level.
    
    Returns:
        dict: {"score": int (0-150+), "priority": int (1=critical, 2=high, 3=lower)}
    """
    if not api_key:
        raise ValueError("Gemini API key not configured")

    summary = _build_incident_summary(data)
    prompt = f"""You are an emergency response triage AI. Analyze this incident report and assign a severity score and priority level.

INCIDENT REPORT:
{summary}

SCORING RULES:
- Score: 0-150+ (higher = more urgent). Consider: life-threatening conditions, number of people, environmental hazards, mobility/child factors.
- Priority: 1 = critical (life-threatening, needs immediate help), 2 = high (urgent), 3 = lower (stable, can wait).

Respond with ONLY valid JSON in this exact format, no other text:
{{"score": <number>, "priority": <1 or 2 or 3>, "reason": "<brief 1-sentence explanation>"}}
"""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Extract JSON (handle markdown code blocks and extra text)
        start = text.find("{")
        if start >= 0:
            depth, end = 0, -1
            for i, c in enumerate(text[start:], start):
                if c == "{":
                    depth += 1
                elif c == "}":
                    depth -= 1
                    if depth == 0:
                        end = i
                        break
            if end >= 0:
                json_str = text[start : end + 1]
                parsed = json.loads(json_str)
                score = int(parsed.get("score", 50))
                priority = int(parsed.get("priority", 2))
                priority = max(1, min(3, priority))
                return {"score": score, "priority": priority, "reason": parsed.get("reason", "")}
        raise ValueError("Could not parse Gemini response as JSON")
    except Exception as e:
        print(f"Gemini scoring error: {e}")
        raise


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
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            system_instruction='Respond in plain text only. Do not use markdown, asterisks, hashtags, emojis, or any formatting. Use simple bullet points (dashes or numbers) if needed.',
        )
        
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
