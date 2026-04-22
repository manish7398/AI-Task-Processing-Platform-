import os
import time
import json
import redis
from dotenv import load_dotenv
from processor import process_task
from bson import ObjectId

load_dotenv()

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
MONGODB_URI = os.getenv('MONGODB_URI')
TASK_QUEUE = 'task:queue'

def update_task_status(task_id, status, result=None, logs=None, error_msg=None):
    """Update task status in MongoDB"""
    from pymongo import MongoClient
    
    try:
        client = MongoClient(MONGODB_URI)
        db = client.get_database()
        
        update = {'status': status}
        if result:
            update['result'] = result
        if logs:
            update['logs'] = logs
        if error_msg:
            update['error'] = error_msg
        
        db.tasks.update_one({'_id': ObjectId(task_id)}, {'$set': update})
        print(f"Updated task {task_id} status to {status}")
    except Exception as e:
        print(f"Error updating task status: {e}")

def process_queue():
    print("Worker started...")
    print(f"Connecting to Redis: {REDIS_URL}")
    
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    
    while True:
        try:
            task_data = redis_client.lpop(TASK_QUEUE)
            
            if task_data:
                task = json.loads(task_data)
                task_id = task['_id']
                operation = task['operation']
                input_text = task['inputText']
                
                print(f"Processing task: {task_id}")
                print(f"  Operation: {operation}")
                print(f"  Input: {input_text[:50]}...")
                
                try:
                    update_task_status(task_id, 'running')
                    
                    output = process_task(operation, input_text)
                    
                    update_task_status(
                        task_id, 
                        'success', 
                        result=output['result'], 
                        logs=output['logs']
                    )
                    
                    print(f"Task {task_id} completed successfully")
                    
                except Exception as e:
                    update_task_status(task_id, 'failed', error_msg=str(e))
                    print(f"Task {task_id} failed: {e}")
            else:
                time.sleep(1)
                
        except Exception as e:
            print(f"Worker error: {e}")
            time.sleep(5)

if __name__ == '__main__':
    process_queue()