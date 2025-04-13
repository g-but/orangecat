from datetime import datetime
from typing import Dict, List
import hashlib
import json

class TransparencyScore:
    def __init__(self):
        self.max_score = 100
        self.weights = {
            "screen_recording": 20,  # Recording all computer activity
            "bitcoin_transactions": 20,  # Showing all Bitcoin transactions
            "balance_visibility": 15,  # Showing current balance
            "code_visibility": 25,  # Making code publicly available
            "activity_logging": 10,  # Logging all activities
            "open_source_usage": 10,  # Using open source tools
        }
        
    def calculate_score(self, metrics: Dict) -> Dict:
        """Calculate transparency score based on various metrics"""
        score = 0
        details = {}
        
        # Screen recording score
        if metrics.get("screen_recording", {}).get("enabled", False):
            recording_duration = metrics["screen_recording"].get("duration_hours", 0)
            recording_score = min(recording_duration / 24 * self.weights["screen_recording"], 
                                self.weights["screen_recording"])
            score += recording_score
            details["screen_recording"] = {
                "score": recording_score,
                "max_possible": self.weights["screen_recording"],
                "duration_hours": recording_duration
            }
            
        # Bitcoin transactions score
        if metrics.get("bitcoin_transactions", {}).get("visible", False):
            tx_count = metrics["bitcoin_transactions"].get("count", 0)
            tx_score = min(tx_count / 10 * self.weights["bitcoin_transactions"], 
                          self.weights["bitcoin_transactions"])
            score += tx_score
            details["bitcoin_transactions"] = {
                "score": tx_score,
                "max_possible": self.weights["bitcoin_transactions"],
                "transaction_count": tx_count
            }
            
        # Balance visibility score
        if metrics.get("balance_visible", False):
            score += self.weights["balance_visibility"]
            details["balance_visibility"] = {
                "score": self.weights["balance_visibility"],
                "max_possible": self.weights["balance_visibility"]
            }
            
        # Code visibility score
        if metrics.get("code_visible", False):
            score += self.weights["code_visibility"]
            details["code_visibility"] = {
                "score": self.weights["code_visibility"],
                "max_possible": self.weights["code_visibility"]
            }
            
        # Activity logging score
        if metrics.get("activity_logging", {}).get("enabled", False):
            log_count = metrics["activity_logging"].get("count", 0)
            log_score = min(log_count / 100 * self.weights["activity_logging"], 
                           self.weights["activity_logging"])
            score += log_score
            details["activity_logging"] = {
                "score": log_score,
                "max_possible": self.weights["activity_logging"],
                "log_count": log_count
            }
            
        # Open source usage score
        if metrics.get("open_source_usage", {}).get("enabled", False):
            open_source_tools = metrics["open_source_usage"].get("tools", [])
            closed_source_tools = metrics["open_source_usage"].get("closed_source_tools", [])
            
            # Calculate ratio of open source to total tools
            total_tools = len(open_source_tools) + len(closed_source_tools)
            if total_tools > 0:
                open_source_ratio = len(open_source_tools) / total_tools
                open_source_score = open_source_ratio * self.weights["open_source_usage"]
                score += open_source_score
                
                details["open_source_usage"] = {
                    "score": open_source_score,
                    "max_possible": self.weights["open_source_usage"],
                    "open_source_tools": open_source_tools,
                    "closed_source_tools": closed_source_tools,
                    "ratio": open_source_ratio
                }
            
        # Calculate percentage
        percentage = (score / self.max_score) * 100
        
        return {
            "score": score,
            "max_score": self.max_score,
            "percentage": percentage,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "verification_hash": self._generate_hash(score, details)
        }
        
    def _generate_hash(self, score: float, details: Dict) -> str:
        """Generate verification hash for the score report"""
        data = {
            "score": score,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        return hashlib.sha256(
            json.dumps(data, sort_keys=True).encode()
        ).hexdigest()
        
    def generate_score_report(self, metrics: Dict) -> Dict:
        """Generate a complete transparency score report"""
        score_data = self.calculate_score(metrics)
        
        return {
            "transparency_score": score_data,
            "recommendations": self._generate_recommendations(score_data),
            "metadata": {
                "version": "1.0",
                "generated_at": datetime.now().isoformat()
            }
        }
        
    def _generate_recommendations(self, score_data: Dict) -> List[str]:
        """Generate recommendations to improve transparency score"""
        recommendations = []
        details = score_data["details"]
        
        if "screen_recording" not in details:
            recommendations.append("Enable screen recording to increase transparency")
        elif details["screen_recording"]["score"] < details["screen_recording"]["max_possible"]:
            recommendations.append("Increase screen recording duration to improve score")
            
        if "bitcoin_transactions" not in details:
            recommendations.append("Make Bitcoin transactions visible")
        elif details["bitcoin_transactions"]["score"] < details["bitcoin_transactions"]["max_possible"]:
            recommendations.append("Record more Bitcoin transactions to improve score")
            
        if "balance_visible" not in details:
            recommendations.append("Make balance visible to increase transparency")
            
        if "code_visible" not in details:
            recommendations.append("Make code publicly available")
            
        if "activity_logging" not in details:
            recommendations.append("Enable activity logging")
        elif details["activity_logging"]["score"] < details["activity_logging"]["max_possible"]:
            recommendations.append("Increase activity logging to improve score")
            
        if "open_source_usage" in details:
            if details["open_source_usage"]["ratio"] < 1.0:
                closed_tools = details["open_source_usage"]["closed_source_tools"]
                recommendations.append(
                    f"Consider open source alternatives for: {', '.join(closed_tools)}"
                )
        else:
            recommendations.append("Document your open source and closed source tool usage")
            
        return recommendations 