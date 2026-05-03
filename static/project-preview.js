document.addEventListener("DOMContentLoaded", () => {
    const previewButtons = document.querySelectorAll("[data-project-preview-button]");
    const previewModal = document.querySelector("[data-project-preview-modal]");

    if (!previewButtons.length || !previewModal) {
        return;
    }

    const closeButtons = previewModal.querySelectorAll("[data-close-project-preview]");
    const modalMedia = previewModal.querySelector("[data-project-modal-media]");
    const modalCategory = previewModal.querySelector("[data-project-modal-category]");
    const modalTitle = previewModal.querySelector("[data-project-modal-title]");
    const modalTarget = previewModal.querySelector("[data-project-modal-target]");
    const modalDescription = previewModal.querySelector("[data-project-modal-description]");
    const modalTags = previewModal.querySelector("[data-project-modal-tags]");
    const modalLink = previewModal.querySelector("[data-project-modal-link]");

    function renderTags(tagsValue) {
        const tags = (tagsValue || "")
            .split("||")
            .map((tag) => tag.trim())
            .filter(Boolean);

        modalTags.innerHTML = "";

        if (!tags.length) {
            modalTags.classList.add("is-hidden");
            return;
        }

        modalTags.classList.remove("is-hidden");
        tags.forEach((tag) => {
            const chip = document.createElement("span");
            chip.textContent = tag;
            modalTags.appendChild(chip);
        });
    }

    function renderMedia(imageSrc, title) {
        if (!imageSrc) {
            modalMedia.innerHTML = '<div class="placeholder-visual preview-modal-placeholder"></div>';
            return;
        }

        modalMedia.innerHTML = "";

        const image = document.createElement("img");
        image.className = "preview-modal-image";
        image.src = imageSrc;
        image.alt = title;
        modalMedia.appendChild(image);
    }

    function openModal(card) {
        const category = card.dataset.projectCategory || "Project";
        const title = card.dataset.projectTitle || "Project Preview";
        const target = card.dataset.projectTarget || "Portfolio";
        const description = card.dataset.projectDescription || "Project details will appear here.";
        const tags = card.dataset.projectTags || "";
        const imageSrc = card.dataset.projectImage || "";
        const link = card.dataset.projectLink || "";
        const linkLabel = card.dataset.projectLinkLabel || "View Project";

        modalCategory.textContent = category;
        modalTitle.textContent = title;
        modalTarget.textContent = target;
        modalDescription.textContent = description;
        renderTags(tags);
        renderMedia(imageSrc, title);

        if (link) {
            modalLink.textContent = linkLabel;
            modalLink.href = link;
            modalLink.classList.remove("is-hidden");
        } else {
            modalLink.href = "#";
            modalLink.classList.add("is-hidden");
        }

        previewModal.classList.remove("is-hidden");
        document.body.classList.add("modal-open");
    }

    function closeModal() {
        previewModal.classList.add("is-hidden");
        document.body.classList.remove("modal-open");
    }

    previewButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const card = button.closest("[data-project-preview-card]");
            if (card) {
                openModal(card);
            }
        });
    });

    closeButtons.forEach((button) => {
        button.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeModal();
        }
    });
});
