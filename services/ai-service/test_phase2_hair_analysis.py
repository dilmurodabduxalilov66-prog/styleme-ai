import json
import sys
import os

# Add services/ai-service to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from recommendation_engine import RecommendationEngine

def test_recommendation_engine():
    print("--- Testing Phase 2 Recommendation Engine ---")
    engine = RecommendationEngine()
    
    # Mock user analysis
    metrics = {
        "height_width_ratio": 1.4,
        "jaw_cheek_ratio": 0.8,
        "forehead_cheek_ratio": 0.85
    }
    face_shape = "OVAL"
    hair_analysis = {
        "length": "SHORT",
        "texture": "WAVY",
        "density": "MEDIUM",
        "hairline": "NORMAL",
        "volume": "MEDIUM",
        "confidence": 0.95
    }
    
    result = engine.recommend(metrics, face_shape, hair_analysis)
    
    best_match = result.get("best_match")
    top_5 = result.get("top_recommendations")
    
    if not best_match:
        print("[-] FAIL: No best match returned.")
        return False
        
    print(f"[*] Best Match: {best_match['name']} (Score: {best_match['match_score']})")
    print(f"    Explanation: {best_match['explanation']}")
    
    # Assert Best Match has highest score
    if best_match["hairstyle_id"] != top_5[0]["hairstyle_id"]:
        print("[-] FAIL: Best Match is not the highest scored item.")
        return False
        
    # Assert breakdown exists
    breakdown = best_match.get("score_breakdown", {})
    if "face_shape" not in breakdown or "hair_texture" not in breakdown:
        print("[-] FAIL: Score breakdown is incomplete.")
        return False
        
    print("[+] PASS: Recommendation Engine correctly ranks and explains best match.")
    return True

if __name__ == "__main__":
    test_recommendation_engine()
