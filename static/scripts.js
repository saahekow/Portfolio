const STORAGE_KEY = "josephSaahPortfolioProjects";
const ADMIN_SESSION_KEY = "josephSaahAdminSession";
const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

function getRuntimeUrl(name, fallback) {
    const currentScript = document.currentScript
        || document.querySelector("script[data-admin-url][data-dashboard-url]");

    if (!currentScript) {
        return fallback;
    }

    return currentScript.dataset[name] || fallback;
}

const DEFAULT_PROJECTS = {
    main: [
        {
            id: "default-main-graphic-design",
            category: "Graphic Design",
            title: "Brand Identity System",
            description:
                "A visual identity project focused on logo direction, brand colors, typography, and supporting assets that help a business stand out.",
            tags: ["Branding", "Logos", "Identity Systems"],
            link: "graphics.html",
            linkLabel: "Open Graphics Portfolio",
            image: ""
        },
        {
            id: "default-main-web-design",
            category: "Web Design",
            title: "Modern Business Website",
            description:
                "A polished website concept with strong layout structure, responsive sections, and a user journey designed to build trust and drive action.",
            tags: ["UI Layout", "Responsive Design", "User Flow"],
            link: "",
            linkLabel: "",
            image: ""
        },
        {
            id: "default-main-app-development",
            category: "App Development",
            title: "Mobile App Interface",
            description:
                "An app-focused concept that brings together interface design, usability, and practical features to create a smooth mobile experience.",
            tags: ["Mobile UI", "Product Thinking", "Interaction Design"],
            link: "",
            linkLabel: "",
            image: ""
        }
    ],
    graphics: [
        {
            id: "default-graphics-branding",
            category: "Branding",
            title: "Logos & Identity",
            description:
                "Add your logo concepts, brand systems, color studies, and visual identity projects in this section.",
            tags: ["Logos", "Color Systems"],
            link: "",
            linkLabel: "",
            image: ""
        },
        {
            id: "default-graphics-print",
            category: "Print Design",
            title: "Posters, Flyers & Banners",
            description:
                "Use this area for promotional materials, event flyers, posters, brochures, and print-ready design work.",
            tags: ["Flyers", "Posters"],
            link: "",
            linkLabel: "",
            image: ""
        },
        {
            id: "default-graphics-digital",
            category: "Digital Content",
            title: "Social Media Creatives",
            description:
                "Showcase social media posts, campaign visuals, ads, and other digital designs created for online platforms.",
            tags: ["Campaigns", "Content Design"],
            link: "",
            linkLabel: "",
            image: ""
        }
    ]
};

function safeJsonParse(value, fallback) {
    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
}

function getStoredProjects() {
    let parsed = {};

    try {
        parsed = safeJsonParse(localStorage.getItem(STORAGE_KEY), {});
    } catch (error) {
        parsed = {};
    }

    return {
        main: Array.isArray(parsed.main) ? parsed.main : [],
        graphics: Array.isArray(parsed.graphics) ? parsed.graphics : []
    };
}

function saveStoredProjects(projects) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
        showAdminFeedback("Projects could not be saved in this browser.", "error");
    }
}

function isAdminAuthenticated() {
    try {
        return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
    } catch (error) {
        return false;
    }
}

function setAdminAuthenticated(value) {
    try {
        if (value) {
            sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        } else {
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
        }
    } catch (error) {
        // Ignore session storage failures and keep the UI fallback local to the page state.
    }
}

function getMergedProjects(target) {
    const stored = getStoredProjects();
    return [...DEFAULT_PROJECTS[target], ...stored[target]];
}

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (typeof text === "string") {
        element.textContent = text;
    }

    return element;
}

function isExternalLink(url) {
    return /^https?:\/\//i.test(url);
}

function setLinkBehavior(linkElement, href) {
    linkElement.href = href;

    if (isExternalLink(href)) {
        linkElement.target = "_blank";
        linkElement.rel = "noreferrer";
    }
}

function createTagGroup(tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
        return null;
    }

    const group = createElement("div", "project-meta");

    tags.forEach((tag) => {
        group.appendChild(createElement("span", "", tag));
    });

    return group;
}

function createProjectImage(project) {
    if (!project.image) {
        return createElement("div", "placeholder-visual");
    }

    const media = createElement("div", "dynamic-media");
    const image = createElement("img", "dynamic-image");
    image.src = project.image;
    image.alt = project.title;
    media.appendChild(image);
    return media;
}

function createMainProjectCard(project) {
    const card = createElement("article", "project-card dynamic-project-card");

    if (project.image) {
        card.appendChild(createProjectImage(project));
    }

    card.appendChild(createElement("p", "card-tag", project.category));
    card.appendChild(createElement("h3", "", project.title));
    card.appendChild(createElement("p", "", project.description));

    const tagGroup = createTagGroup(project.tags);
    if (tagGroup) {
        card.appendChild(tagGroup);
    }

    if (project.link) {
        const link = createElement("a", "project-link", project.linkLabel || "View Project");
        setLinkBehavior(link, project.link);
        card.appendChild(link);
    }

    return card;
}

function createGraphicsProjectCard(project) {
    const card = createElement("article", "placeholder-card dynamic-project-card");
    card.appendChild(createProjectImage(project));
    card.appendChild(createElement("p", "card-tag", project.category));
    card.appendChild(createElement("h3", "", project.title));
    card.appendChild(createElement("p", "", project.description));

    const tagGroup = createTagGroup(project.tags);
    if (tagGroup) {
        card.appendChild(tagGroup);
    }

    if (project.link) {
        const link = createElement("a", "project-link", project.linkLabel || "View Project");
        setLinkBehavior(link, project.link);
        card.appendChild(link);
    }

    return card;
}

function renderProjectGrids() {
    const grids = document.querySelectorAll("[data-project-grid]");

    grids.forEach((grid) => {
        const target = grid.getAttribute("data-project-grid");
        const projects = getMergedProjects(target);
        grid.innerHTML = "";

        projects.forEach((project) => {
            const card = target === "graphics"
                ? createGraphicsProjectCard(project)
                : createMainProjectCard(project);

            grid.appendChild(card);
        });
    });
}

function parseTags(input) {
    return input
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
}

function buildProjectFromForm(formData, image) {
    const target = formData.get("target");

    return {
        id: `custom-${Date.now()}`,
        category: String(formData.get("category") || "").trim() || "Project",
        title: String(formData.get("title") || "").trim(),
        description: String(formData.get("description") || "").trim(),
        tags: parseTags(String(formData.get("tags") || "")),
        link: String(formData.get("link") || "").trim(),
        linkLabel: String(formData.get("linkLabel") || "").trim(),
        image,
        target
    };
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve("");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            resolve(typeof reader.result === "string" ? reader.result : "");
        };

        reader.onerror = () => {
            reject(new Error("The selected image could not be read."));
        };

        reader.readAsDataURL(file);
    });
}

function createAdminProjectCard(project, isDefault) {
    const card = createElement("article", "admin-project-card");
    const meta = createElement("div", "admin-project-meta");
    const badge = createElement(
        "span",
        `admin-badge ${isDefault ? "admin-badge-muted" : "admin-badge-strong"}`,
        isDefault ? "Default" : "Custom"
    );
    const target = createElement("span", "admin-badge", project.target === "graphics" ? "Graphics" : "Main");
    meta.appendChild(badge);
    meta.appendChild(target);

    card.appendChild(meta);
    card.appendChild(createElement("h3", "", project.title));
    card.appendChild(createElement("p", "admin-project-category", project.category));
    card.appendChild(createElement("p", "", project.description));

    if (project.tags.length) {
        const tags = createElement("div", "admin-chip-group");
        project.tags.forEach((tag) => {
            tags.appendChild(createElement("span", "", tag));
        });
        card.appendChild(tags);
    }

    if (!isDefault) {
        const actions = createElement("div", "admin-project-actions");
        const removeButton = createElement("button", "admin-action-button", "Delete");
        removeButton.type = "button";
        removeButton.dataset.projectId = project.id;
        removeButton.dataset.projectTarget = project.target;
        actions.appendChild(removeButton);
        card.appendChild(actions);
    }

    return card;
}

function updateAdminCounts(stored) {
    const totalMain = DEFAULT_PROJECTS.main.length + stored.main.length;
    const totalGraphics = DEFAULT_PROJECTS.graphics.length + stored.graphics.length;
    const customTotal = stored.main.length + stored.graphics.length;

    const mainCount = document.querySelector("[data-count-main]");
    const graphicsCount = document.querySelector("[data-count-graphics]");
    const customCount = document.querySelector("[data-count-custom]");

    if (mainCount) {
        mainCount.textContent = String(totalMain);
    }

    if (graphicsCount) {
        graphicsCount.textContent = String(totalGraphics);
    }

    if (customCount) {
        customCount.textContent = String(customTotal);
    }
}

function renderAdminLists() {
    const stored = getStoredProjects();
    const customList = document.querySelector("[data-admin-list]");
    const defaultList = document.querySelector("[data-default-list]");

    if (!customList || !defaultList) {
        return;
    }

    customList.innerHTML = "";
    defaultList.innerHTML = "";

    const customProjects = [...stored.main, ...stored.graphics];
    const defaultProjects = [
        ...DEFAULT_PROJECTS.main.map((project) => ({ ...project, target: "main" })),
        ...DEFAULT_PROJECTS.graphics.map((project) => ({ ...project, target: "graphics" }))
    ];

    if (customProjects.length === 0) {
        const empty = createElement(
            "div",
            "admin-empty-state",
            "No custom projects yet. Use the form above to add your first project."
        );
        customList.appendChild(empty);
    } else {
        customProjects.forEach((project) => {
            customList.appendChild(createAdminProjectCard(project, false));
        });
    }

    defaultProjects.forEach((project) => {
        defaultList.appendChild(createAdminProjectCard(project, true));
    });

    updateAdminCounts(stored);
}

function showAdminFeedback(message, tone) {
    const feedback = document.querySelector("[data-admin-feedback]");

    if (!feedback) {
        return;
    }

    feedback.textContent = message;
    feedback.className = `admin-feedback ${tone}`;
}

function showLoginFeedback(message, tone) {
    const feedback = document.querySelector("[data-login-feedback]");

    if (!feedback) {
        return;
    }

    feedback.textContent = message;
    feedback.className = `admin-feedback ${tone}`;
}

async function handleAdminSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const imageFile = formData.get("imageFile");
    let image = "";

    try {
        image = await readFileAsDataUrl(imageFile instanceof File ? imageFile : null);
    } catch (error) {
        showAdminFeedback("The selected image could not be added. Please try another file.", "error");
        return;
    }

    const project = buildProjectFromForm(formData, image);

    if (!project.title || !project.description) {
        showAdminFeedback("Add at least a title and description before saving.", "error");
        return;
    }

    const stored = getStoredProjects();
    stored[project.target].push(project);
    saveStoredProjects(stored);

    form.reset();
    renderAdminLists();
    renderProjectGrids();
    showAdminFeedback("Project saved. It will now appear on the selected page.", "success");
}

function handleAdminActions(event) {
    const removeButton = event.target.closest("[data-project-id]");
    const resetButton = event.target.closest("[data-reset-projects]");
    const logoutButton = event.target.closest("[data-admin-logout]");

    if (removeButton) {
        const projectId = removeButton.dataset.projectId;
        const projectTarget = removeButton.dataset.projectTarget;
        const stored = getStoredProjects();

        stored[projectTarget] = stored[projectTarget].filter((project) => project.id !== projectId);
        saveStoredProjects(stored);
        renderAdminLists();
        renderProjectGrids();
        showAdminFeedback("Custom project removed.", "success");
    }

    if (resetButton) {
        saveStoredProjects({ main: [], graphics: [] });
        renderAdminLists();
        renderProjectGrids();
        showAdminFeedback("All custom projects have been cleared.", "success");
    }

    if (logoutButton) {
        setAdminAuthenticated(false);
        window.location.href = getRuntimeUrl("adminUrl", "/admin");
    }
}

let adminDashboardInitialized = false;

function handleLoginSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        setAdminAuthenticated(true);
        form.reset();
        showLoginFeedback("Login successful. Redirecting to your dashboard...", "success");
        window.setTimeout(() => {
            window.location.href = getRuntimeUrl("dashboardUrl", "/dashboard");
        }, 500);
        return;
    }

    showLoginFeedback("Incorrect username or password.", "error");
}

function initAdminDashboard() {
    const form = document.querySelector("[data-project-form]");
    const adminArea = document.querySelector("[data-admin-area]");

    if (!form || !adminArea) {
        return;
    }

    form.addEventListener("submit", handleAdminSubmit);
    adminArea.addEventListener("click", handleAdminActions);
    renderAdminLists();
    adminDashboardInitialized = true;
}

function initAdminLoginPage() {
    const loginPage = document.querySelector("[data-admin-login-page]");
    const loginForm = document.querySelector("[data-login-form]");

    if (!loginPage || !loginForm) {
        return;
    }

    if (isAdminAuthenticated()) {
        window.location.href = getRuntimeUrl("dashboardUrl", "/dashboard");
        return;
    }

    loginForm.addEventListener("submit", handleLoginSubmit);
}

function initDashboardPage() {
    const dashboardPage = document.querySelector("[data-admin-dashboard-page]");

    if (!dashboardPage) {
        return;
    }

    if (!isAdminAuthenticated()) {
        window.location.href = getRuntimeUrl("adminUrl", "/admin");
        return;
    }

    initAdminDashboard();
}

document.addEventListener("DOMContentLoaded", () => {
    renderProjectGrids();
    initAdminLoginPage();
    initDashboardPage();
});
