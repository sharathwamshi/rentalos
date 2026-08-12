import os
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager

from config import Config
from app.extensions import db, migrate, jwt, cors


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"]}}, supports_credentials=True)

    from app.blueprints.auth.routes import bp as auth_bp
    from app.blueprints.owner.routes import bp as owner_bp
    from app.blueprints.tenant.routes import bp as tenant_bp
    from app.blueprints.admin.routes import bp as admin_bp
    from app.blueprints.common.routes import bp as common_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(owner_bp)
    app.register_blueprint(tenant_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(common_bp)

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found."}), 404

    @app.errorhandler(500)
    def server_error(e):
        app.logger.exception(e)
        return jsonify({"error": "Something went wrong on our end. Please try again."}), 500

    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):
        return jsonify({"error": "Your session has expired. Please sign in again."}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"error": "Invalid session token."}), 422

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"error": "Authentication required."}), 401

    from app.cli import register_cli
    register_cli(app)

    return app
