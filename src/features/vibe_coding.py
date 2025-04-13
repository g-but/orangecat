import json
from datetime import datetime
import random
from typing import Dict, List, Optional
import os

class VibeCoding:
    def __init__(self):
        self.sessions_file = "vibe_sessions.json"
        self.current_session = None
        self.music_playlists = {
            "coding": [
                "Lo-fi beats",
                "Ambient electronic",
                "Chillhop",
                "Synthwave",
                "Jazz fusion"
            ],
            "debugging": [
                "Classical",
                "Post-rock",
                "Minimal techno",
                "Space ambient"
            ],
            "creative": [
                "Psychedelic rock",
                "Progressive house",
                "World music",
                "Experimental"
            ]
        }
        self.streaming_platforms = {
            "twitch": {
                "name": "Twitch",
                "category": "Software and Game Development",
                "tags": ["coding", "programming", "development"]
            },
            "youtube": {
                "name": "YouTube",
                "category": "Science & Technology",
                "tags": ["coding", "programming", "tutorial"]
            },
            "kick": {
                "name": "Kick",
                "category": "Programming",
                "tags": ["coding", "development", "tech"]
            }
        }
        
    def start_session(self, 
                     project_name: str,
                     vibe_type: str = "coding",
                     music_preference: Optional[str] = None,
                     transparency_enabled: bool = True,
                     streaming_platform: Optional[str] = None,
                     stream_title: Optional[str] = None):
        """Start a new vibe coding session with streaming options"""
        self.current_session = {
            "project_name": project_name,
            "start_time": datetime.now().isoformat(),
            "vibe_type": vibe_type,
            "music": music_preference or random.choice(self.music_playlists[vibe_type]),
            "transparency_enabled": transparency_enabled,
            "streaming": {
                "enabled": streaming_platform is not None,
                "platform": streaming_platform,
                "title": stream_title or f"Vibe Coding: {project_name}",
                "viewers": 0,
                "chat_messages": [],
                "donations": []
            },
            "milestones": [],
            "screenshots": [],
            "code_snippets": []
        }
        
        # Save session
        self._save_session()
        return self.current_session
        
    def add_milestone(self, description: str, code_snippet: Optional[str] = None):
        """Add a milestone to the current session"""
        if not self.current_session:
            raise ValueError("No active session")
            
        milestone = {
            "timestamp": datetime.now().isoformat(),
            "description": description,
            "code_snippet": code_snippet
        }
        
        self.current_session["milestones"].append(milestone)
        self._save_session()
        return milestone
        
    def capture_screenshot(self, description: str):
        """Capture a screenshot during the session"""
        if not self.current_session:
            raise ValueError("No active session")
            
        screenshot = {
            "timestamp": datetime.now().isoformat(),
            "description": description,
            "filename": f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        }
        
        self.current_session["screenshots"].append(screenshot)
        self._save_session()
        return screenshot
        
    def add_chat_message(self, username: str, message: str):
        """Add a chat message from viewers"""
        if not self.current_session:
            raise ValueError("No active session")
            
        chat_message = {
            "timestamp": datetime.now().isoformat(),
            "username": username,
            "message": message
        }
        
        self.current_session["streaming"]["chat_messages"].append(chat_message)
        self._save_session()
        return chat_message
        
    def add_donation(self, username: str, amount: float, message: Optional[str] = None):
        """Add a donation from viewers"""
        if not self.current_session:
            raise ValueError("No active session")
            
        donation = {
            "timestamp": datetime.now().isoformat(),
            "username": username,
            "amount": amount,
            "message": message
        }
        
        self.current_session["streaming"]["donations"].append(donation)
        self._save_session()
        return donation
        
    def update_viewer_count(self, count: int):
        """Update the current viewer count"""
        if not self.current_session:
            raise ValueError("No active session")
            
        self.current_session["streaming"]["viewers"] = count
        self._save_session()
        return count
        
    def end_session(self, summary: str):
        """End the current session"""
        if not self.current_session:
            raise ValueError("No active session")
            
        self.current_session.update({
            "end_time": datetime.now().isoformat(),
            "summary": summary,
            "duration": self._calculate_duration(),
            "streaming": {
                **self.current_session["streaming"],
                "final_viewer_count": self.current_session["streaming"]["viewers"],
                "total_donations": sum(d["amount"] for d in self.current_session["streaming"]["donations"])
            }
        })
        
        # Save final session
        self._save_session()
        final_session = self.current_session
        self.current_session = None
        return final_session
        
    def _save_session(self):
        """Save the current session to file"""
        sessions = self._load_sessions()
        if self.current_session:
            # Update existing session or add new one
            updated = False
            for i, session in enumerate(sessions):
                if session.get("project_name") == self.current_session["project_name"]:
                    sessions[i] = self.current_session
                    updated = True
                    break
            if not updated:
                sessions.append(self.current_session)
                
        with open(self.sessions_file, 'w') as f:
            json.dump(sessions, f, indent=2)
            
    def _load_sessions(self) -> List[Dict]:
        """Load all sessions from file"""
        try:
            with open(self.sessions_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return []
            
    def _calculate_duration(self) -> str:
        """Calculate session duration"""
        start = datetime.fromisoformat(self.current_session["start_time"])
        end = datetime.fromisoformat(self.current_session["end_time"])
        duration = end - start
        return str(duration)
        
    def get_session_history(self) -> List[Dict]:
        """Get history of all sessions"""
        return self._load_sessions()
        
    def generate_vibe_report(self) -> Dict:
        """Generate a vibe coding report"""
        if not self.current_session:
            raise ValueError("No active session")
            
        return {
            "session": self.current_session,
            "vibe_metrics": {
                "milestone_count": len(self.current_session["milestones"]),
                "screenshot_count": len(self.current_session["screenshots"]),
                "code_snippet_count": len([m for m in self.current_session["milestones"] 
                                         if m.get("code_snippet")]),
                "music_played": self.current_session["music"],
                "transparency_score": self._calculate_transparency_score(),
                "streaming_metrics": {
                    "viewer_count": self.current_session["streaming"]["viewers"],
                    "chat_message_count": len(self.current_session["streaming"]["chat_messages"]),
                    "donation_count": len(self.current_session["streaming"]["donations"]),
                    "total_donations": sum(d["amount"] for d in self.current_session["streaming"]["donations"])
                }
            },
            "metadata": {
                "version": "1.0",
                "generated_at": datetime.now().isoformat()
            }
        }
        
    def _calculate_transparency_score(self) -> float:
        """Calculate a simple transparency score for the session"""
        if not self.current_session.get("transparency_enabled"):
            return 0.0
            
        score = 0.0
        total_possible = 3.0  # 3 transparency factors
        
        # Milestones documented
        if self.current_session["milestones"]:
            score += 1.0
            
        # Screenshots taken
        if self.current_session["screenshots"]:
            score += 1.0
            
        # Code snippets shared
        if any(m.get("code_snippet") for m in self.current_session["milestones"]):
            score += 1.0
            
        return (score / total_possible) * 100 