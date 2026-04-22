def process_task(operation: str, input_text: str) -> dict:
    """Process task based on operation type"""
    
    if operation == 'uppercase':
        result = input_text.upper()
        logs = f"Converted to uppercase: {len(result)} characters"
    elif operation == 'lowercase':
        result = input_text.lower()
        logs = f"Converted to lowercase: {len(result)} characters"
    elif operation == 'reverse':
        result = input_text[::-1]
        logs = f"Reversed string: {len(result)} characters"
    elif operation == 'wordcount':
        result = str(len(input_text.split()))
        logs = f"Word count: {result} words"
    else:
        raise ValueError(f"Unknown operation: {operation}")
    
    return {'result': result, 'logs': logs}