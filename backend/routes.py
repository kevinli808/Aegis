// Example endpoint for form submission
async def submit_help_request(form_data: dict):
    """
    Handle help request submission and return personalized intro
    """
    try:
        # Generate personalized intro statement
        intro_statement = await generate_intro_statement(form_data)
        
        return {
            'success': True,
            'intro': intro_statement,
            'message': 'Help request received. Chat session started.'
        }
    except Exception as error:
        return {
            'success': False,
            'error': str(error)
        }
