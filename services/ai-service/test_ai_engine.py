from hairstyle_catalog import catalog
from recommendation_engine import RecommendationEngine

def test_recommendation_scoring():
    engine = RecommendationEngine()
    
    print("--- Test 1: OVAL face, ANY hair, ANY density ---")
    recommendations = engine.recommend({}, face_shape="OVAL", hair_type="ANY", density="ANY", top_k=5)
    for rec in recommendations:
        print(f"{rec['name']} - Score: {rec['compatibility_score']}% - {rec['reason']}")
        
    print("\n--- Test 2: ROUND face, STRAIGHT hair, THIN density ---")
    recommendations = engine.recommend({}, face_shape="ROUND", hair_type="STRAIGHT", density="THIN", top_k=5)
    for rec in recommendations:
        print(f"{rec['name']} - Score: {rec['compatibility_score']}% - {rec['reason']}")
        
    print("\n--- Test 3: SQUARE face, CURLY hair, THICK density ---")
    recommendations = engine.recommend({}, face_shape="SQUARE", hair_type="CURLY", density="THICK", top_k=5)
    for rec in recommendations:
        print(f"{rec['name']} - Score: {rec['compatibility_score']}% - {rec['reason']}")

if __name__ == "__main__":
    test_recommendation_scoring()
