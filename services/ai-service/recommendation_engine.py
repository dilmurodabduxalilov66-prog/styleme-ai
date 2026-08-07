import numpy as np
from hairstyle_catalog import catalog

class RecommendationEngine:
    def __init__(self):
        self.catalog = catalog
        self.reasoning = {
            "OVAL": "Bu turmak sizning universal oval yuzingizga juda mos tushadi.",
            "ROUND": "Yuzingizga vizual uzunlik va hajm qo'shadi, yuzni ingichkaroq ko'rsatadi.",
            "SQUARE": "Iyakning o'tkir burchaklarini yumshatib, yuzingizga balans beradi.",
            "HEART": "Keng peshonani vizual toraytirib, yuz simmetriyasini yaxshilaydi.",
            "DIAMOND": "Peshona va iyak proporsiyalarini mukammal tenglashtiradi.",
            "OBLONG": "Yuz uzunligini me'yorga keltirib, qisqaroq ko'rsatishga yordam beradi."
        }

    def recommend(self, metrics: dict, face_shape: str = "OVAL", hair_analysis: dict = None, top_k: int = 30):
        if hair_analysis is None:
            hair_analysis = {}
            
        user_length = hair_analysis.get("length", "UNKNOWN")
        user_texture = hair_analysis.get("texture", "UNKNOWN")
        user_density = hair_analysis.get("density", "UNKNOWN")
        user_hairline = hair_analysis.get("hairline", "UNKNOWN")
        
        # Length mappings to numerical values to calculate difficulty
        length_map = {"BALD": 0, "VERY_SHORT": 1, "SHORT": 2, "MEDIUM": 3, "LONG": 4, "VERY_LONG": 5, "UNKNOWN": -1}
        
        recommendations = []
        all_styles = self.catalog.get_all_styles()
        
        for style in all_styles:
            compat = style.get("compatibility", {})
            score = 0.0
            score_breakdown = {}
            
            # 1. Face Shape Weight (25%)
            if face_shape in compat.get("ideal_face_shapes", []):
                s = 25
            elif face_shape in compat.get("avoid_face_shapes", []):
                s = 5
            else:
                s = 15
            score += s
            score_breakdown["face_shape"] = s
                
            # 2. Geometric Proportion Weight (15%)
            height_width = metrics.get("height_width_ratio", 1.4)
            is_high_volume = "Pompadour" in style["name"] or "Quiff" in style["name"]
            is_low_volume = "Crop" in style["name"] or "Buzz" in style["name"]
            
            if height_width > 1.45 and is_high_volume:
                s = 5
            elif height_width > 1.45 and is_low_volume:
                s = 15
            elif height_width < 1.25 and is_high_volume:
                s = 15
            elif height_width < 1.25 and is_low_volume:
                s = 5
            else:
                s = 10
            score += s
            score_breakdown["facial_proportion"] = s
                
            # 3. Hair Texture Compatibility (10%)
            ideal_textures = compat.get("ideal_hair_type", ["ANY"])
            if user_texture == "UNKNOWN" or "ANY" in ideal_textures:
                s = 7 # Neutral average
            elif user_texture in ideal_textures:
                s = 10
            else:
                s = 3
            score += s
            score_breakdown["hair_texture"] = s
                
            # 4. Density Compatibility (10%)
            ideal_density = compat.get("ideal_density", ["ANY"])
            if user_density == "UNKNOWN" or "ANY" in ideal_density:
                s = 7
            elif user_density in ideal_density:
                s = 10
            else:
                # E.g. user has LOW density, style needs HIGH
                if user_density == "LOW" and "HIGH" in ideal_density:
                    s = 2
                else:
                    s = 5
            score += s
            score_breakdown["hair_density"] = s
                
            # 5. Hairline Compatibility (10%)
            s = 7 # Default
            if user_hairline in ["RECEDING", "WIDOWS_PEAK"] and style["category"].upper() == "LONG":
                s = 4
            elif user_hairline in ["RECEDING", "HIGH_HAIRLINE"] and "Fringe" in style.get("specs", {}).get("fringe_length", ""):
                s = 3 # Hard to do a heavy fringe with receding hairline
            elif user_hairline == "NORMAL":
                s = 10
            score += s
            score_breakdown["hairline"] = s
            
            # 6. Hair Length & Transition Difficulty (20% total combined)
            # 15% for length match, 5% for transition
            target_category = style["category"].upper()
            target_val = 2 # default short
            if target_category == "MEDIUM": target_val = 3
            elif target_category == "LONG": target_val = 4
            
            user_val = length_map.get(user_texture, length_map.get(user_length, -1))
            
            if user_val == -1:
                len_s = 10
                trans_s = 3
            else:
                diff = target_val - user_val
                if diff == 0:
                    len_s = 15
                    trans_s = 5
                elif diff > 0:
                    # User needs to grow hair (Hard transition)
                    len_s = max(0, 15 - (diff * 5))
                    trans_s = 1
                else:
                    # User needs to cut hair (Easy transition)
                    len_s = 12
                    trans_s = 5
            score += len_s
            score_breakdown["hair_length"] = len_s
            score += trans_s
            score_breakdown["transition"] = trans_s
            
            # 7. Volume Compatibility (5%)
            user_volume = hair_analysis.get("volume", "UNKNOWN")
            if user_volume == "LOW" and is_high_volume:
                s = 1
            elif user_volume == "HIGH" and is_low_volume:
                s = 3
            else:
                s = 4
            score += s
            score_breakdown["volume"] = s
            
            # 8. Professional Score (5%)
            prof_s = 5
            score += prof_s
            score_breakdown["professional"] = prof_s
            
            compatibility_score = max(0, min(100, int(score)))
            
            # PHASE 3C: 5-FACTOR GENERATION SCORING
            feasibility = 100
            transformation_realism = 100
            hair_structure_match = 100
            style_quality = 95 # Default base quality
            
            # MASSIVE PENALTIES FOR UNREALISTIC TRANSITIONS (e.g. Bald/Short to Long)
            if trans_s == 1:
                feasibility -= 60
                transformation_realism -= 50
            
            # Receding hairline to heavy fringe is physically very hard
            has_fringe = "fringe" in style.get("specs", {}).get("fringe_length", "").lower() or "fringe" in style["name"].lower() or "crop" in style["name"].lower()
            if user_hairline in ["RECEDING", "HIGH_HAIRLINE"] and has_fringe:
                feasibility -= 40
                transformation_realism -= 40
                
            # If style requires high volume but user has very thin/low density hair
            if user_density == "LOW" and is_high_volume:
                feasibility -= 50
                hair_structure_match -= 40
                
            feasibility = max(0, min(100, feasibility))
            transformation_realism = max(0, min(100, transformation_realism))
            hair_structure_match = max(0, min(100, hair_structure_match))
            
            # 0.35 Feas + 0.25 Realism + 0.30 Comp + 0.10 Struct
            final_score = int(
                (compatibility_score * 0.30) + 
                (feasibility * 0.35) + 
                (transformation_realism * 0.25) + 
                (hair_structure_match * 0.10)
            )
            
            # Human-readable explanation logic
            reason_list = []
            reason_list.append(self.reasoning.get(face_shape, "Yuz shaklingizga juda mos."))
            
            if len_s >= 12:
                reason_list.append("Hozirgi sochingiz uzunligi ushbu turmakka juda mos keladi.")
            elif len_s < 5:
                reason_list.append("Ushbu turmakka o'tish uchun sochingizni ancha o'stirish yoki qirqtirish talab qilinadi.")
                
            if user_texture != "UNKNOWN" and user_texture in ideal_textures:
                reason_list.append(f"Sochingizning '{user_texture.lower()}' teksturasi bu turmak uchun ideal.")
                
            if feasibility < 85 or transformation_realism < 80:
                reason_list.append("Eslatma: Hozirgi holatingizdan bu turmakka o'tish qiyinroq.")
            elif hair_structure_match < 90:
                reason_list.append("Bu turmak odatda boshqacha zichlikdagi sochni talab qiladi.")
                
            recommendations.append({
                "hairstyle_id": style["id"],
                "name": style["name"],
                "category": style["category"],
                "description": style["description"],
                "match_score": final_score,
                "score_breakdown": score_breakdown,
                "explanation": " ".join(reason_list),
                "metadata": {
                    "compatibility_score": compatibility_score,
                    "generation_feasibility_score": feasibility,
                    "transformation_realism": transformation_realism,
                    "hair_structure_match": hair_structure_match,
                    "style_quality": style_quality
                }
            })
            
        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        
        top_recommendations = recommendations[:top_k]
        best_match = top_recommendations[0] if top_recommendations else None
        
        return {
            "best_match": best_match,
            "top_recommendations": top_recommendations
        }
