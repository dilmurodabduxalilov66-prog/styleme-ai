import cv2
import numpy as np
import mediapipe as mp

class AIEngine:
    def __init__(self):
        # Load MediaPipe solutions face mesh
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        )
        
        # Load MediaPipe ImageSegmenter (Selfie Multiclass) for True Hair Mask
        import os
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision
        
        model_path = os.path.join(os.path.dirname(__file__), "selfie_multiclass_256x256.tflite")
        if not os.path.exists(model_path):
            import urllib.request
            print("[*] Downloading MediaPipe Selfie Multiclass model...")
            url = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite"
            urllib.request.urlretrieve(url, model_path)
            
        if os.path.exists(model_path):
            with open(model_path, "rb") as f:
                model_bytes = f.read()
            base_options = python.BaseOptions(model_asset_buffer=model_bytes)
            options = vision.ImageSegmenterOptions(base_options=base_options, output_category_mask=True)
            self.segmenter = vision.ImageSegmenter.create_from_options(options)
        else:
            self.segmenter = None
            print(f"[!] Warning: Segmentation model not found at {model_path}")

    def calculate_distance(self, p1, p2):
        """Calculates Euclidean distance between two points in 3D space."""
        return np.linalg.norm(np.array(p1) - np.array(p2))

    def analyze_face_shape(self, image_path: str):
        """
        Loads image, runs FaceMesh, computes facial proportions,
        and returns classified face shape with landmarks data.
        """
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Could not read image. Invalid image file.")

        h, w, _ = image.shape

        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_image)

        if not results.multi_face_landmarks:
            raise ValueError("No human face detected in the uploaded photo.")

        face_landmarks = results.multi_face_landmarks[0]
        
        # Convert landmarks to coordinate arrays (scaled by image dimensions)
        coords = []
        for lm in face_landmarks.landmark:
            coords.append((lm.x * w, lm.y * h, lm.z * w))

        # Extract Key Landmark Coordinates (Based on MediaPipe indexing)
        # Forehead width bounds: 103 (left) to 332 (right)
        forehead_width = self.calculate_distance(coords[103], coords[332])
        
        # Cheekbone width bounds: 234 (left) to 454 (right)
        cheekbone_width = self.calculate_distance(coords[234], coords[454])
        
        # Jawline width bounds: 58 (left) to 288 (right)
        jaw_width = self.calculate_distance(coords[58], coords[288])
        
        # Face total height: 10 (forehead top) to 152 (chin bottom)
        face_height = self.calculate_distance(coords[10], coords[152])

        # Compute Geometric Proportions
        height_width_ratio = face_height / cheekbone_width
        jaw_cheek_ratio = jaw_width / cheekbone_width
        forehead_cheek_ratio = forehead_width / cheekbone_width

        # Shape Classification Decision Tree
        face_shape = "OVAL"  # Default value

        if height_width_ratio > 1.3:
            face_shape = "OBLONG"
        elif height_width_ratio < 1.05:
            # Short faces: Round or Square
            if jaw_cheek_ratio > 0.85:
                face_shape = "SQUARE"
            else:
                face_shape = "ROUND"
        else:
            # Medium height ratio: Oval, Diamond, or Heart
            if cheekbone_width > forehead_width and cheekbone_width > jaw_width:
                if jaw_width < 0.75 * cheekbone_width:
                    face_shape = "DIAMOND"
                else:
                    face_shape = "OVAL"
            elif forehead_width > cheekbone_width and forehead_width > jaw_width:
                face_shape = "HEART"
            else:
                face_shape = "OVAL"

        # Return landmarks coordinates array and metrics
        return {
            "face_shape": face_shape,
            "metrics": {
                "height_width_ratio": float(height_width_ratio),
                "jaw_cheek_ratio": float(jaw_cheek_ratio),
                "forehead_cheek_ratio": float(forehead_cheek_ratio)
            },
            "landmarks_mesh": [
                {"id": idx, "x": float(lm.x), "y": float(lm.y), "z": float(lm.z)}
                for idx, lm in enumerate(face_landmarks.landmark)
            ]
        }

    def get_hairline_points(self, landmarks, w, h):
        # Implementation hidden for brevity
        return points

    def build_true_hair_mask(self, source_image_path: str, output_mask_path: str):
        """
        Uses MediaPipe ImageSegmenter (selfie_multiclass_256x256.tflite) to extract
        a TRUE semantic hair mask. It also protects face/body skin.
        """
        if not self.segmenter:
            print("[!] True hair segmentation failed: segmenter model not loaded. Falling back to old mask.")
            return False
            
        import mediapipe as mp
        image = mp.Image.create_from_file(source_image_path)
        segmentation_result = self.segmenter.segment(image)
        category_mask = segmentation_result.category_mask.numpy_view()
        
        # 1 = hair, 3 = face-skin, 2 = body-skin, 0 = background, 4 = clothes
        hair_mask = np.where(category_mask == 1, 255, 0).astype(np.uint8)
        skin_mask = np.where((category_mask == 3) | (category_mask == 2), 255, 0).astype(np.uint8)
        
        # Resize masks to original image dimensions
        orig_img = cv2.imread(source_image_path)
        h, w = orig_img.shape[:2]
        hair_mask = cv2.resize(hair_mask, (w, h), interpolation=cv2.INTER_NEAREST)
        skin_mask = cv2.resize(skin_mask, (w, h), interpolation=cv2.INTER_NEAREST)
        
        # Dilate the hair mask slightly to capture edges and allow style expansion
        kernel = np.ones((15, 15), np.uint8)
        dilated_hair = cv2.dilate(hair_mask, kernel, iterations=1)
        
        # STRICT CONSTRAINT: Subtract skin to ensure we NEVER paint over face/body
        # Dilate skin mask very slightly to create a tight protective boundary
        skin_kernel = np.ones((5, 5), np.uint8)
        dilated_skin = cv2.dilate(skin_mask, skin_kernel, iterations=1)
        
        final_mask = cv2.subtract(dilated_hair, dilated_skin)
        
        # Feather the boundary to allow smooth blending
        # Using a large Gaussian blur on the mask so SDXL generates a smooth skin transition
        blur_size = int(w * 0.03) | 1 # ~3% of image width, must be odd
        final_mask = cv2.GaussianBlur(final_mask, (blur_size, blur_size), 0)
        
        # Re-threshold slightly to keep the core solid white but edges soft
        _, final_mask = cv2.threshold(final_mask, 50, 255, cv2.THRESH_BINARY)
        final_mask = cv2.GaussianBlur(final_mask, (15, 15), 0) # secondary feathering
        
        cv2.imwrite(output_mask_path, final_mask)
        return True

    def build_dynamic_hair_mask(self, source_image_path: str, output_mask_path: str, hair_analysis: dict, style_data: dict):
        """
        Phase 3C: Generates a dynamically expanded hair mask using 5 explicit Zones.
        ZONE A: Core Hair (existing)
        ZONE B: Expansion Zone (volume/length)
        ZONE C: Hairline Transition Zone
        ZONE D: Ear Transition Zone
        ZONE E: Protected Identity Zone
        """
        image = cv2.imread(source_image_path)
        if image is None:
            raise ValueError("Could not read image for masking.")
        h, w, _ = image.shape
        
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        mask = np.zeros((h, w), dtype=np.uint8)
        
        if self.segmenter:
            # ZONE A: Core Hair (True Hair Segmentation)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
            segmentation_result = self.segmenter.segment(mp_image)
            category_mask = segmentation_result.category_mask.numpy_view()
            
            zone_a_core = (category_mask == 1).astype(np.uint8) * 255
            face_body_mask = ((category_mask == 2) | (category_mask == 3) | (category_mask == 4)).astype(np.uint8) * 255
            
            # ZONE B: Expansion Zone
            target_category = style_data.get("category", "Short").upper()
            target_volume = style_data.get("specs", {}).get("volume", "Low").upper()
            target_fringe = style_data.get("specs", {}).get("fringe_length", "").lower()
            user_length = hair_analysis.get("length", "UNKNOWN")
            user_hairline = hair_analysis.get("hairline", "UNKNOWN")
            
            kernel_x = int(w * 0.05) # Minimum 5% side expansion for natural head width alignment
            kernel_y = int(h * 0.04)
            
            if target_category == "LONG" or "LAYERED" in style_data.get("name", "").upper():
                kernel_x = int(w * 0.15) 
                kernel_y = int(h * 0.15) 
            elif target_category == "MEDIUM":
                kernel_x = int(w * 0.08)
                kernel_y = int(h * 0.08)
                
            if "HIGH" in target_volume or "POMPADOUR" in style_data.get("name", "").upper():
                kernel_y = int(h * 0.12) 
                
            kernel_expand = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (max(3, kernel_x), max(3, kernel_y)))
            zone_b_expansion = cv2.dilate(zone_a_core, kernel_expand, iterations=1)
            
            # Combine A and B
            full_hair_zone = cv2.bitwise_or(zone_a_core, zone_b_expansion)
            
            # Feather outer boundary (Reduced to 5px to prevent double skin artifact)
            full_hair_zone = cv2.GaussianBlur(full_hair_zone, (5, 5), 0)
            
        else:
            full_hair_zone = np.ones((h, w), dtype=np.uint8) * 255
            face_body_mask = np.zeros((h, w), dtype=np.uint8)
            
        # ZONE E: Protected Identity Zone (LEVEL 1 & 2)
        zone_e_protected = np.zeros((h, w), dtype=np.uint8)
        
        results = self.face_mesh.process(rgb_image)
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0]
            
            # Absolute Face Core (Level 1 & 2) - Below Eyebrows
            jawline_indices = [
                234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152,
                377, 400, 378, 379, 365, 397, 288, 361, 323, 454
            ]
            # Use eyebrow contour for face protection (Protect face BELOW eyebrows, leave forehead open for haircut transformation)
            eyebrow_indices = [454, 336, 296, 334, 293, 300, 168, 70, 63, 105, 66, 107, 234]
            
            protective_indices = jawline_indices + eyebrow_indices
            points = []
            for idx in protective_indices:
                lm = landmarks.landmark[idx]
                points.append([int(lm.x * w), int(lm.y * h)])
                
            points_np = np.array(points, dtype=np.int32)
            cv2.fillPoly(zone_e_protected, [points_np], 255)
            
            # Ear Protection Logic (Precise ear landmark polygon protection)
            # DO NOT include temple landmarks 234 & 454, as they belong to the hair/sideburns zone
            left_ear_pts = []
            right_ear_pts = []
            for idx in [93, 137, 177, 215, 132]:
                lm = landmarks.landmark[idx]
                left_ear_pts.append([int(lm.x * w), int(lm.y * h)])
            for idx in [323, 366, 401, 435, 361]:
                lm = landmarks.landmark[idx]
                right_ear_pts.append([int(lm.x * w), int(lm.y * h)])
            
            zone_d_ear = np.zeros((h, w), dtype=np.uint8)
            if len(left_ear_pts) > 0:
                cv2.fillPoly(zone_d_ear, [np.array(left_ear_pts, dtype=np.int32)], 255)
            if len(right_ear_pts) > 0:
                cv2.fillPoly(zone_d_ear, [np.array(right_ear_pts, dtype=np.int32)], 255)
                
            # Dilate ear mask slightly by 1.5% of width to cover outer ear edge without touching sideburns
            ear_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (max(3, int(w * 0.015)), max(3, int(w * 0.015))))
            zone_d_ear = cv2.dilate(zone_d_ear, ear_kernel, iterations=1)
            zone_e_protected = cv2.bitwise_or(zone_e_protected, zone_d_ear)
            
            # Neck protection
            chin_y = int(landmarks.landmark[152].y * h)
            left_jaw_x = int(landmarks.landmark[234].x * w)
            right_jaw_x = int(landmarks.landmark[454].x * w)
            shoulder_left = max(0, left_jaw_x - int(w * 0.4))
            shoulder_right = min(w, right_jaw_x + int(w * 0.4))
            
            neck_poly = np.array([
                [left_jaw_x, chin_y - 20],
                [right_jaw_x, chin_y - 20],
                [shoulder_right, h],
                [shoulder_left, h]
            ], dtype=np.int32)
            cv2.fillPoly(zone_e_protected, [neck_poly], 255)
            
        if self.segmenter:
            # Body skin and clothes protection (Category 2 & 4)
            # DO NOT include forehead skin (Category 3) so old bangs can be erased cleanly
            body_skin_clothes_mask = ((category_mask == 2) | (category_mask == 4)).astype(np.uint8) * 255
            target_category = style_data.get("category", "Short").upper()
            if target_category in ["SHORT", "FADE", "BUZZ"]:
                zone_e_protected = cv2.bitwise_or(zone_e_protected, body_skin_clothes_mask)
            
        # ZONE C: Hairline Feathering (Level 3)
        # We need a natural hairline transition but precise inner face protection.
        zone_e_protected_tight = cv2.GaussianBlur(zone_e_protected, (3, 3), 0)
        
        # Soften the hair zone to allow natural outer boundary and temple transitions
        blur_size = max(5, int(w * 0.05)) | 1
        soft_hair_zone = cv2.GaussianBlur(full_hair_zone, (blur_size, blur_size), 0)
        
        # Create a hairline transition mask (where hair meets forehead)
        # By dilating the protected face slightly and blurring it, we create a soft boundary 
        # only at the hairline intersection
        face_dilation = cv2.dilate(zone_e_protected, np.ones((int(h*0.03), int(w*0.03)), np.uint8))
        hairline_gradient = cv2.GaussianBlur(face_dilation, (blur_size, blur_size), 0)
        
        # FINAL MASK = Soft Hair Zone - Tight Protected Face
        mask = cv2.subtract(soft_hair_zone, zone_e_protected_tight)
        
        # Apply the hairline gradient to soften only the transition area (avoid double-skin)
        # Where hairline_gradient is high (near the face), we reduce the mask intensity smoothly.
        # mask = mask * (1.0 - hairline_gradient / 255.0)
        gradient_factor = cv2.subtract(255, hairline_gradient)
        mask = cv2.bitwise_and(mask, gradient_factor)
        
        # Ensure that ALL old hair is strictly included in the mask, unless it explicitly hits the eyes/nose/mouth.
        # This forces the AI to remove it if it's on the forehead!
        core_hair_to_remove = cv2.subtract(zone_a_core, zone_e_protected_tight)
        mask = cv2.bitwise_or(mask, core_hair_to_remove)
        
        # Final mask cleanup: Clean binary mask without bloating or hard boundary artifacts
        mask = np.clip(mask, 0, 255).astype(np.uint8)
        
        cv2.imwrite(output_mask_path, mask)
        return output_mask_path

    def analyze_hair_cv(self, source_image_path: str, landmarks):
        """
        Uses Local Computer Vision (MediaPipe Segmenter + FaceMesh landmarks)
        to extract length, hairline, and volume.
        """
        result = {
            "length": "UNKNOWN",
            "hairline": "UNKNOWN",
            "volume": "UNKNOWN",
            "confidence": 0.0
        }
        
        if not self.segmenter or not landmarks:
            return result
            
        import mediapipe as mp
        image = mp.Image.create_from_file(source_image_path)
        segmentation_result = self.segmenter.segment(image)
        category_mask = segmentation_result.category_mask.numpy_view()
        
        # 1 = hair, 3 = face-skin
        hair_mask = np.where(category_mask == 1, 255, 0).astype(np.uint8)
        
        h, w = hair_mask.shape
        hair_pixels = np.nonzero(hair_mask)
        
        if len(hair_pixels[0]) == 0:
            result["length"] = "BALD"
            result["hairline"] = "RECEDING"
            result["volume"] = "LOW"
            result["confidence"] = 0.95
            return result
            
        lowest_hair_y = np.max(hair_pixels[0])
        highest_hair_y = np.min(hair_pixels[0])
        
        # Face landmarks for reference (expecting list of dicts with 'id', 'x', 'y')
        def get_lm_y(lm_id):
            return next((lm['y'] for lm in landmarks if lm['id'] == lm_id), 0)
            
        chin_y = int(get_lm_y(152) * h)
        left_ear_y = int(get_lm_y(234) * h)
        forehead_y = int(get_lm_y(10) * h)
        
        # 1. Determine Length
        if lowest_hair_y < left_ear_y:
            result["length"] = "SHORT"
        elif lowest_hair_y < chin_y:
            result["length"] = "MEDIUM"
        elif lowest_hair_y < chin_y + (h * 0.1):
            result["length"] = "LONG"
        else:
            result["length"] = "VERY_LONG"
            
        # 2. Determine Hairline
        # If the hair starts very high above the top of the forehead
        hair_start_dist = forehead_y - highest_hair_y
        if hair_start_dist < (h * 0.05):
            result["hairline"] = "HIGH_HAIRLINE"
        elif hair_start_dist < (h * 0.1):
            result["hairline"] = "NORMAL"
        else:
            result["hairline"] = "NORMAL"
            
        # 3. Determine Volume
        face_height = chin_y - forehead_y
        hair_height = lowest_hair_y - highest_hair_y
        if hair_height > face_height * 1.5:
            result["volume"] = "HIGH"
        elif hair_height > face_height:
            result["volume"] = "MEDIUM"
        else:
            result["volume"] = "LOW"
            
        result["confidence"] = 0.85
        return result

    def analyze_hair_properties(self, image_path: str, landmarks=None):
        """
        Hybrid Approach: 
        1. Local CV extracts Length, Hairline, and Volume.
        2. Vision API (GPT-4o-mini) extracts Texture, Density, and Curl Pattern.
        """
        import os
        import base64
        import json
        import requests
        
        # Step 1: Local CV Analysis
        cv_result = self.analyze_hair_cv(image_path, landmarks)
        
        # Step 2: Vision LLM Analysis
        api_key = os.environ.get("OPENAI_API_KEY")
        
        llm_result = {
            "texture": "UNKNOWN",
            "curl_pattern": "UNKNOWN",
            "density": "UNKNOWN",
            "strand_thickness": "UNKNOWN",
            "current_style": "UNKNOWN"
        }
        
        if api_key:
            try:
                with open(image_path, "rb") as image_file:
                    base64_image = base64.b64encode(image_file.read()).decode('utf-8')
                    
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                }
                
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a professional Master Barber and AI Vision Expert. Analyze the user's hair texture and density. Output ONLY valid JSON."
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Analyze this person's hair and return a JSON object with these EXACT keys: texture (STRAIGHT, WAVY, CURLY, COILY, UNKNOWN), curl_pattern (1A to 4C, or UNKNOWN), density (LOW, MEDIUM, HIGH, UNKNOWN), strand_thickness (FINE, MEDIUM, THICK, UNKNOWN), current_style (string), hair_color (BLACK, DARK BROWN, LIGHT BROWN, BLONDE, RED, GRAY, WHITE, UNKNOWN)."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}",
                                        "detail": "low"
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 200,
                    "response_format": { "type": "json_object" }
                }
                
                response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    llm_result = json.loads(content)
                else:
                    print(f"[!] Vision API Error: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"[!] Exception during hair analysis LLM: {e}")
                
        # Merge Results
        final_result = {
            "length": cv_result.get("length", "UNKNOWN"),
            "texture": llm_result.get("texture", "UNKNOWN"),
            "curl_pattern": llm_result.get("curl_pattern", "UNKNOWN"),
            "density": llm_result.get("density", "UNKNOWN"),
            "strand_thickness": llm_result.get("strand_thickness", "UNKNOWN"),
            "hair_color": llm_result.get("hair_color", "UNKNOWN"),
            "volume": cv_result.get("volume", "UNKNOWN"),
            "current_style": llm_result.get("current_style", "UNKNOWN"),
            "hairline": cv_result.get("hairline", "UNKNOWN"),
            "confidence": cv_result.get("confidence", 0.0)
        }
        
        return final_result
