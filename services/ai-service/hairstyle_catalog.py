from typing import Dict, Any

class HairstyleCatalog:
    def __init__(self):
        self.styles: Dict[int, Dict[str, Any]] = {
            1: {
                "id": 1,
                "tier": "FREE",























                "name": "Textured Crop",
                "category": "Short",
                "description": "Modern textured crop with short-to-medium textured top.",
                "specs": {
                    "top_length": "Short-to-medium (3-6 cm)",
                    "fringe_length": "Natural forward textured fringe",
                    "sides": "Low or mid fade",
                    "back": "Tapered and clean",
                    "texture": "Matte, separated hair strands",
                    "volume": "Low-to-medium",
                    "direction": "Forward and slightly downward",
                    "finish": "Matte natural finish"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": True,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Low",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Textured Crop haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Short length, Short-to-medium (3-6 cm) top, Natural forward textured fringe fringe, Low or mid fade sides, Tapered and clean back, Matte, separated hair strands texture, Low-to-medium volume, Forward and slightly downward direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            2: {
                "id": 2,
                "tier": "FREE",























                "name": "French Crop",
                "category": "Short",
                "description": "Classic French crop with a blunt fringe and high fade.",
                "specs": {
                    "top_length": "Short (2-4 cm)",
                    "fringe_length": "Blunt straight fringe across the forehead",
                    "sides": "High skin fade",
                    "back": "High skin fade",
                    "texture": "Textured and layered on top",
                    "volume": "Low",
                    "direction": "Strictly forward",
                    "finish": "Matte"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["ROUND"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": True,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["ROUND"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional French Crop haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Short length, Short (2-4 cm) top, Blunt straight fringe across the forehead fringe, High skin fade sides, High skin fade back, Textured and layered on top texture, Low volume, Strictly forward direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            3: {
                "id": 3,
                "tier": "FREE",























                "name": "Classic Side Part",
                "category": "Medium",
                "description": "Elegant gentleman's classic side part.",
                "specs": {
                    "top_length": "Medium (5-8 cm)",
                    "fringe_length": "Swept to the side",
                    "sides": "Scissor cut or classic taper",
                    "back": "Scissor cut taper",
                    "texture": "Smooth and combed",
                    "volume": "Medium",
                    "direction": "Parted clearly to one side",
                    "finish": "Glossy or pomade finish"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Classic Side Part haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium (5-8 cm) top, Swept to the side fringe, Scissor cut or classic taper sides, Scissor cut taper back, Smooth and combed texture, Medium volume, Parted clearly to one side direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            4: {
                "id": 4,
                "tier": "PRO",























                "name": "Modern Side Part",
                "category": "Medium",
                "description": "Contemporary side part with a hard part and mid fade.",
                "specs": {
                    "top_length": "Medium (5-8 cm)",
                    "fringe_length": "Swept back and to the side with volume",
                    "sides": "Mid skin fade with hard part",
                    "back": "Mid fade",
                    "texture": "Slightly textured but controlled",
                    "volume": "Medium-High",
                    "direction": "Swept sideways and slightly back",
                    "finish": "Matte paste or low shine"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Modern Side Part haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium (5-8 cm) top, Swept back and to the side with volume fringe, Mid skin fade with hard part sides, Mid fade back, Slightly textured but controlled texture, Medium-High volume, Swept sideways and slightly back direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            5: {
                "id": 5,
                "tier": "PRO",























                "name": "Low Fade",
                "category": "Short",
                "description": "Subtle low fade with a short textured top.",
                "specs": {
                    "top_length": "Short (3-5 cm)",
                    "fringe_length": "Short textured",
                    "sides": "Low drop fade resting just above the ears",
                    "back": "Low drop fade",
                    "texture": "Textured",
                    "volume": "Low",
                    "direction": "Forward and upward",
                    "finish": "Matte"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["ROUND"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Low",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["ROUND"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Low Fade haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Short length, Short (3-5 cm) top, Short textured fringe, Low drop fade resting just above the ears sides, Low drop fade back, Textured texture, Low volume, Forward and upward direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            6: {
                "id": 6,
                "tier": "PRO",























                "name": "Mid Fade",
                "category": "Short",
                "description": "Perfect balance of a mid fade with a short crop top.",
                "specs": {
                    "top_length": "Short (3-5 cm)",
                    "fringe_length": "Slightly brushed up",
                    "sides": "Mid fade starting from temples",
                    "back": "Mid fade",
                    "texture": "Spiky or textured",
                    "volume": "Medium",
                    "direction": "Upwards",
                    "finish": "Matte or natural"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Mid Fade haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Short length, Short (3-5 cm) top, Slightly brushed up fringe, Mid fade starting from temples sides, Mid fade back, Spiky or textured texture, Medium volume, Upwards direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            7: {
                "id": 7,
                "tier": "PRO",























                "name": "High Fade",
                "category": "Short",
                "description": "High contrast high fade with a tightly styled top.",
                "specs": {
                    "top_length": "Short (2-4 cm)",
                    "fringe_length": "Very short, brushed up",
                    "sides": "High fade extending near the crown",
                    "back": "High fade",
                    "texture": "Tight and uniform",
                    "volume": "Low",
                    "direction": "Up and forward",
                    "finish": "Matte"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["ROUND"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["ROUND"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional High Fade haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Short length, Short (2-4 cm) top, Very short, brushed up fringe, High fade extending near the crown sides, High fade back, Tight and uniform texture, Low volume, Up and forward direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            8: {
                "id": 8,
                "tier": "PRO",























                "name": "Skin Fade",
                "category": "Short",
                "description": "Ultra-clean skin fade blending to skin level.",
                "specs": {
                    "top_length": "Short (3-6 cm)",
                    "fringe_length": "Textured",
                    "sides": "Bald / Skin fade",
                    "back": "Bald / Skin fade",
                    "texture": "Textured",
                    "volume": "Low-to-medium",
                    "direction": "Forward",
                    "finish": "Matte"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Skin Fade haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Short length, Short (3-6 cm) top, Textured fringe, Bald / Skin fade sides, Bald / Skin fade back, Textured texture, Low-to-medium volume, Forward direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            9: {
                "id": 9,
                "tier": "PRO",























                "name": "Taper Fade",
                "category": "Medium",
                "description": "Clean taper at the temples and nape, keeping length behind the ear.",
                "specs": {
                    "top_length": "Medium (5-10 cm)",
                    "fringe_length": "Medium length",
                    "sides": "Tapered at temples, fuller behind the ears",
                    "back": "Tapered at the neckline",
                    "texture": "Natural flow",
                    "volume": "Medium",
                    "direction": "Backwards or sideways",
                    "finish": "Natural"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Taper Fade haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium (5-10 cm) top, Medium length fringe, Tapered at temples, fuller behind the ears sides, Tapered at the neckline back, Natural flow texture, Medium volume, Backwards or sideways direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            10: {
                "id": 10,
                "tier": "PRO",























                "name": "Buzz Cut",
                "category": "Very Short",
                "description": "Military-style uniform buzz cut.",
                "specs": {
                    "top_length": "Very Short (0.5-1 cm)",
                    "fringe_length": "None",
                    "sides": "Skin fade or uniform length",
                    "back": "Skin fade or uniform length",
                    "texture": "Uniform",
                    "volume": "None",
                    "direction": "None",
                    "finish": "Natural"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["ROUND"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Easy",
                    "generation_difficulty": 10,
                    "generation_stability": 90,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["ROUND"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Buzz Cut haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Very Short length, Very Short (0.5-1 cm) top, None fringe, Skin fade or uniform length sides, Skin fade or uniform length back, Uniform texture, None volume, None direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            11: {
                "id": 11,
                "tier": "PRO",























                "name": "Crew Cut",
                "category": "Short",
                "description": "Classic crew cut with slightly longer front.",
                "specs": {
                    "top_length": "Short (2-4 cm)",
                    "fringe_length": "Slightly longer, brushed up",
                    "sides": "Tapered or faded",
                    "back": "Tapered or faded",
                    "texture": "Clean and neat",
                    "volume": "Low",
                    "direction": "Upwards at the front",
                    "finish": "Natural or low shine"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["ROUND"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["ROUND"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Crew Cut haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Short length, Short (2-4 cm) top, Slightly longer, brushed up fringe, Tapered or faded sides, Tapered or faded back, Clean and neat texture, Low volume, Upwards at the front direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            12: {
                "id": 12,
                "tier": "PRO",























                "name": "Ivy League",
                "category": "Medium",
                "description": "Preppy Ivy League cut, long enough to part.",
                "specs": {
                    "top_length": "Medium (4-6 cm)",
                    "fringe_length": "Long enough to sweep side-back",
                    "sides": "Scissor taper",
                    "back": "Scissor taper",
                    "texture": "Smooth, refined",
                    "volume": "Medium",
                    "direction": "Parted and swept back-diagonally",
                    "finish": "Slight shine"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Ivy League haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium (4-6 cm) top, Long enough to sweep side-back fringe, Scissor taper sides, Scissor taper back, Smooth, refined texture, Medium volume, Parted and swept back-diagonally direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            13: {
                "id": 13,
                "tier": "PRO",























                "name": "Slick Back",
                "category": "Medium",
                "description": "Classic slick back with high shine.",
                "specs": {
                    "top_length": "Medium-Long (8-15 cm)",
                    "fringe_length": "Combed completely back",
                    "sides": "Undercut or taper fade",
                    "back": "Tapered",
                    "texture": "Straight, combed, wet look",
                    "volume": "Low-to-Medium",
                    "direction": "Straight back",
                    "finish": "High shine / wet pomade"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": True,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Slick Back haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium-Long (8-15 cm) top, Combed completely back fringe, Undercut or taper fade sides, Tapered back, Straight, combed, wet look texture, Low-to-Medium volume, Straight back direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            14: {
                "id": 14,
                "tier": "PRO",























                "name": "Modern Pompadour",
                "category": "Medium",
                "description": "High volume pompadour with a fade.",
                "specs": {
                    "top_length": "Medium-Long (10-15 cm)",
                    "fringe_length": "Pushed up and back with high volume",
                    "sides": "Skin fade or high fade",
                    "back": "Fade",
                    "texture": "Smooth but voluminous",
                    "volume": "High",
                    "direction": "Up and back",
                    "finish": "Matte or low shine"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["MEDIUM", "THICK"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": True,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Modern Pompadour haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium-Long (10-15 cm) top, Pushed up and back with high volume fringe, Skin fade or high fade sides, Fade back, Smooth but voluminous texture, High volume, Up and back direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            15: {
                "id": 15,
                "tier": "PRO",























                "name": "Classic Pompadour",
                "category": "Medium",
                "description": "Elvis-style classic pompadour.",
                "specs": {
                    "top_length": "Medium-Long (10-15 cm)",
                    "fringe_length": "Rolled up and back",
                    "sides": "Slicked back, no fade",
                    "back": "Ducktail or combed down",
                    "texture": "Smooth, sculpted",
                    "volume": "High",
                    "direction": "Up and back",
                    "finish": "High shine"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["MEDIUM", "THICK"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": True,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Classic Pompadour haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium-Long (10-15 cm) top, Rolled up and back fringe, Slicked back, no fade sides, Ducktail or combed down back, Smooth, sculpted texture, High volume, Up and back direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            16: {
                "id": 16,
                "tier": "PRO",























                "name": "Quiff",
                "category": "Medium",
                "description": "Classic quiff brushed upward and backward at the front.",
                "specs": {
                    "top_length": "Medium (6-10 cm)",
                    "fringe_length": "Brushed up and slightly back",
                    "sides": "Taper or short fade",
                    "back": "Taper or short fade",
                    "texture": "Slightly messy but styled",
                    "volume": "Medium-High",
                    "direction": "Upward and backward",
                    "finish": "Natural matte"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": True,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Quiff haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium (6-10 cm) top, Brushed up and slightly back fringe, Taper or short fade sides, Taper or short fade back, Slightly messy but styled texture, Medium-High volume, Upward and backward direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            17: {
                "id": 17,
                "tier": "PRO",























                "name": "Textured Quiff",
                "category": "Medium",
                "description": "Modern highly textured and piecey quiff.",
                "specs": {
                    "top_length": "Medium (6-10 cm)",
                    "fringe_length": "Spiky, upward, highly textured",
                    "sides": "Mid or high fade",
                    "back": "Mid or high fade",
                    "texture": "Highly textured, piecey strands",
                    "volume": "High",
                    "direction": "Upward and messy",
                    "finish": "Matte clay"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": True,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Textured Quiff haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium (6-10 cm) top, Spiky, upward, highly textured fringe, Mid or high fade sides, Mid or high fade back, Highly textured, piecey strands texture, High volume, Upward and messy direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            18: {
                "id": 18,
                "tier": "PRO",























                "name": "Messy Fringe",
                "category": "Medium",
                "description": "Casual, heavy textured messy fringe covering the forehead.",
                "specs": {
                    "top_length": "Medium (7-12 cm)",
                    "fringe_length": "Long, falling over the forehead",
                    "sides": "Low taper or fade",
                    "back": "Tapered",
                    "texture": "Messy, wavy, highly textured",
                    "volume": "Medium",
                    "direction": "Forward and downward",
                    "finish": "Matte natural"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": True,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Low",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Messy Fringe haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium (7-12 cm) top, Long, falling over the forehead fringe, Low taper or fade sides, Tapered back, Messy, wavy, highly textured texture, Medium volume, Forward and downward direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            19: {
                "id": 19,
                "tier": "PRO",























                "name": "Caesar Cut",
                "category": "Short",
                "description": "Short, horizontally straight cut fringe with even top.",
                "specs": {
                    "top_length": "Short (2-4 cm)",
                    "fringe_length": "Short, straight horizontal line",
                    "sides": "Fade or uniform short",
                    "back": "Fade or uniform short",
                    "texture": "Even, flat",
                    "volume": "Low",
                    "direction": "Forward",
                    "finish": "Natural"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["ROUND"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": True,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Full"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["ROUND"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Caesar Cut haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Short length, Short (2-4 cm) top, Short, straight horizontal line fringe, Fade or uniform short sides, Fade or uniform short back, Even, flat texture, Low volume, Forward direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            20: {
                "id": 20,
                "tier": "PRO",























                "name": "Undercut",
                "category": "Medium",
                "description": "High contrast disconnected undercut with long top.",
                "specs": {
                    "top_length": "Medium-Long (10-15 cm)",
                    "fringe_length": "Swept back or sideways",
                    "sides": "Shaved high and tight, disconnected",
                    "back": "Shaved high",
                    "texture": "Smooth or textured top",
                    "volume": "Medium-High",
                    "direction": "Back or side",
                    "finish": "Natural or pomade"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Undercut haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium-Long (10-15 cm) top, Swept back or sideways fringe, Shaved high and tight, disconnected sides, Shaved high back, Smooth or textured top texture, Medium-High volume, Back or side direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            21: {
                "id": 21,
                "tier": "PRO",























                "name": "Bro Flow",
                "category": "Medium-Long",
                "description": "Relaxed, medium-length swept back flow.",
                "specs": {
                    "top_length": "Long (12-20 cm)",
                    "fringe_length": "Swept back, tucked behind ears",
                    "sides": "Long, flowing backwards",
                    "back": "Long, touching nape",
                    "texture": "Wavy, loose, natural",
                    "volume": "Medium",
                    "direction": "Flowing backwards naturally",
                    "finish": "Natural, matte"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["ANY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Bro Flow haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium-Long length, Long (12-20 cm) top, Swept back, tucked behind ears fringe, Long, flowing backwards sides, Long, touching nape back, Wavy, loose, natural texture, Medium volume, Flowing backwards naturally direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            22: {
                "id": 22,
                "tier": "PRO",























                "name": "Medium Layers",
                "category": "Medium-Long",
                "description": "Medium length hair with textured layers.",
                "specs": {
                    "top_length": "Medium-Long (10-18 cm)",
                    "fringe_length": "Layered, framing the face",
                    "sides": "Layered, covering ears partially",
                    "back": "Layered, touching collar",
                    "texture": "Layered, textured, soft",
                    "volume": "Medium",
                    "direction": "Falling naturally downwards and sideways",
                    "finish": "Natural"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["ANY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Medium Layers haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium-Long length, Medium-Long (10-18 cm) top, Layered, framing the face fringe, Layered, covering ears partially sides, Layered, touching collar back, Layered, textured, soft texture, Medium volume, Falling naturally downwards and sideways direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            23: {
                "id": 23,
                "tier": "PRO",























                "name": "Long Layered",
                "category": "Long",
                "description": "Long, shoulder-length flowing hair.",
                "specs": {
                    "top_length": "Long (20-30 cm)",
                    "fringe_length": "Long, parted in middle or side",
                    "sides": "Shoulder length",
                    "back": "Shoulder length or longer",
                    "texture": "Smooth, flowing, slightly wavy",
                    "volume": "Medium",
                    "direction": "Downwards",
                    "finish": "Natural shine"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Hard",
                    "generation_difficulty": 70,
                    "generation_stability": 30,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Long Layered haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Long length, Long (20-30 cm) top, Long, parted in middle or side fringe, Shoulder length sides, Shoulder length or longer back, Smooth, flowing, slightly wavy texture, Medium volume, Downwards direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            24: {
                "id": 24,
                "tier": "PRO",























                "name": "Curly Top Fade",
                "category": "Medium",
                "description": "Tight curls on top with a clean fade on the sides.",
                "specs": {
                    "top_length": "Medium (5-10 cm)",
                    "fringe_length": "Curly fringe resting on upper forehead",
                    "sides": "Skin fade or taper",
                    "back": "Skin fade or taper",
                    "texture": "Tight curls or coils",
                    "volume": "High",
                    "direction": "Upward and forward",
                    "finish": "Natural matte"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Curly Top Fade haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium (5-10 cm) top, Curly fringe resting on upper forehead fringe, Skin fade or taper sides, Skin fade or taper back, Tight curls or coils texture, High volume, Upward and forward direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            25: {
                "id": 25,























                "name": "Curly Fringe",
                "category": "Medium",
                "description": "Curly hair falling forward over the forehead.",
                "specs": {
                    "top_length": "Medium (6-12 cm)",
                    "fringe_length": "Curly and falling over the forehead",
                    "sides": "Low fade or taper",
                    "back": "Low taper",
                    "texture": "Curly, defined rings",
                    "volume": "Medium",
                    "direction": "Forward",
                    "finish": "Natural"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": True,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Low",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Curly Fringe haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium (6-12 cm) top, Curly and falling over the forehead fringe, Low fade or taper sides, Low taper back, Curly, defined rings texture, Medium volume, Forward direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            26: {
                "id": 26,























                "name": "Afro Fade",
                "category": "Medium",
                "description": "Rounded afro top with faded sides.",
                "specs": {
                    "top_length": "Medium (5-12 cm)",
                    "fringe_length": "Rounded upward",
                    "sides": "High or mid skin fade",
                    "back": "High or mid skin fade",
                    "texture": "Coily, Afro-textured",
                    "volume": "High",
                    "direction": "Upwards and rounded",
                    "finish": "Natural"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Afro Fade haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium (5-12 cm) top, Rounded upward fringe, High or mid skin fade sides, High or mid skin fade back, Coily, Afro-textured texture, High volume, Upwards and rounded direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            27: {
                "id": 27,























                "name": "Mullet",
                "category": "Medium-Long",
                "description": "Business in the front, party in the back.",
                "specs": {
                    "top_length": "Short-Medium (4-8 cm)",
                    "fringe_length": "Short or textured",
                    "sides": "Short or faded",
                    "back": "Long, reaching the neck or shoulders",
                    "texture": "Textured, choppy",
                    "volume": "Medium",
                    "direction": "Backward and downward",
                    "finish": "Natural or matte"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Full"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["ANY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Mullet haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium-Long length, Short-Medium (4-8 cm) top, Short or textured fringe, Short or faded sides, Long, reaching the neck or shoulders back, Textured, choppy texture, Medium volume, Backward and downward direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            28: {
                "id": 28,























                "name": "Faux Hawk",
                "category": "Medium",
                "description": "Hair pushed toward the center to create a ridge.",
                "specs": {
                    "top_length": "Medium (5-8 cm)",
                    "fringe_length": "Pushed up and toward the center",
                    "sides": "Fade or short taper",
                    "back": "Fade or short taper",
                    "texture": "Spiky, textured",
                    "volume": "Medium-High",
                    "direction": "Up and toward center",
                    "finish": "Matte paste"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Full"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Faux Hawk haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium (5-8 cm) top, Pushed up and toward the center fringe, Fade or short taper sides, Fade or short taper back, Spiky, textured texture, Medium-High volume, Up and toward center direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            29: {
                "id": 29,























                "name": "Spiky Hair",
                "category": "Short-Medium",
                "description": "Classic spiky hair standing straight up.",
                "specs": {
                    "top_length": "Short-Medium (4-7 cm)",
                    "fringe_length": "Spiked upwards",
                    "sides": "Short taper or fade",
                    "back": "Short taper",
                    "texture": "Spiky, separated strands",
                    "volume": "Medium",
                    "direction": "Upwards",
                    "finish": "High hold gel or clay"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Full"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Spiky Hair haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Short-Medium length, Short-Medium (4-7 cm) top, Spiked upwards fringe, Short taper or fade sides, Short taper back, Spiky, separated strands texture, Medium volume, Upwards direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
            30: {
                "id": 30,























                "name": "Comb Over",
                "category": "Medium",
                "description": "Classic comb over parting hair to one side.",
                "specs": {
                    "top_length": "Medium (5-10 cm)",
                    "fringe_length": "Combed to the side",
                    "sides": "Taper fade",
                    "back": "Taper fade",
                    "texture": "Smooth and neat",
                    "volume": "Low-Medium",
                    "direction": "Sideways",
                    "finish": "Natural or slight shine"
                },
                "metadata": {
                    "required_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "required_hair_density": ["ANY"],
                    "transformation_difficulty": "Medium",
                    "generation_difficulty": 30,
                    "generation_stability": 70,
                    "recommended_for_receding_hairline": False,
                    "not_recommended_for_receding_hairline": False,
                    "fade_level": "Medium",
                    "ear_exposure": "Partial"
                },
                "compatibility": {
                    "ideal_face_shapes": ["OVAL", "SQUARE"],
                    "avoid_face_shapes": ["OBLONG"],
                    "ideal_hair_type": ["STRAIGHT", "WAVY"],
                    "ideal_density": ["MEDIUM", "THICK"]
                },
                "prompt": "A photorealistic portrait of a man with a professional Comb Over haircut. PERSON: same exact person, same facial identity, same skin tone, same age, same camera angle. HAIR STRUCTURE: Medium length, Medium (5-10 cm) top, Combed to the side fringe, Taper fade sides, Taper fade back, Smooth and neat texture, Low-Medium volume, Sideways direction. HAIR PHYSICS: realistic hair strands, natural growth direction, physically plausible placement. IDENTITY: do not alter face, eyes, eyebrows, nose, lips, jaw, ears, or skin. BACKGROUND: preserve original background and lighting.",
                "negative_prompt": "duplicate face, ghost face, second head, extra eyes, extra ears, deformed ears, floating hair, wig appearance, helmet hair, plastic hair, painted hair, fake hairline, unnatural scalp, hair covering eyes, incorrect fade, generic hairstyle, altered eyes, altered nose, altered lips, changed identity, changed skin tone, changed background, changed clothing, head shape change, cartoon, CGI, 3D render, flat shading, blurred face"
            },
        }

    def get_all_styles(self):
        return list(self.styles.values())

    def get_style(self, style_id: int):
        return self.styles.get(style_id)

catalog = HairstyleCatalog()