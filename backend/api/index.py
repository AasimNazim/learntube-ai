import sys
import os

# Add parent directory to path so app package imports cleanly in Vercel serverless
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
