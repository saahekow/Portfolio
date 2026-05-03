from pathlib import Path
from uuid import uuid4
import os

from dotenv import load_dotenv
from flask import Flask, redirect, render_template, request, session, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename


BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"
UPLOADS_DIR = STATIC_DIR / "uploads"
load_dotenv(BASE_DIR / ".env")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app = Flask(
    __name__,
    template_folder=str(TEMPLATES_DIR),
    static_folder=str(STATIC_DIR),
)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "change-this-secret-key")
app.config["UPLOAD_FOLDER"] = str(UPLOADS_DIR)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{(BASE_DIR / 'portfolio.db').as_posix()}",
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}
CATEGORY_CHOICES = [
    "Graphic Design",
    "Web Design",
    "Web Development",
    "App Development",
    "Branding",
    "Print Design",
    "Digital Content",
    "UI/UX",
    "Other",
]


class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)


class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    target = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    tags = db.Column(db.String(255), default="")
    link = db.Column(db.String(255), default="")
    link_label = db.Column(db.String(100), default="")
    image_filename = db.Column(db.String(255), default="")

    @property
    def tags_list(self):
        return [tag.strip() for tag in (self.tags or "").split(",") if tag.strip()]

    @property
    def image_url(self):
        if not self.image_filename:
            return ""

        return url_for("static", filename=f"uploads/{self.image_filename}")


def is_admin_logged_in():
    return bool(session.get("admin_logged_in"))


def save_uploaded_image(file_storage):
    if not file_storage or not file_storage.filename:
        return ""

    filename = secure_filename(file_storage.filename)
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if extension not in ALLOWED_EXTENSIONS:
        return ""

    stored_name = f"{uuid4().hex}.{extension}"
    destination = UPLOADS_DIR / stored_name
    file_storage.save(destination)
    return stored_name


def delete_uploaded_image(filename):
    if not filename:
        return

    file_path = UPLOADS_DIR / filename
    if file_path.exists():
        file_path.unlink()


def build_dashboard_context(editing_project=None):
    projects = Project.query.order_by(Project.id.desc()).all()
    main_count = Project.query.filter_by(target="main").count()
    graphics_count = Project.query.filter_by(target="graphics").count()

    return {
        "projects": projects,
        "categories": CATEGORY_CHOICES,
        "main_count": main_count,
        "graphics_count": graphics_count,
        "total_count": main_count + graphics_count,
        "editing_project": editing_project,
        "form_error": request.args.get("error", ""),
        "form_success": request.args.get("success", ""),
    }


@app.route("/")
def index():
    projects = Project.query.filter_by(target="main").order_by(Project.id.desc()).all()
    return render_template("index.html", projects=projects)


@app.route("/graphics")
def graphics():
    projects = Project.query.filter_by(target="graphics").order_by(Project.id.desc()).all()
    return render_template("graphics.html", projects=projects)


@app.route("/admin", methods=["GET", "POST"])
def admin_login():
    if is_admin_logged_in():
        return redirect(url_for("dashboard"))

    error = None

    if request.method == "POST":
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""

        admin = Admin.query.filter_by(username=username).first()

        if admin and check_password_hash(admin.password, password):
            session["admin_logged_in"] = True
            return redirect(url_for("dashboard"))

        error = "Invalid username or password."

    return render_template("admin.html", error=error)


@app.route("/dashboard")
def dashboard():
    if not is_admin_logged_in():
        return redirect(url_for("admin_login"))

    edit_project_id = request.args.get("edit", type=int)
    editing_project = Project.query.get_or_404(edit_project_id) if edit_project_id else None

    return render_template("dashboard.html", **build_dashboard_context(editing_project))


@app.route("/add-project", methods=["POST"])
def add_project():
    if not is_admin_logged_in():
        return redirect(url_for("admin_login"))

    title = (request.form.get("title") or "").strip()
    description = (request.form.get("description") or "").strip()
    target = (request.form.get("target") or "").strip()
    category = (request.form.get("category") or "").strip()

    if not title or not description or target not in {"main", "graphics"}:
        return redirect(url_for("dashboard", error="Please complete the required project fields."))

    if category not in CATEGORY_CHOICES:
        category = "Other"

    image_filename = save_uploaded_image(request.files.get("imageFile"))

    project = Project(
        target=target,
        category=category,
        title=title,
        description=description,
        tags=(request.form.get("tags") or "").strip(),
        link=(request.form.get("link") or "").strip(),
        link_label=(request.form.get("linkLabel") or "").strip(),
        image_filename=image_filename,
    )

    db.session.add(project)
    db.session.commit()

    return redirect(url_for("dashboard", success="Project added successfully."))


@app.route("/update-project/<int:project_id>", methods=["POST"])
def update_project(project_id):
    if not is_admin_logged_in():
        return redirect(url_for("admin_login"))

    project = Project.query.get_or_404(project_id)
    title = (request.form.get("title") or "").strip()
    description = (request.form.get("description") or "").strip()
    target = (request.form.get("target") or "").strip()
    category = (request.form.get("category") or "").strip()

    if not title or not description or target not in {"main", "graphics"}:
        return redirect(
            url_for(
                "dashboard",
                edit=project.id,
                error="Please complete the required project fields before updating.",
            )
        )

    if category not in CATEGORY_CHOICES:
        category = "Other"

    new_image_filename = save_uploaded_image(request.files.get("imageFile"))
    if new_image_filename:
        delete_uploaded_image(project.image_filename)
        project.image_filename = new_image_filename

    project.target = target
    project.category = category
    project.title = title
    project.description = description
    project.tags = (request.form.get("tags") or "").strip()
    project.link = (request.form.get("link") or "").strip()
    project.link_label = (request.form.get("linkLabel") or "").strip()

    db.session.commit()

    return redirect(url_for("dashboard", success="Project updated successfully."))


@app.route("/delete-project/<int:project_id>", methods=["POST"])
def delete_project(project_id):
    if not is_admin_logged_in():
        return redirect(url_for("admin_login"))

    project = Project.query.get_or_404(project_id)
    delete_uploaded_image(project.image_filename)
    db.session.delete(project)
    db.session.commit()

    return redirect(url_for("dashboard", success="Project deleted successfully."))


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return redirect(url_for("admin_login"))


with app.app_context():
    db.create_all()

    if not Admin.query.filter_by(username="admin").first():
        db.session.add(
            Admin(
                username="admin",
                password=generate_password_hash("admin123"),
            )
        )
        db.session.commit()


if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "1") == "1"
    host = os.getenv("FLASK_RUN_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_RUN_PORT", "5000"))
    app.run(host=host, port=port, debug=debug)
