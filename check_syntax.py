import sys
import os

# Add the service directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'services', 'jarvis-service'))

try:
    from app import main
    print("Syntax check passed: app.main imported successfully.")
except Exception as e:
    print(f"Syntax check failed: {e}")
    import traceback
    traceback.print_exc()
