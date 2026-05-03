document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("[data-project-preview-form]");

    if (!form) {
        return;
    }

    const targetInput = form.querySelector("[data-preview-target]");
    const categoryInput = form.querySelector("[data-preview-category]");
    const titleInput = form.querySelector("[data-preview-title]");
    const descriptionInput = form.querySelector("[data-preview-description]");
    const tagsInput = form.querySelector("[data-preview-tags]");
    const imageInput = form.querySelector("[data-preview-image]");
    const linkInput = form.querySelector("[data-preview-link]");
    const linkLabelInput = form.querySelector("[data-preview-link-label]");

    const targetLabel = document.querySelector("[data-preview-target-label]");
    const categoryLabel = document.querySelector("[data-preview-category-label]");
    const titleLabel = document.querySelector("[data-preview-title-label]");
    const descriptionLabel = document.querySelector("[data-preview-description-label]");
    const tagsLabel = document.querySelector("[data-preview-tags-label]");
    const mediaLabel = document.querySelector("[data-preview-media]");
    const linkAnchor = document.querySelector("[data-preview-link-anchor]");
    const previewCard = document.querySelector("[data-preview-card]");
    const previewHint = document.querySelector("[data-preview-hint]");
    const openModalButton = document.querySelector("[data-open-preview-modal]");
    const previewModal = document.querySelector("[data-preview-modal]");
    const modalCloseButtons = document.querySelectorAll("[data-close-preview-modal]");
    const modalMedia = document.querySelector("[data-modal-media]");
    const modalCategory = document.querySelector("[data-modal-category]");
    const modalTitle = document.querySelector("[data-modal-title]");
    const modalTarget = document.querySelector("[data-modal-target]");
    const modalDescription = document.querySelector("[data-modal-description]");
    const modalTags = document.querySelector("[data-modal-tags]");
    const modalLink = document.querySelector("[data-modal-link]");
    const initialImageSrc = form.dataset.initialImage || "";
    const initialTitle = form.dataset.initialTitle || "";

    const defaultValues = {
        title: "Campaign Visual Set",
        description: "Describe the project clearly so visitors understand what it is about.",
        category: "Graphic Design",
        target: "Main Portfolio",
        linkLabel: "View Project"
    };

    function buildTagMarkup() {
        const tags = (tagsInput.value || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);

        if (!tags.length) {
            tagsLabel.innerHTML = "<span>Branding</span><span>Poster</span><span>UI</span>";
            return;
        }

        tagsLabel.innerHTML = "";
        tags.forEach((tag) => {
            const chip = document.createElement("span");
            chip.textContent = tag;
            tagsLabel.appendChild(chip);
        });
    }

    function getActiveTags() {
        const tags = (tagsInput.value || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);

        return tags.length ? tags : ["Branding", "Poster", "UI"];
    }

    function getPreviewState() {
        const isGraphics = targetInput.value === "graphics";
        const currentMedia = document.querySelector("[data-preview-media]");
        const currentImage = currentMedia ? currentMedia.querySelector("img") : null;

        return {
            isGraphics,
            targetLabel: isGraphics ? "Graphics Page" : defaultValues.target,
            category: categoryInput.value || defaultValues.category,
            title: titleInput.value.trim() || defaultValues.title,
            description: descriptionInput.value.trim() || defaultValues.description,
            tags: getActiveTags(),
            link: linkInput.value.trim(),
            linkLabel: linkLabelInput.value.trim() || defaultValues.linkLabel,
            imageSrc: currentImage ? currentImage.src : ""
        };
    }

    function updateImagePreview() {
        const file = imageInput.files && imageInput.files[0];
        const currentMedia = document.querySelector("[data-preview-media]");

        if (!file) {
            if (currentMedia) {
                if (initialImageSrc) {
                    currentMedia.outerHTML = `
                        <div class="dynamic-media" data-preview-media>
                            <img src="${initialImageSrc}" alt="${initialTitle || defaultValues.title}" class="dynamic-image">
                        </div>
                    `;
                } else {
                    currentMedia.outerHTML = '<div class="placeholder-visual" data-preview-media></div>';
                }
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const replacement = document.createElement("div");
            replacement.className = "dynamic-media";
            replacement.setAttribute("data-preview-media", "");

            const image = document.createElement("img");
            image.className = "dynamic-image";
            image.src = typeof reader.result === "string" ? reader.result : "";
            image.alt = titleInput.value.trim() || defaultValues.title;
            replacement.appendChild(image);

            const activeMedia = document.querySelector("[data-preview-media]");
            if (activeMedia) {
                activeMedia.replaceWith(replacement);
            }
        };

        reader.readAsDataURL(file);
    }

    function renderModalTags(tags) {
        modalTags.innerHTML = "";
        tags.forEach((tag) => {
            const chip = document.createElement("span");
            chip.textContent = tag;
            modalTags.appendChild(chip);
        });
    }

    function renderModalMedia(imageSrc, title) {
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

    function openPreviewModal() {
        if (!previewModal) {
            return;
        }

        const state = getPreviewState();
        modalCategory.textContent = state.category;
        modalTitle.textContent = state.title;
        modalTarget.textContent = state.targetLabel;
        modalDescription.textContent = state.description;
        renderModalTags(state.tags);
        renderModalMedia(state.imageSrc, state.title);

        modalLink.textContent = state.linkLabel;
        modalLink.href = state.link || "#";
        modalLink.style.display = state.link || linkLabelInput.value.trim() ? "inline-flex" : "none";

        previewModal.classList.remove("is-hidden");
        document.body.classList.add("modal-open");
    }

    function closePreviewModal() {
        if (!previewModal) {
            return;
        }

        previewModal.classList.add("is-hidden");
        document.body.classList.remove("modal-open");
    }

    function updatePreview() {
        const state = getPreviewState();

        targetLabel.textContent = state.targetLabel;
        categoryLabel.textContent = state.category;
        titleLabel.textContent = state.title;
        descriptionLabel.textContent = state.description;

        linkAnchor.textContent = state.linkLabel;
        linkAnchor.href = state.link || "#";
        linkAnchor.style.display = state.link || linkLabelInput.value.trim() ? "inline-flex" : "none";

        previewCard.classList.toggle("preview-main", !state.isGraphics);
        previewCard.classList.toggle("preview-graphics", state.isGraphics);

        if (previewHint) {
            previewHint.textContent = state.isGraphics
                ? "Graphics preview uses the showcase card style from the graphics page."
                : "Main portfolio preview uses the standard homepage project card style.";
        }

        buildTagMarkup();
    }

    form.addEventListener("input", updatePreview);
    form.addEventListener("change", (event) => {
        updatePreview();
        if (event.target === imageInput) {
            updateImagePreview();
        }
    });

    if (openModalButton) {
        openModalButton.addEventListener("click", openPreviewModal);
    }

    modalCloseButtons.forEach((button) => {
        button.addEventListener("click", closePreviewModal);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closePreviewModal();
        }
    });

    updatePreview();
});
