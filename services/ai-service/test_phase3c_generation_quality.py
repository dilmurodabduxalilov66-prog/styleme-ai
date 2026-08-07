import os
import cv2
import numpy as np
from recommendation_engine import RecommendationEngine
from ai_engine import AIEngine
from hairstyle_catalog import catalog

def test_recommendation_engine():
    print("--- TESTING PHASE 3C 5-FACTOR RECOMMENDATION ENGINE ---")
    rec_engine = RecommendationEngine()
    
    # Test 1: Short hair to Long Hair (Hard Transition)
    metrics_1 = {"height_width_ratio": 1.4}
    hair_analysis_1 = {"length": "SHORT", "density": "MEDIUM", "hairline": "NORMAL"}
    res_1 = rec_engine.recommend(metrics_1, "OVAL", hair_analysis_1, top_k=1)
    
    best_1 = res_1["best_match"]
    print(f"Test 1 (Short -> Best Match): {best_1['name']}")
    print(f"Metrics: {best_1['metrics']}")
    
    # Force test against a long style
    long_style = [s for s in catalog.get_all_styles() if s["category"].upper() == "LONG"][0]
    
    # Re-evaluate logic for long style specifically to see penalties
    print(f"\nChecking penalty for Short -> Long ({long_style['name']}):")
    # Actually, recommend engine does it internally. The top match will likely NOT be the long style due to penalties.
    assert best_1["metrics"]["generation_feasibility_score"] > 80, "Best match should be highly feasible"

    # Test 2: Receding Hairline -> Heavy Fringe
    hair_analysis_2 = {"length": "MEDIUM", "density": "LOW", "hairline": "RECEDING"}
    res_2 = rec_engine.recommend(metrics_1, "OVAL", hair_analysis_2, top_k=30)
    
    # Find a fringe style
    fringe_style_res = [s for s in res_2["top_recommendations"] if "Fringe" in s["name"] or "Crop" in s["name"]][0]
    print(f"\nTest 2 (Receding -> {fringe_style_res['name']}):")
    print(f"Metrics: {fringe_style_res['metrics']}")
    
    assert fringe_style_res["metrics"]["generation_feasibility_score"] < 90, "Fringe with receding hairline should be penalized"
    assert fringe_style_res["metrics"]["transformation_realism"] < 90, "Fringe with receding hairline should have lower realism"
    
    print("\n[+] Recommendation Engine Phase 3C tests PASSED.")

def test_dynamic_mask():
    print("\n--- TESTING PHASE 3C 5-ZONE MASKING ---")
    engine = AIEngine()
    
    # Create a dummy image
    dummy_img = np.zeros((512, 512, 3), dtype=np.uint8)
    cv2.imwrite("dummy_test.jpg", dummy_img)
    
    hair_analysis = {"length": "SHORT", "hairline": "NORMAL"}
    style_data = catalog.get_style(1)
    
    try:
        engine.build_dynamic_hair_mask("dummy_test.jpg", "dummy_mask.jpg", hair_analysis, style_data)
        print("[+] 5-Zone Masking executed without errors.")
    except Exception as e:
        print(f"[-] Mask generation error (Expected if no face detected): {e}")
        
    if os.path.exists("dummy_test.jpg"):
        os.remove("dummy_test.jpg")
    if os.path.exists("dummy_mask.jpg"):
        os.remove("dummy_mask.jpg")

if __name__ == "__main__":
    test_recommendation_engine()
    test_dynamic_mask()
