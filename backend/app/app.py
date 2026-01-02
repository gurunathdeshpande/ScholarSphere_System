from flask import Flask
from app.config import Config
from app.extensions import db, migrate, jwt, ma, cors

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    ma.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": "*"}})

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {"msg": f"Invalid token: {error}", "error": "invalid_token"}, 422

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {"msg": f"Missing token: {error}", "error": "missing_token"}, 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return {"msg": "Token has expired", "error": "token_expired"}, 401

    # Register blueprints
    from app.auth import auth_bp
    from app.routes.faculty import faculty_bp
    from app.routes.search import search_bp
    from app.routes.analytics import analytics_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(faculty_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(analytics_bp)
    
    from app.routes.collaboration import collaboration_bp
    app.register_blueprint(collaboration_bp)

    from app.routes.forum import forum_bp
    app.register_blueprint(forum_bp)
    
    from app.routes.notifications import notifications_bp
    app.register_blueprint(notifications_bp)
    
    from app.routes.ai import ai_bp
    app.register_blueprint(ai_bp)
    
    from app.routes.verification import verification_bp
    app.register_blueprint(verification_bp)

    @app.route('/')
    def index():
        return {"status": "ScholarSphere API is running", "documentation": "/api/docs (if configured)"}, 200

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
