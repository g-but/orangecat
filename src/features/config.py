import os
from datetime import datetime

# Recording settings
FPS = 30
QUALITY = 85  # 0-100, higher means better quality but larger file size
OUTPUT_FORMAT = 'mp4'  # mp4 or avi

# Hotkey settings
START_STOP_KEY = 'f9'  # Change this to any key you want

# File settings
RECORDINGS_DIR = 'recordings'
TIMESTAMP_FORMAT = '%Y%m%d_%H%M%S'

# Bitcoin settings
BITCOIN_ADDRESS = "YOUR_BITCOIN_ADDRESS"  # Replace with your Bitcoin address
DONATION_MESSAGE = "Everything is computer - Support transparent development"
OVERLAY_POSITION = (10, 10)  # Position of the Bitcoin overlay (x, y)
OVERLAY_COLOR = (0, 255, 0)  # Green color for the overlay
OVERLAY_FONT_SCALE = 0.7
OVERLAY_THICKNESS = 2

# Create recordings directory if it doesn't exist
os.makedirs(RECORDINGS_DIR, exist_ok=True)

def get_output_filename():
    """Generate a unique filename for each recording"""
    timestamp = datetime.now().strftime(TIMESTAMP_FORMAT)
    return os.path.join(RECORDINGS_DIR, f'recording_{timestamp}.{OUTPUT_FORMAT}')

def get_metadata_filename():
    """Generate filename for recording metadata"""
    return os.path.join(RECORDINGS_DIR, 'recordings_metadata.json') 