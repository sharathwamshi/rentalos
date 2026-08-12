import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required

bp = Blueprint("common", __name__, url_prefix="/api")

ALLOWED_EXT = {"png", "jpg", "jpeg", "pdf", "webp"}


@bp.post("/uploads")
@jwt_required()
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided."}), 400
    file = request.files["file"]
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXT:
        return jsonify({"error": "Unsupported file type."}), 400

    folder = request.form.get("folder", "misc")
    safe_folder = "".join(c for c in folder if c.isalnum() or c in "-_")
    dest_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], safe_folder)
    os.makedirs(dest_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex}.{ext}"
    file.save(os.path.join(dest_dir, filename))
    url = f"/api/uploads/{safe_folder}/{filename}"
    return jsonify({"url": url}), 201


@bp.get("/uploads/<folder>/<filename>")
def serve_upload(folder, filename):
    directory = os.path.join(current_app.config["UPLOAD_FOLDER"], folder)
    return send_from_directory(directory, filename)


@bp.get("/health")
def health():
    return jsonify({"status": "ok"})
