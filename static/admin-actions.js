document.addEventListener("DOMContentLoaded", () => {
    const guardedForm = document.querySelector("[data-dirty-guard-form]");
    let initialSnapshot = guardedForm ? snapshotForm(guardedForm) : "";
    let isDirty = false;
    let isSubmitting = false;

    function snapshotForm(form) {
        const fields = Array.from(form.elements);

        return fields
            .filter((field) => field.name)
            .map((field) => {
                if (field.type === "file") {
                    const fileNames = Array.from(field.files || []).map((file) => file.name);
                    return `${field.name}:${fileNames.join("|")}`;
                }

                if (field.type === "checkbox" || field.type === "radio") {
                    return `${field.name}:${field.checked}`;
                }

                return `${field.name}:${field.value}`;
            })
            .join("||");
    }

    function syncDirtyState() {
        if (!guardedForm || isSubmitting) {
            return;
        }

        isDirty = snapshotForm(guardedForm) !== initialSnapshot;
    }

    function confirmDiscard(message) {
        if (!isDirty) {
            return true;
        }

        return window.confirm(message);
    }

    if (guardedForm) {
        guardedForm.addEventListener("input", syncDirtyState);
        guardedForm.addEventListener("change", syncDirtyState);
    }

    document.addEventListener("click", (event) => {
        const link = event.target.closest("[data-discard-link]");

        if (!link) {
            return;
        }

        const message =
            link.dataset.discardMessage ||
            "You have unsaved changes. Leave this form anyway?";

        if (!confirmDiscard(message)) {
            event.preventDefault();
        }
    });

    window.addEventListener("beforeunload", (event) => {
        if (!isDirty || isSubmitting) {
            return;
        }

        event.preventDefault();
        event.returnValue = "";
    });

    document.addEventListener(
        "submit",
        (event) => {
            const form = event.target;

            if (!(form instanceof HTMLFormElement)) {
                return;
            }

            const confirmMessage = form.dataset.confirmMessage;
            if (confirmMessage && !window.confirm(confirmMessage)) {
                event.preventDefault();
                return;
            }

            const submitter =
                event.submitter ||
                form.querySelector('button[type="submit"], input[type="submit"]');

            if (submitter) {
                const submittingText = form.dataset.submittingText;
                if (submittingText && submitter.dataset.originalText === undefined) {
                    submitter.dataset.originalText = submitter.textContent.trim();
                    submitter.textContent = submittingText;
                }

                submitter.disabled = true;
                submitter.classList.add("is-busy");
            }

            if (guardedForm && form === guardedForm) {
                isSubmitting = true;
                isDirty = false;
            }
        },
        true,
    );

    if (guardedForm) {
        initialSnapshot = snapshotForm(guardedForm);
        syncDirtyState();
    }
});
