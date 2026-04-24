import os
import cv2
import csv
import numpy as np
from datetime import datetime
from ultralytics import YOLO

try:
    from deepface import DeepFace
except ImportError:
    print("Please install deepface: pip install deepface")
    DeepFace = None

# Configuration
KNOWN_FACES_DIR = "registered_faces"
OUTPUT_DIR = "output"
ATTENDANCE_FILE = "attendance.csv"
YOLO_MODEL_PATH = "yolov8n.pt" # using YOLOv8 nano
DEEPFACE_MODEL = "Facenet" # Options: VGG-Face, Facenet, OpenFace, DeepFace, DeepID, ArcFace, Dlib
DISTANCE_METRIC = "cosine"
THRESHOLD = 0.40 # Cosine distance threshold for Facenet

# Make sure output directories exist
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(KNOWN_FACES_DIR, exist_ok=True)

def load_known_faces(known_faces_dir):
    known_encodings = []
    known_names = []
    
    if not DeepFace:
        return known_encodings, known_names

    for filename in os.listdir(known_faces_dir):
        if filename.lower().endswith((".jpg", ".jpeg", ".png")):
            name = os.path.splitext(filename)[0]
            img_path = os.path.join(known_faces_dir, filename)
            try:
                # Extract face embeddings for known faces using DeepFace
                # enforce_detection=True ensures the reference image actually contains a face
                reps = DeepFace.represent(img_path=img_path, model_name=DEEPFACE_MODEL, enforce_detection=True)
                if len(reps) > 0:
                    known_encodings.append(reps[0]["embedding"])
                    known_names.append(name)
                    print(f"Loaded {name} into system.")
            except Exception as e:
                print(f"Error loading {filename}: {e}")
                
    return known_encodings, known_names

def find_best_match(face_embedding, known_encodings, known_names):
    distances = []
    for known_emb in known_encodings:
        # Calculate cosine distance
        a, b = np.array(face_embedding), np.array(known_emb)
        dist = 1 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
        distances.append(dist)
        
    best_idx = np.argmin(distances)
    if distances[best_idx] < THRESHOLD:
        conf = round((1 - distances[best_idx]) * 100, 2)
        return known_names[best_idx], conf
    return "Unknown", 0.0

def process_attendance(image_path, model, known_encodings, known_names):
    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
        return

    print(f"Processing {image_path}...")
    img = cv2.imread(image_path)
    if img is None:
        print("Failed to load image.")
        return
        
    results = model(image_path)
    
    # Handle different versions of ultralytics
    if hasattr(results[0], 'boxes'):
        detections = results[0].boxes
    else:
        detections = results[0] # Tensor fallback
    
    attendance_records = []
    
    for box in detections:
        if hasattr(box, 'cls'):
            cls_id = int(box.cls[0].item())
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            yolo_conf = round(box.conf[0].item(), 2)
        else:
            x1, y1, x2, y2, yolo_conf, cls_id = box.tolist()
            cls_id = int(cls_id)
            x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
            yolo_conf = round(yolo_conf, 2)
            
        # Check if the class is 0 (person)
        if cls_id != 0:
            continue
            
        # 2. Extract single person crop
        person_crop_bgr = img[y1:y2, x1:x2]
        
        if person_crop_bgr.size == 0:
            continue
            
        name = "Unknown"
        match_conf = 0.0
        
        # 3. Face Recognition on the crop
        if DeepFace and len(known_encodings) > 0:
            try:
                reps = DeepFace.represent(img_path=person_crop_bgr, model_name=DEEPFACE_MODEL, enforce_detection=False)
                
                if len(reps) > 0:
                    face_to_compare = reps[0]["embedding"]
                    name, match_conf = find_best_match(face_to_compare, known_encodings, known_names)
            except Exception as e:
                pass
                        
        # 4. Log to records
        attendance_records.append({
            "Name": name,
            "Confidence_Percentage": match_conf if name != "Unknown" else yolo_conf,
            "Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "Status": "Present" if name != "Unknown" else "Unknown",
            "box": [x1, y1, x2, y2]
        })
            
        # Draw bounding box and name on the main image
        color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        label = f"{name}: {match_conf}%" if name != "Unknown" else f"Unknown: {yolo_conf}" # show YOLO conf if unknown
        cv2.putText(img, label, (x1, max(30, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
    # Generate Output Image
    out_img_path = os.path.join(OUTPUT_DIR, "attendance_result.jpg")
    cv2.imwrite(out_img_path, img)
    print(f"Saved processed group image to {out_img_path}")
    
    # We won't auto-save to CSV here anymore because the UI workflow requires review!
    # Generate CSV Logging has been deferred to the frontend.
    print(f"Total detected: {len(attendance_records)}")
    return attendance_records

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="YOLOv8 Attendance Tracker")
    parser.add_argument("--image", type=str, default="test_group.jpg", help="Path to group image")
    args = parser.parse_args()

    print("[*] Loading YOLOv8 Model for Person Detection...")
    model = YOLO(YOLO_MODEL_PATH)
    
    print("[*] Loading Known Faces DB...")
    known_encs, known_names = load_known_faces(KNOWN_FACES_DIR)
    
    if os.path.exists(args.image):
        process_attendance(args.image, model, known_encs, known_names)
    else:
        print(f"Image '{args.image}' not found.")
        print(f"Please place a '{args.image}' in the directory or specify `--image path/to/image.jpg`.")
