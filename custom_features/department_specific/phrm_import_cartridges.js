// Very temporary tool while trying to sort out Pharmacy Tech weird cartridge importing.
// Maybe keep while they use the tool, but turn it off in custom_canvas.js once they're done with it for this year.

(() => {
  "use strict";

  const sourceAccountId = 4494;
  const destinationCourseId = ENV.COURSE_ID;
  const buttonId = "import-chcm-content";

  const csrfToken = decodeURIComponent(
    document.cookie.match(/(?:^|;\s*)_csrf_token=([^;]+)/)?.[1] || ""
  );

  function form(values) {
    const body = new URLSearchParams();

    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        body.append(key, String(value));
      }
    });

    return body;
  }

  async function canvasWrite(url, method, body = null) {
    const response = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "X-CSRF-Token": csrfToken,
        ...(body
          ? {
              "Content-Type":
                "application/x-www-form-urlencoded;charset=UTF-8"
            }
          : {})
      },
      body
    });

    if (!response.ok) {
      throw new Error(
        `${method} ${url}: ${response.status} ${await response.text()}`
      );
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async function canvasAction(
    url,
    method,
    body = null
  ) {
    const response = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: {
        "X-CSRF-Token": csrfToken,
        ...(body
          ? {
              "Content-Type":
                "application/x-www-form-urlencoded;charset=UTF-8"
            }
          : {})
      },
      body
    });

    if (!response.ok) {
      throw new Error(
        `${method} ${url}: ${response.status} ${await response.text()}`
      );
    }

    return response.text();
  }

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  /*
   * Chapter 1 Test
   * Chapter 01 Test
   * Ch 1 Test
   * Ch 01 Test
   *
   * All produce:
   * {
   *   number: 1,
   *   contentType: "Test"
   * }
   */
  function parseChapter(name) {
    const match = String(name || "")
      .trim()
      .match(
        /^(?:Chapter|Ch)\s+0*(\d+)(?:\s*[:.-]\s*|\s+)(.+)$/i
      );

    if (!match) return null;

    return {
      number: Number(match[1]),
      contentType: match[2].trim()
    };
  }

  function getContentType(name) {
    return parseChapter(name)?.contentType || null;
  }

  function getChapterNumber(name) {
    return parseChapter(name)?.number ?? null;
  }

  function getAction(assignment, selections) {
    const contentType = getContentType(
      assignment.name
    );

    if (contentType) {
      return (
        selections.typeActions.get(
          normalize(contentType)
        ) || "assignment"
      );
    }

    return (
      selections.assignmentActions.get(
        Number(assignment.id)
      ) || "assignment"
    );
  }

  function makeButton(
    text,
    className = "Button"
  ) {
    const button =
      document.createElement("button");

    button.type = "button";
    button.className = className;
    button.textContent = text;

    return button;
  }

  function addWizardStyles() {
    if (
      document.getElementById(
        "chcm-import-wizard-styles"
      )
    ) {
      return;
    }

    const style = document.createElement("style");
    style.id = "chcm-import-wizard-styles";

    style.textContent = `
      .chcm-overlay {
        position: fixed;
        inset: 0;
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.55);
      }

      .chcm-modal {
        box-sizing: border-box;
        width: min(760px, calc(100vw - 40px));
        max-height: calc(100vh - 60px);
        overflow: auto;
        padding: 24px;
        background: #fff;
        border-radius: 4px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
      }

      .chcm-modal h2 {
        margin-top: 0;
      }

      .chcm-course-search {
        box-sizing: border-box;
        width: 100%;
        margin: 8px 0 16px;
      }

      .chcm-course-list,
      .chcm-content-list {
        max-height: 430px;
        overflow: auto;
        margin-bottom: 24px;
        border-top: 1px solid #c7cdd1;
      }

      .chcm-course-row {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 11px 4px;
        border-bottom: 1px solid #c7cdd1;
        cursor: pointer;
      }

      .chcm-course-row input {
        margin-top: 4px;
      }

      .chcm-course-name {
        display: block;
        font-weight: 600;
      }

      .chcm-course-code {
        display: block;
        color: #6b7780;
        font-size: 0.875rem;
      }

      .chcm-content-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        min-height: 44px;
        padding: 8px 4px;
        border-bottom: 1px solid #c7cdd1;
      }

      .chcm-content-label {
        flex: 1;
        min-width: 0;
      }

      .chcm-content-label small {
        color: #6b7780;
      }

      .chcm-choice-buttons {
        display: flex;
        flex: 0 0 auto;
        gap: 8px;
      }

      .chcm-choice {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 0;
        color: #000;
        background: transparent;
        border: 0;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
      }

      .chcm-choice:hover,
      .chcm-choice:focus {
        background: #e8e8e8;
      }

      .chcm-choice.is-selected {
        color: #fff;
        background: #168821;
      }

      .chcm-choice.is-selected:hover,
      .chcm-choice.is-selected:focus {
        color: #fff;
        background: #0b6b15;
      }

      .chcm-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
        margin: 16px 0 20px;
      }

      .chcm-legend span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .chcm-modal-actions {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }

      .chcm-modal-actions-right {
        display: flex;
        gap: 8px;
      }

      .chcm-progress {
        width: 100%;
        height: 18px;
        margin: 12px 0 10px;
        border: 1px solid #c7cdd1;
        border-radius: 999px;
        background: #f5f5f5;
        overflow: hidden;
      }

      .chcm-progress-bar {
        height: 100%;
        width: 0%;
        background: #0b6b15;
        transition: width 160ms ease;
      }

      .chcm-progress-text {
        margin: 0;
        color: #4a5968;
        font-size: 0.95rem;
      }
    `;

    document.head.append(style);
  }

  function openWizard(courses) {
    addWizardStyles();

    const overlay =
      document.createElement("div");

    overlay.className = "chcm-overlay";

    const modal =
      document.createElement("div");

    modal.className = "chcm-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute(
      "aria-labelledby",
      "chcm-wizard-title"
    );

    overlay.append(modal);
    document.body.append(overlay);

    let selectedCourse = null;
    let selectedChapters = new Set();
    let sourceAssignments = [];
    let sourceGroups = [];
    let isBusy = false;
    let isResolved = false;
    let resolveResult = () => {};
    const result = new Promise(
      resolve => {
        resolveResult = resolve;
      }
    );

    function resolveOnce(value) {
      if (isResolved) return;
      isResolved = true;
      resolveResult(value);
    }

    function close(result) {
      overlay.remove();
      resolveOnce(result);
    }

    function renderProgressPage({
      title,
      message,
      current = null,
      total = null
    }) {
      isBusy = true;
      modal.replaceChildren();

      const heading =
        document.createElement("h2");

      heading.id = "chcm-wizard-title";
      heading.textContent = title;

      const instructions =
        document.createElement("p");

      instructions.textContent = message;

      modal.append(heading);

      if (
        Number.isFinite(current) &&
        Number.isFinite(total) &&
        total > 0
      ) {
        const progress =
          document.createElement("div");

        progress.className =
          "chcm-progress";
        progress.setAttribute(
          "role",
          "progressbar"
        );
        progress.setAttribute(
          "aria-valuemin",
          "0"
        );
        progress.setAttribute(
          "aria-valuemax",
          String(total)
        );
        progress.setAttribute(
          "aria-valuenow",
          String(current)
        );
        progress.setAttribute(
          "aria-label",
          "Import progress"
        );

        const progressBar =
          document.createElement("div");

        progressBar.className =
          "chcm-progress-bar";
        progressBar.style.width = `${Math.max(
          0,
          Math.min(
            100,
            (current / total) * 100
          )
        )}%`;

        progress.append(progressBar);
        modal.append(progress);
      }

      const status =
        document.createElement("p");

      status.className =
        "chcm-progress-text";
      status.textContent = message;

      modal.append(status);
    }

    function createFooter({
        backAction,
        nextText,
        nextAction,
        nextDisabled = false
      }) {
        const actions =
          document.createElement("div");

        actions.className =
          "chcm-modal-actions";

        const left =
          document.createElement("div");

        const right =
          document.createElement("div");

        right.className =
          "chcm-modal-actions-right";

        if (backAction) {
          const back = makeButton("Back");

          back.addEventListener(
            "click",
            backAction
          );

          left.append(back);
        }

        const cancel = makeButton("Cancel");

        cancel.addEventListener("click", () => {
          if (isBusy) return;
          close(null);
        });

        const next = makeButton(
          nextText,
          "Button Button--primary"
        );

        next.disabled = nextDisabled;
        next.addEventListener(
          "click",
          nextAction
        );

        right.append(cancel, next);
        actions.append(left, right);

        return {
          actions,
          next
        };
      }

    function renderCoursePage() {
      isBusy = false;
        modal.replaceChildren();

        const title =
          document.createElement("h2");

        title.id = "chcm-wizard-title";
        title.textContent =
          "1. Select source course";

        const instructions =
          document.createElement("p");

        instructions.textContent =
          "Select one cartridge course whose content you want to add.";

        const search =
          document.createElement("input");

        search.type = "search";
        search.className =
          "form-control chcm-course-search";
        search.placeholder = "Search courses…";
        search.setAttribute(
          "aria-label",
          "Search source courses"
        );

        const courseList =
          document.createElement("div");

        courseList.className =
          "chcm-course-list";

        const footer = createFooter({
          nextText: "Next",
          nextDisabled: !selectedCourse,
          nextAction: async () => {
            if (!selectedCourse) return;

            footer.next.disabled = true;
            footer.next.textContent = "Loading…";

            try {
              [
                sourceAssignments,
                sourceGroups
              ] = await Promise.all([
                canvasGet(
                  `/api/v1/courses/${selectedCourse.id}/assignments`
                ),
                canvasGet(
                  `/api/v1/courses/${selectedCourse.id}/assignment_groups`
                )
              ]);

              sourceAssignments =
                sourceAssignments.filter(
                  assignment =>
                    assignment
                      .external_tool_tag_attributes
                      ?.url
                );

              selectedChapters = new Set();
              renderChapterPage();
            } catch (error) {
              console.error(error);

              alert(
                `Could not load source course: ${error.message}`
              );

              footer.next.disabled = false;
              footer.next.textContent = "Next";
            }
          }
        });

        function showCourses() {
          const searchText =
            normalize(search.value);

          courseList.replaceChildren();

          courses
            .filter(course => {
              return (
                !searchText ||
                normalize(course.name).includes(
                  searchText
                ) ||
                normalize(
                  course.course_code
                ).includes(searchText) ||
                String(course.id).includes(
                  searchText
                )
              );
            })
            .forEach(course => {
              const label =
                document.createElement("label");

              label.className =
                "chcm-course-row";

              const radio =
                document.createElement("input");

              radio.type = "radio";
              radio.name =
                "chcm-source-course";
              radio.value = course.id;
              radio.checked =
                selectedCourse?.id === course.id;

              const text =
                document.createElement("span");

              const name =
                document.createElement("span");

              name.className =
                "chcm-course-name";

              name.textContent =
                course.name ||
                `Course ${course.id}`;

              const code =
                document.createElement("span");

              code.className =
                "chcm-course-code";

              code.textContent = [
                course.course_code,
                `ID: ${course.id}`
              ]
                .filter(Boolean)
                .join(" • ");

              text.append(name, code);
              label.append(radio, text);
              courseList.append(label);

              radio.addEventListener(
                "change",
                () => {
                  selectedCourse = course;
                  footer.next.disabled = false;
                }
              );
            });
        }

        search.addEventListener(
          "input",
          showCourses
        );

        modal.append(
          title,
          instructions,
          search,
          courseList,
          footer.actions
        );

        showCourses();
        search.focus();
      }

    function renderChapterPage() {
      isBusy = false;
        modal.replaceChildren();

        const chapters = [
          ...new Set(
            sourceAssignments
              .map(assignment =>
                getChapterNumber(
                  assignment.name
                )
              )
              .filter(
                chapter => chapter !== null
              )
          )
        ].sort((a, b) => a - b);

        const title =
          document.createElement("h2");

        title.id = "chcm-wizard-title";
        title.textContent =
          `2. Select chapters from ${selectedCourse.name}`;

        const instructions =
          document.createElement("p");

        instructions.textContent =
          "Select one or more chapter numbers to bring into the destination course.";

        const chapterList =
          document.createElement("div");

        chapterList.className =
          "chcm-content-list";

        const footer = createFooter({
          backAction: renderCoursePage,
          nextText: "Next",
          nextDisabled:
            selectedChapters.size === 0,
          nextAction: renderContentPage
        });

        chapters.forEach(chapter => {
          const count =
            sourceAssignments.filter(
              assignment =>
                getChapterNumber(
                  assignment.name
                ) === chapter
            ).length;

          const label =
            document.createElement("label");

          label.className =
            "chcm-course-row";

          const checkbox =
            document.createElement("input");

          checkbox.type = "checkbox";
          checkbox.value = chapter;
          checkbox.checked =
            selectedChapters.has(chapter);

          const text =
            document.createElement("span");

          const name =
            document.createElement("span");

          name.className =
            "chcm-course-name";
          name.textContent =
            `Chapter ${chapter}`;

          const detail =
            document.createElement("span");

          detail.className =
            "chcm-course-code";

          detail.textContent =
            `${count} content item${count === 1 ? "" : "s"}`;

          text.append(name, detail);
          label.append(checkbox, text);
          chapterList.append(label);

          checkbox.addEventListener(
            "change",
            () => {
              if (checkbox.checked) {
                selectedChapters.add(chapter);
              } else {
                selectedChapters.delete(
                  chapter
                );
              }

              footer.next.disabled =
                selectedChapters.size === 0;
            }
          );
        });

        if (!chapters.length) {
          const message =
            document.createElement("p");

          message.textContent =
            "No numbered chapter content was found in this course.";

          chapterList.append(message);
        }

        modal.append(
          title,
          instructions,
          chapterList,
          footer.actions
        );
      }

    function renderContentPage() {
      isBusy = false;
        modal.replaceChildren();

        /*
         * Include content from selected chapters.
         * Unmatched content remains available under Other.
         */
        const selectedAssignments =
          sourceAssignments.filter(
            assignment => {
              const chapter =
                getChapterNumber(
                  assignment.name
                );

              return (
                chapter === null ||
                selectedChapters.has(chapter)
              );
            }
          );

        const chapterAssignments = [];
        const typeCounts = new Map();
        const unmatched = [];

        selectedAssignments.forEach(
          assignment => {
            const type = getContentType(
              assignment.name
            );

            if (!type) {
              unmatched.push(assignment);
              return;
            }

            const key = normalize(type);
            chapterAssignments.push({
              assignment,
              key,
              label: type,
              chapter:
                getChapterNumber(
                  assignment.name
                )
            });
            typeCounts.set(
              key,
              (typeCounts.get(key) || 0) + 1
            );
          }
        );

        const typeMap = new Map();
        const chapterSpecific = [];

        chapterAssignments.forEach(
          ({
            assignment,
            key,
            label,
            chapter
          }) => {
            if (
              chapter !== null &&
              typeCounts.get(key) === 1
            ) {
              chapterSpecific.push({
                assignment,
                chapter,
                label
              });
              return;
            }

            if (!typeMap.has(key)) {
              typeMap.set(key, {
                key,
                label,
                count: 0
              });
            }

            typeMap.get(key).count += 1;
          }
        );

        const types = [
          ...typeMap.values()
        ].sort((a, b) =>
          a.label.localeCompare(b.label)
        );

        chapterSpecific.sort((a, b) =>
          (a.chapter ?? 0) -
            (b.chapter ?? 0) ||
          a.label.localeCompare(
            b.label
          )
        );

        unmatched.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        const typeActions = new Map();
        const assignmentActions = new Map();

        const title =
          document.createElement("h2");

        title.id = "chcm-wizard-title";
        title.textContent =
          `3. Select content from ${selectedCourse.name}`;

        const instructions =
          document.createElement("p");

        instructions.textContent =
          "Assignment is selected by default. Link creates only a module link. The unpublish icon means the content will not be pulled in.";

        const legend =
          document.createElement("div");

        legend.className = "chcm-legend";

        legend.innerHTML = `
          <span>
            <i class="icon-assignment" aria-hidden="true"></i>
            Assignment
          </span>
          <span>
            <i class="icon-link" aria-hidden="true"></i>
            Link
          </span>
          <span>
            <i class="icon-unpublish" aria-hidden="true"></i>
            Don't pull in
          </span>
        `;

        function createChoiceRow({
          label,
          detail,
          actionMap,
          actionKey
        }) {
          actionMap.set(
            actionKey,
            "assignment"
          );

          const row =
            document.createElement("div");

          row.className =
            "chcm-content-row";

          const labelElement =
            document.createElement("div");

          labelElement.className =
            "chcm-content-label";

          const name =
            document.createElement("span");

          name.textContent = label;
          labelElement.append(name);

          if (detail) {
            const small =
              document.createElement("small");

            small.textContent = ` ${detail}`;
            labelElement.append(small);
          }

          const choices =
            document.createElement("div");

          choices.className =
            "chcm-choice-buttons";

          [
            {
              action: "assignment",
              icon: "icon-assignment",
              label: "Import as assignment"
            },
            {
              action: "link",
              icon: "icon-link",
              label: "Import as link"
            },
            {
              action: "skip",
              icon: "icon-unpublish",
              label: "Do not pull in"
            }
          ].forEach(choice => {
            const button =
              document.createElement("button");

            button.type = "button";
            button.className =
              "chcm-choice";

            button.title =
              `${choice.label}: ${label}`;

            button.setAttribute(
              "aria-label",
              `${choice.label}: ${label}`
            );

            button.setAttribute(
              "aria-pressed",
              choice.action ===
                "assignment"
                ? "true"
                : "false"
            );

            button.innerHTML =
              `<i class="${choice.icon}" aria-hidden="true"></i>`;

            if (
              choice.action === "assignment"
            ) {
              button.classList.add(
                "is-selected"
              );
            }

            button.addEventListener(
              "click",
              () => {
                actionMap.set(
                  actionKey,
                  choice.action
                );

                choices
                  .querySelectorAll(
                    ".chcm-choice"
                  )
                  .forEach(other => {
                    other.classList.remove(
                      "is-selected"
                    );

                    other.setAttribute(
                      "aria-pressed",
                      "false"
                    );
                  });

                button.classList.add(
                  "is-selected"
                );

                button.setAttribute(
                  "aria-pressed",
                  "true"
                );
              }
            );

            choices.append(button);
          });

          row.append(
            labelElement,
            choices
          );

          return row;
        }

        const typeHeading =
          document.createElement("h3");

        typeHeading.textContent =
          "Chapter content types";

        const typeList =
          document.createElement("div");

        typeList.className =
          "chcm-content-list";

        types.forEach(type => {
          typeList.append(
            createChoiceRow({
              label: type.label,
              detail: `(${type.count})`,
              actionMap: typeActions,
              actionKey: type.key
            })
          );
        });

        modal.append(
          title,
          instructions,
          legend
        );

        if (types.length) {
          modal.append(
            typeHeading,
            typeList
          );
        }

        if (chapterSpecific.length) {
          const chapterHeading =
            document.createElement("h3");

          chapterHeading.textContent =
            `Chapter specific (${chapterSpecific.length})`;

          const chapterInstructions =
            document.createElement("p");

          chapterInstructions.textContent =
            "These items only appear in one selected chapter, so choose them individually.";

          const chapterList =
            document.createElement("div");

          chapterList.className =
            "chcm-content-list";

          chapterSpecific.forEach(
            ({
              assignment,
              chapter
            }) => {
              chapterList.append(
                createChoiceRow({
                  label:
                    assignment.name,
                  detail:
                    chapter === null
                      ? null
                      : `(Chapter ${chapter})`,
                  actionMap:
                    assignmentActions,
                  actionKey: Number(
                    assignment.id
                  )
                })
              );
            }
          );

          modal.append(
            chapterHeading,
            chapterInstructions,
            chapterList
          );
        }

        if (unmatched.length) {
          const otherHeading =
            document.createElement("h3");

          otherHeading.textContent =
            `Other (${unmatched.length})`;

          const otherInstructions =
            document.createElement("p");

          otherInstructions.textContent =
            "These items did not match “Chapter/Ch <number> <content type>.” Choose each one individually.";

          const otherList =
            document.createElement("div");

          otherList.className =
            "chcm-content-list";

          unmatched.forEach(assignment => {
            otherList.append(
              createChoiceRow({
                label: assignment.name,
                detail: null,
                actionMap:
                  assignmentActions,
                actionKey: Number(
                  assignment.id
                )
              })
            );
          });

          modal.append(
            otherHeading,
            otherInstructions,
            otherList
          );
        }

        const footer = createFooter({
          backAction: renderChapterPage,
          nextText: "Add selected content",
          nextAction: () => {
            resolveOnce({
              sourceCourse: selectedCourse,
              assignments:
                selectedAssignments,
              groups: sourceGroups,
              selections: {
                typeActions,
                assignmentActions
              }
            });
          }
        });

        modal.append(footer.actions);
        footer.next.focus();
      }

    overlay.addEventListener(
      "click",
      event => {
        if (
          event.target === overlay &&
          !isBusy
        ) {
          close(null);
        }
      }
    );

    modal.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Escape" &&
          !isBusy
        ) {
          close(null);
        }
      }
    );

    renderCoursePage();

    return {
      result,
      showProgress(
        current,
        total
      ) {
        renderProgressPage({
          title: "Adding content",
          message:
            `Do not leave this page or your progress will be lost. ${current} of ${total} processed.`,
          current,
          total
        });
      },
      close() {
        close(null);
      }
    };
  }

  async function createModule(
    name,
    published
  ) {
    const module = await canvasWrite(
      `/api/v1/courses/${destinationCourseId}/modules`,
      "POST",
      form({
        "module[name]": name
      })
    );

    if (published) {
      await canvasWrite(
        `/api/v1/courses/${destinationCourseId}/modules/${module.id}`,
        "PUT",
        form({
          "module[published]": true
        })
      );
    }

    return module;
  }

  async function createAssignmentGroup(
    name
  ) {
    return canvasWrite(
      `/api/v1/courses/${destinationCourseId}/assignment_groups`,
      "POST",
      form({
        name
      })
    );
  }

  async function createAssignment(
    source,
    assignmentGroupId
  ) {
    return canvasWrite(
      `/api/v1/courses/${destinationCourseId}/assignments`,
      "POST",
      form({
        "assignment[name]": source.name,
        "assignment[description]":
          source.description || "",
        "assignment[position]":
          source.position,
        "assignment[assignment_group_id]":
          assignmentGroupId,
        "assignment[submission_types][]":
          "external_tool",
        "assignment[external_tool_tag_attributes][url]":
          source.external_tool_tag_attributes
            .url,
        "assignment[external_tool_tag_attributes][new_tab]":
          source.external_tool_tag_attributes
            .new_tab ?? true,
        "assignment[points_possible]":
          source.points_possible ?? 0,
        "assignment[grading_type]":
          source.grading_type || "points",
        "assignment[omit_from_final_grade]":
          source.omit_from_final_grade ??
          false,
        "assignment[hide_in_gradebook]":
          source.hide_in_gradebook ?? false,
        "assignment[published]":
          source.published === true
      })
    );
  }

  async function updateAssignment(
    assignmentId,
    source,
    assignmentGroupId
  ) {
    return canvasWrite(
      `/api/v1/courses/${destinationCourseId}/assignments/${assignmentId}`,
      "PUT",
      form({
        "assignment[name]": source.name,
        "assignment[description]":
          source.description || "",
        "assignment[position]":
          source.position,
        "assignment[assignment_group_id]":
          assignmentGroupId,
        "assignment[submission_types][]":
          "external_tool",
        "assignment[external_tool_tag_attributes][url]":
          source.external_tool_tag_attributes
            .url,
        "assignment[external_tool_tag_attributes][new_tab]":
          source.external_tool_tag_attributes
            .new_tab ?? true,
        "assignment[points_possible]":
          source.points_possible ?? 0,
        "assignment[grading_type]":
          source.grading_type || "points",
        "assignment[omit_from_final_grade]":
          source.omit_from_final_grade ??
          false,
        "assignment[hide_in_gradebook]":
          source.hide_in_gradebook ?? false,
        "assignment[published]":
          source.published === true
      })
    );
  }

  async function deleteAssignment(
    assignmentId
  ) {
    return canvasWrite(
      `/api/v1/courses/${destinationCourseId}/assignments/${assignmentId}`,
      "DELETE"
    );
  }

  async function getDestinationToolId(
    launchUrl
  ) {
    const query = new URLSearchParams({
      url: launchUrl
    });

    const tool = await canvasGet(
      `/api/v1/courses/${destinationCourseId}/external_tools/sessionless_launch?${query}`
    );

    return tool.id;
  }

  async function createModuleItem({
    module,
    type,
    title,
    contentId,
    externalUrl,
    position,
    published,
    newTab
  }) {
    const values = {
      "module_item[title]": title,
      "module_item[type]": type,
      "module_item[content_id]":
        contentId,
      "module_item[position]":
        position,
      "module_item[indent]": 0
    };

    if (type === "ExternalTool") {
      values[
        "module_item[external_url]"
      ] = externalUrl;

      values[
        "module_item[new_tab]"
      ] = newTab ?? true;
    }

    const item = await canvasWrite(
      `/api/v1/courses/${destinationCourseId}/modules/${module.id}/items`,
      "POST",
      form(values)
    );

    await canvasWrite(
      `/api/v1/courses/${destinationCourseId}/modules/${module.id}/items/${item.id}`,
      "PUT",
      form({
        "module_item[published]":
          published === true
      })
    );

    return item;
  }

  async function deleteModuleItem(
    moduleId,
    itemId
  ) {
    return canvasWrite(
      `/api/v1/courses/${destinationCourseId}/modules/${moduleId}/items/${itemId}`,
      "DELETE"
    );
  }

  async function getDeletedAssignments() {
    const html = await canvasAction(
      `/courses/${destinationCourseId}/undelete`,
      "GET"
    );

    const doc = new DOMParser().parseFromString(
      html,
      "text/html"
    );

    return [
      ...doc.querySelectorAll(
        'a[href*="/undelete/assignment_"], form[action*="/undelete/assignment_"]'
      )
    ]
      .map(element => {
        const source =
          element.getAttribute("action") ||
          element.getAttribute("href") ||
          "";

        const match = source.match(
          /\/undelete\/assignment_(\d+)/
        );

        if (!match) return null;

        const container =
          element.closest(
            "li, tr, .item, .ic-Table__row"
          ) || element.parentElement;

        const name = String(
          container?.textContent ||
            element.textContent ||
            ""
        )
          .replace(/\brestore\b/gi, "")
          .replace(/\s+/g, " ")
          .trim();

        return {
          id: Number(match[1]),
          name,
          restorePath: source
        };
      })
      .filter(Boolean);
  }

  async function restoreDeletedAssignment(
    restorePath
  ) {
    await canvasAction(
      restorePath,
      "POST"
    );
  }

  async function importContent(
    wizardResult,
    wizard
  ) {
    const {
      assignments,
      groups,
      selections
    } = wizardResult;

    const sourceGroupsById = new Map(
      groups.map(group => [
        Number(group.id),
        group
      ])
    );

    const selected = assignments.filter(
      assignment =>
        getAction(
          assignment,
          selections
        ) !== "skip"
    );

    const [
      destinationModules,
      destinationGroups,
      destinationAssignments
    ] = await Promise.all([
      canvasGet(
        `/api/v1/courses/${destinationCourseId}/modules`
      ),
      canvasGet(
        `/api/v1/courses/${destinationCourseId}/assignment_groups`
      ),
      canvasGet(
        `/api/v1/courses/${destinationCourseId}/assignments`
      )
    ]);

    const destinationModuleItems =
      (
        await Promise.all(
          destinationModules.map(
            async module =>
              (
                await canvasGet(
                  `/api/v1/courses/${destinationCourseId}/modules/${module.id}/items`
                )
              ).map(item => ({
                ...item,
                module_id: module.id
              }))
          )
        )
      ).flat();

    const modulesByName = new Map(
      destinationModules.map(module => [
        normalize(module.name),
        module
      ])
    );

    const groupsByName = new Map(
      destinationGroups.map(group => [
        normalize(group.name),
        group
      ])
    );

    const assignmentsByKey = new Map();
    const assignmentsByUrl = new Map();
    const linksByUrl = new Map();
    const moduleItemsById = new Map(
      destinationModules.map(module => [
        module.id,
        destinationModuleItems.filter(
          item =>
            Number(item.module_id) ===
            Number(module.id)
        )
      ])
    );
    const toolIdsByUrl = new Map();
    let deletedAssignmentsPromise = null;

    function getAssignmentKey(
      assignmentName,
      launchUrl
    ) {
      return [
        normalize(assignmentName),
        normalize(launchUrl)
      ].join("|");
    }

    function pushByKey(map, key, value) {
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key).push(value);
    }

    function removeByKey(
      map,
      key,
      predicate
    ) {
      if (!map.has(key)) return;

      const next = map
        .get(key)
        .filter(item => !predicate(item));

      if (next.length) {
        map.set(key, next);
      } else {
        map.delete(key);
      }
    }

    function indexAssignment(
      assignment
    ) {
      const normalizedUrl =
        normalize(
          assignment
            .external_tool_tag_attributes
            ?.url
        );

      if (!normalizedUrl) return;

      assignmentsByKey.set(
        getAssignmentKey(
          assignment.name,
          normalizedUrl
        ),
        assignment
      );

      pushByKey(
        assignmentsByUrl,
        normalizedUrl,
        assignment
      );
    }

    function unindexAssignment(
      assignment
    ) {
      const normalizedUrl =
        normalize(
          assignment
            .external_tool_tag_attributes
            ?.url
        );

      if (!normalizedUrl) return;

      assignmentsByKey.delete(
        getAssignmentKey(
          assignment.name,
          normalizedUrl
        )
      );

      removeByKey(
        assignmentsByUrl,
        normalizedUrl,
        item =>
          Number(item.id) ===
          Number(assignment.id)
      );
    }

    function indexLink(item) {
      const normalizedUrl =
        normalize(item.external_url);

      if (!normalizedUrl) return;

      pushByKey(
        linksByUrl,
        normalizedUrl,
        item
      );
    }

    function unindexLink(item) {
      const normalizedUrl =
        normalize(item.external_url);

      if (!normalizedUrl) return;

      removeByKey(
        linksByUrl,
        normalizedUrl,
        current =>
          Number(current.id) ===
            Number(item.id) &&
          Number(current.module_id) ===
            Number(item.module_id)
      );
    }

    destinationAssignments.forEach(
      indexAssignment
    );
    destinationModuleItems
      .filter(
        item => item.type === "ExternalTool"
      )
      .forEach(indexLink);

    async function getModuleItems(
      moduleId
    ) {
      return moduleItemsById.get(
        moduleId
      ) || [];
    }

    async function getDeletedAssignmentsCached() {
      if (!deletedAssignmentsPromise) {
        deletedAssignmentsPromise =
          getDeletedAssignments();
      }

      return deletedAssignmentsPromise;
    }

    async function findRestorableAssignment(
      source
    ) {
      const deletedAssignments =
        await getDeletedAssignmentsCached();
      const sourceName = normalize(
        source.name
      );

      return (
        deletedAssignments.find(
          assignment =>
            normalize(
              assignment.name
            ) === sourceName
        ) || null
      );
    }

    function removeDeletedAssignmentCandidate(
      deletedAssignmentId
    ) {
      if (!deletedAssignmentsPromise) return;

      deletedAssignmentsPromise =
        deletedAssignmentsPromise.then(
          deletedAssignments =>
            deletedAssignments.filter(
              assignment =>
                Number(assignment.id) !==
                Number(
                  deletedAssignmentId
                )
            )
        );
    }

    async function ensureModule(
      sourceGroup
    ) {
      const key = normalize(
        sourceGroup.name
      );

      let module =
        modulesByName.get(key);

      if (!module) {
        const shouldPublish =
          selected.some(item => {
            return (
              Number(
                item.assignment_group_id
              ) ===
                Number(sourceGroup.id) &&
              item.published === true
            );
          });

        module = await createModule(
          sourceGroup.name,
          shouldPublish
        );

        modulesByName.set(key, module);
        moduleItemsById.set(
          module.id,
          []
        );
      }

      return module;
    }

    async function ensureAssignmentGroup(
      sourceGroup
    ) {
      const key = normalize(
        sourceGroup.name
      );

      let group =
        groupsByName.get(key);

      if (!group) {
        group =
          await createAssignmentGroup(
            sourceGroup.name
          );

        groupsByName.set(key, group);
      }

      return group;
    }

    const addedAssignments = [];
    const addedLinks = [];
    const restoredAssignments = [];
    const replacedAssignments = [];
    const replacedLinks = [];
    const skipped = [];
    const failed = [];

    for (
      let index = 0;
      index < assignments.length;
      index++
    ) {
      const source = assignments[index];

      const action = getAction(
        source,
        selections
      );

      wizard.showProgress(
        index + 1,
        assignments.length
      );

      try {
        if (action === "skip") {
          skipped.push(source.name);
          continue;
        }

        const sourceGroup =
          sourceGroupsById.get(
            Number(
              source.assignment_group_id
            )
          );

        if (!sourceGroup) {
          throw new Error(
            "Source assignment group not found"
          );
        }

        const module =
          await ensureModule(
            sourceGroup
          );

        const moduleItems =
          await getModuleItems(
            module.id
          );

        const launchUrl =
          source.external_tool_tag_attributes
            .url;
        const normalizedLaunchUrl =
          normalize(launchUrl);
        const existingAssignments =
          normalizedLaunchUrl
            ? [
                ...(
                  assignmentsByUrl.get(
                    normalizedLaunchUrl
                  ) || []
                )
              ]
            : [];
        const existingLinks =
          normalizedLaunchUrl
            ? [
                ...(
                  linksByUrl.get(
                    normalizedLaunchUrl
                  ) || []
                )
              ]
            : [];

        if (action === "link") {
          if (existingLinks.length) {
            skipped.push(source.name);
            continue;
          }

          for (const assignment of existingAssignments) {
            await deleteAssignment(
              assignment.id
            );

            unindexAssignment(
              assignment
            );
            replacedAssignments.push(
              source.name
            );

            moduleItemsById.forEach(
              items => {
                for (
                  let itemIndex =
                    items.length - 1;
                  itemIndex >= 0;
                  itemIndex--
                ) {
                  const item =
                    items[itemIndex];

                  if (
                    item.type ===
                      "Assignment" &&
                    Number(
                      item.content_id
                    ) ===
                      Number(
                        assignment.id
                      )
                  ) {
                    items.splice(
                      itemIndex,
                      1
                    );
                  }
                }
              }
            );
          }

          let toolId =
            toolIdsByUrl.get(
              launchUrl
            );

          if (!toolId) {
            toolId =
              await getDestinationToolId(
                launchUrl
              );

            toolIdsByUrl.set(
              launchUrl,
              toolId
            );
          }

          const item =
            await createModuleItem({
              module,
              type: "ExternalTool",
              title: source.name,
              contentId: toolId,
              externalUrl: launchUrl,
              position:
                source.position,
              published:
                source.published ===
                true,
              newTab:
                source
                  .external_tool_tag_attributes
                  .new_tab ?? true
            });

          item.module_id = module.id;
          moduleItems.push(item);
          indexLink(item);

          addedLinks.push(source.name);
          continue;
        }

        if (existingAssignments.length) {
          skipped.push(source.name);
          continue;
        }

        for (const link of existingLinks) {
          await deleteModuleItem(
            link.module_id,
            link.id
          );

          const items =
            await getModuleItems(
              link.module_id
            );
          const itemIndex =
            items.findIndex(
              item =>
                Number(item.id) ===
                Number(link.id)
            );

          if (itemIndex >= 0) {
            items.splice(
              itemIndex,
              1
            );
          }

          unindexLink(link);
          replacedLinks.push(
            source.name
          );
        }

        const destinationGroup =
          await ensureAssignmentGroup(
            sourceGroup
          );

        const assignmentKey = [
          normalize(source.name),
          launchUrl
        ].join("|");

        let assignment =
          assignmentsByKey.get(
            assignmentKey
          );

        if (!assignment) {
          const restorableAssignment =
            await findRestorableAssignment(
              source
            );

          if (restorableAssignment) {
            await restoreDeletedAssignment(
              restorableAssignment.restorePath
            );

            removeDeletedAssignmentCandidate(
              restorableAssignment.id
            );

            assignment =
              await updateAssignment(
                restorableAssignment.id,
                source,
                destinationGroup.id
              );

            restoredAssignments.push(
              source.name
            );
          } else {
            assignment =
              await createAssignment(
                source,
                destinationGroup.id
              );
          }

          indexAssignment(
            assignment
          );
        }

        const existingItem =
          moduleItems.find(item => {
            return (
              item.type ===
                "Assignment" &&
              Number(item.content_id) ===
                Number(assignment.id)
            );
          });

        if (!existingItem) {
          const item =
            await createModuleItem({
              module,
              type: "Assignment",
              title: assignment.name,
              contentId:
                assignment.id,
              position:
                source.position,
              published:
                assignment.published ===
                true
            });

          moduleItems.push(item);
        }

        addedAssignments.push(
          source.name
        );
      } catch (error) {
        console.error(
          `Failed to add "${source.name}"`,
          error
        );

        failed.push({
          assignment: source.name,
          error: error.message
        });
      }
    }

    console.table(
      addedAssignments.map(name => ({
        assignment: name
      }))
    );

    console.table(
      addedLinks.map(name => ({
        link: name
      }))
    );

    console.table(
      restoredAssignments.map(name => ({
        restoredAssignment: name
      }))
    );

    console.table(
      replacedAssignments.map(name => ({
        replacedAssignmentWithLink:
          name
      }))
    );

    console.table(
      replacedLinks.map(name => ({
        replacedLinkWithAssignment:
          name
      }))
    );

    console.table(failed);

    alert(
      [
        `Assignments added: ${addedAssignments.length}`,
        `Links added: ${addedLinks.length}`,
        `Assignments restored: ${restoredAssignments.length}`,
        `Not pulled in: ${skipped.length}`,
        `Failed: ${failed.length}`
      ].join("\n")
    );
  }

  async function run(button) {
    const originalHtml = button.innerHTML;

    button.disabled = true;
    button.textContent =
      "Loading courses…";

    try {
      const courses = await canvasGet(
        `/api/v1/accounts/${sourceAccountId}/courses?state[]=created&state[]=claimed&state[]=available`
      );

      courses.sort((a, b) =>
        String(a.name || "").localeCompare(
          String(b.name || "")
        )
      );

      button.disabled = false;
      button.innerHTML = originalHtml;

      const wizard = openWizard(courses);
      const wizardResult =
        await wizard.result;

      if (!wizardResult) return;

      button.disabled = true;

      await importContent(
        wizardResult,
        wizard
      );

      wizard.close();

      location.reload();
    } catch (error) {
      console.error(
        "CHCM content import stopped",
        error
      );

      alert(
        `Import stopped: ${error.message}`
      );
    } finally {
      button.disabled = false;
      button.innerHTML = originalHtml;
    }
  }

  function addButton() {
    if (
      document.getElementById(
        buttonId
      )
    ) {
      return;
    }

    const courseStatus =
      document.querySelector(
        "#course_show_secondary #course_status"
      );

    if (!courseStatus) return;

    const button =
      document.createElement("button");

    button.id = buttonId;
    button.type = "button";
    button.className =
      "btn button-sidebar-wide";

    button.innerHTML =
      '<i class="icon-import" aria-hidden="true"></i> Import CHCM Content';

    button.addEventListener(
      "click",
      () => run(button)
    );

    courseStatus.insertAdjacentElement(
      "afterend",
      button
    );
  }

  addButton();
})();
