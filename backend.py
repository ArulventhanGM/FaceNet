from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import csv
import datetime

from attendance_tracker import load_known_faces, process_attendance, YOLO_MODEL_PATH
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

STUDENTS_CSV = "students.csv"
FACES_DIR = "registered_faces"

os.makedirs(FACES_DIR, exist_ok=True)
os.makedirs("output", exist_ok=True)

print("[*] Pre-loading YOLOv8 Model on Server Boot...")
try:
    yolo_model = YOLO("yolov8n.pt")
except Exception as e:
    print(f"Failed to load YOLO model: {e}")
    yolo_model = None

if not os.path.exists(STUDENTS_CSV):
    with open(STUDENTS_CSV, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "name", "image_filename"])

@app.route('/api/students', methods=['GET'])
def get_students():
    students = []
    with open(STUDENTS_CSV, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            students.append(row)
    return jsonify(students)

@app.route('/api/students', methods=['POST'])
def add_student():
    if 'image' not in request.files:
        return jsonify({"error": "No image part"}), 400
    file = request.files['image']
    name = request.form.get('name', 'Unknown')
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    ext = file.filename.split('.')[-1]
    filename = f"{name}.{ext}" # Saving as name.ext so YOLO logic can extract name
    filepath = os.path.join(FACES_DIR, filename)
    file.save(filepath)
    
    new_id = int(datetime.datetime.now().timestamp())
    
    with open(STUDENTS_CSV, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([new_id, name, filename])
        
    return jsonify({"id": new_id, "name": name, "image_filename": filename})

@app.route('/api/students/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    students = []
    deleted_filename = None
    
    with open(STUDENTS_CSV, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if str(row["id"]) == str(student_id):
                deleted_filename = row["image_filename"]
            else:
                students.append(row)
                
    with open(STUDENTS_CSV, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "name", "image_filename"])
        for row in students:
            writer.writerow([row["id"], row["name"], row["image_filename"]])
            
    if deleted_filename:
        filepath = os.path.join(FACES_DIR, deleted_filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            
    return jsonify({"status": "deleted"})

@app.route('/api/images/<filename>')
def get_image(filename):
    return send_from_directory(FACES_DIR, filename)

@app.route('/api/output/<filename>')
def get_output_image(filename):
    return send_from_directory("output", filename)

@app.route('/api/recognize', methods=['POST'])
def recognize_faces():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    file = request.files['image']
    
    group_img_path = os.path.join("output", "temp_group.jpg")
    file.save(group_img_path)
    
    print("[*] Re-indexing known faces from directory...")
    # This automatically includes any faces just uploaded via UI
    encs, names = load_known_faces(FACES_DIR)
    
    print("[*] Running DeepFace and YOLOv8 inference...")
    if not yolo_model:
        return jsonify({"error": "YOLO model not loaded"}), 500
        
    records = process_attendance(group_img_path, yolo_model, encs, names)
    
    if not records:
        records = []

    return jsonify({"records": records, "result_image": "attendance_result.jpg"})


@app.route('/api/attendance/save', methods=['POST', 'OPTIONS'])
def save_attendance():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.json or {}
    records = data.get('records', [])
    attendance_file = "attendance.csv"
    
    file_exists = os.path.isfile(attendance_file)
    with open(attendance_file, mode='a', newline='') as f:
        fieldnames = ["Name", "Timestamp", "Confidence_Percentage", "Status"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        if not file_exists:
            writer.writeheader()
            
        for record in records:
            writer.writerow({
                "Name": record.get("Name", "Unknown"),
                "Timestamp": record.get("Timestamp", ""),
                "Confidence_Percentage": record.get("Confidence_Percentage", 0.0),
                "Status": record.get("Status", "Unknown")
            })
            
    return jsonify({"status": "success", "saved": len(records)})


if __name__ == '__main__':
    print("[*] Starting AuraTrack Backend on port 5000...")
    app.run(port=5000, debug=False)
