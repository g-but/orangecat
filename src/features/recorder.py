import cv2
import numpy as np
import pyautogui
import keyboard
import time
import json
from datetime import datetime
from config import (
    FPS, QUALITY, START_STOP_KEY, get_output_filename,
    BITCOIN_ADDRESS, DONATION_MESSAGE, OVERLAY_POSITION,
    OVERLAY_COLOR, OVERLAY_FONT_SCALE, OVERLAY_THICKNESS,
    get_metadata_filename
)

class ScreenRecorder:
    def __init__(self):
        self.recording = False
        self.writer = None
        self.screen_size = pyautogui.size()
        self.fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        self.recordings_metadata = []
        self.load_metadata()
        
    def load_metadata(self):
        """Load existing recordings metadata"""
        try:
            with open(get_metadata_filename(), 'r') as f:
                self.recordings_metadata = json.load(f)
        except FileNotFoundError:
            self.recordings_metadata = []
            
    def save_metadata(self):
        """Save recordings metadata"""
        with open(get_metadata_filename(), 'w') as f:
            json.dump(self.recordings_metadata, f, indent=2)
        
    def start_recording(self):
        """Start recording the screen"""
        if not self.recording:
            filename = get_output_filename()
            self.writer = cv2.VideoWriter(
                filename,
                self.fourcc,
                FPS,
                self.screen_size
            )
            self.recording = True
            
            # Add recording to metadata
            recording_info = {
                'filename': filename,
                'start_time': datetime.now().isoformat(),
                'bitcoin_address': BITCOIN_ADDRESS,
                'donation_message': DONATION_MESSAGE
            }
            self.recordings_metadata.append(recording_info)
            self.save_metadata()
            
            print(f"Recording started. Saving to: {filename}")
            print(f"Bitcoin address for donations: {BITCOIN_ADDRESS}")
            
    def stop_recording(self):
        """Stop recording and save the file"""
        if self.recording:
            self.recording = False
            self.writer.release()
            
            # Update metadata with end time
            if self.recordings_metadata:
                self.recordings_metadata[-1]['end_time'] = datetime.now().isoformat()
                self.save_metadata()
                
            print("Recording stopped and saved.")
            
    def add_overlay(self, frame):
        """Add Bitcoin donation overlay to the frame"""
        overlay_text = f"BTC: {BITCOIN_ADDRESS} - {DONATION_MESSAGE}"
        cv2.putText(
            frame,
            overlay_text,
            OVERLAY_POSITION,
            cv2.FONT_HERSHEY_SIMPLEX,
            OVERLAY_FONT_SCALE,
            OVERLAY_COLOR,
            OVERLAY_THICKNESS
        )
        return frame
            
    def capture_frame(self):
        """Capture a single frame from the screen"""
        screenshot = pyautogui.screenshot()
        frame = np.array(screenshot)
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        frame = self.add_overlay(frame)
        return frame
        
    def run(self):
        """Main recording loop"""
        print(f"Screen Recorder started. Press {START_STOP_KEY} to start/stop recording.")
        print("Press Ctrl+C to exit.")
        print(f"\nBitcoin address for donations: {BITCOIN_ADDRESS}")
        print(f"Message: {DONATION_MESSAGE}\n")
        
        try:
            while True:
                if keyboard.is_pressed(START_STOP_KEY):
                    if self.recording:
                        self.stop_recording()
                    else:
                        self.start_recording()
                    time.sleep(0.5)  # Prevent multiple triggers
                    
                if self.recording:
                    frame = self.capture_frame()
                    self.writer.write(frame)
                    
                time.sleep(1/FPS)
                
        except KeyboardInterrupt:
            if self.recording:
                self.stop_recording()
            print("\nScreen Recorder stopped.")

if __name__ == "__main__":
    recorder = ScreenRecorder()
    recorder.run() 