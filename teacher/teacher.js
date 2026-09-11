"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    // Teacher dashboard access guard.
    // The student login page sets this flag after admin/admin123 login.
    if (localStorage.getItem("teacherAuthenticated") !== "true") {
        window.location.href = "../";
        return;
    }

    // static-bridge.js fetches the saved site data from the server
    // asynchronously. Without waiting here, this script used to read
    // localStorage (groups/students/join requests/etc.) before that
    // fetch resolved, so the dashboard rendered with empty stats on
    // first load. Wait for the sync to finish before reading anything.
    if (window.storageReady) {
        try {
            await window.storageReady;
        } catch (e) {
            // Ignore sync errors and fall back to whatever is
            // already in localStorage rather than blocking forever.
        }
    }

    /* =========================================
       STORAGE
    ========================================= */

    const STORAGE = {

        groups: "teacherGroups",
        students: "teacherStudents",
        requests: "teacherJoinRequests",

        lessons: "teacherLessons",
        tests: "teacherTests",
        files: "teacherFiles",

        classes: "teacherClasses",

        notifications: "teacherNotifications",

        payments: "teacherPayments",

        chats: "teacherChats",
        groupChats: "teacherGroupChats",

        theme: "teacherTheme",
        color: "teacherColor"

    };


    /* =========================================
       HELPERS
    ========================================= */

    const $ = (
        selector,
        parent = document
    ) => parent.querySelector(selector);


    const $$ = (
        selector,
        parent = document
    ) => [...parent.querySelectorAll(selector)];


    function load(
        key,
        fallback = []
    ) {

        try {

            const value =
                localStorage.getItem(key);

            return value === null
                ? fallback
                : JSON.parse(value);

        } catch {

            return fallback;

        }

    }


    function save(
        key,
        value
    ) {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    }


    function uid(
        prefix = "id"
    ) {

        return `${prefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 9)}`;

    }


    function escapeHTML(
        value = ""
    ) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    function formatDate(
        value
    ) {

        if (!value) {
            return "-";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "-";

        }


        return date.toLocaleDateString(
            "ar-EG",
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

    }


    /* =========================================
       DATA
    ========================================= */

    let groups =
        load(STORAGE.groups);

    let students =
        load(STORAGE.students);

    let requests =
        load(STORAGE.requests);

    let lessons =
        load(STORAGE.lessons);

    let tests =
        load(STORAGE.tests);

    let files =
        load(STORAGE.files);

    let classes =
        load(STORAGE.classes);

    let notifications =
        load(STORAGE.notifications);

    let payments =
        load(STORAGE.payments);

    let chats =
        load(STORAGE.chats);

    let groupChats =
        load(STORAGE.groupChats);


    let currentGroupId = null;

    let currentApprovalRequestId = null;

    let currentChatStudentId = null;

    let currentUploadGroupId = null;

    let selectedLessonVideo = null;


    /* =========================================
       PAGE LABELS
    ========================================= */

    const pageLabels = {

        overview: "الرئيسية",

        joinRequests: "طلبات الانضمام",

        students: "الطلاب",

        groups: "المجموعات",

        lessons: "الدروس",

        tests: "الاختبارات",

        files: "الملفات والمذكرات",

        classes: "الحصص الأونلاين",

        notifications: "الإشعارات",

        chat: "المحادثات",

        payments: "المدفوعات",

        groupDetail: "تفاصيل المجموعة",

        settings: "الإعدادات"

    };


    const pageIds =
        Object.keys(pageLabels);


    /* =========================================
       NAVIGATION
    ========================================= */

    function showPage(
        pageName
    ) {

        pageIds.forEach(
            id => {

                const page =
                    document.getElementById(id);

                if (!page) {
                    return;
                }

                page.hidden = true;

                page.classList.remove(
                    "active",
                    "show"
                );

            }
        );


        const target =
            document.getElementById(
                pageName
            );


        if (target) {

            target.hidden = false;

            target.classList.add(
                "active",
                "show"
            );

        }


        $$(".nav-item")
            .forEach(
                button => {

                    button.classList.toggle(
                        "active",
                        button.dataset.page ===
                            pageName
                    );

                }
            );


        const label =
            $("#currentPageLabel");


        if (label) {

            label.textContent =
                pageLabels[pageName]
                || "لوحة التحكم";

        }


        closeSidebar();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    $$(".nav-item")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        showPage(
                            button.dataset.page
                        );

                    }
                );

            }
        );


    $$(".quick-action, .text-button[data-page]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        showPage(
                            button.dataset.page
                        );

                    }
                );

            }
        );


    /* =========================================
       SIDEBAR
    ========================================= */

    const sidebar =
        $("#teacherSidebar");

    const overlay =
        $("#sidebarOverlay");


    function openSidebar() {

        sidebar?.classList.add(
            "open"
        );

        overlay?.classList.add(
            "show"
        );

    }


    function closeSidebar() {

        sidebar?.classList.remove(
            "open"
        );

        overlay?.classList.remove(
            "show"
        );

    }


    $("#teacherMobileMenu")
        ?.addEventListener(
            "click",
            openSidebar
        );


    $("#sidebarClose")
        ?.addEventListener(
            "click",
            closeSidebar
        );


    overlay?.addEventListener(
        "click",
        closeSidebar
    );


    /* =========================================
       THEME
    ========================================= */

    function getTheme() {

        const theme =
            localStorage.getItem(
                STORAGE.theme
            );


        return theme === "dark"
            ? "dark"
            : "light";

    }


    function setTheme(
        theme
    ) {

        const selected =
            theme === "dark"
                ? "dark"
                : "light";


        document.documentElement
            .setAttribute(
                "data-theme",
                selected
            );


        localStorage.setItem(
            STORAGE.theme,
            selected
        );


        updateThemeUI();

    }


    function updateThemeUI() {

        const theme =
            getTheme();


        const button =
            $("#themeButton");


        if (button) {

            button.innerHTML =
                theme === "dark"
                    ? '<i class="fa-solid fa-sun"></i>'
                    : '<i class="fa-solid fa-palette"></i>';

            button.title =
                theme === "dark"
                    ? "التبديل إلى الخلفية البيضاء"
                    : "التبديل إلى الخلفية السوداء";

        }


        $$(".appearance-option")
            .forEach(
                option => {

                    option.classList.toggle(
                        "active",
                        option.dataset.theme ===
                            theme
                    );

                }
            );

    }


    $("#themeButton")
        ?.addEventListener(
            "click",
            () => {

                setTheme(
                    getTheme() === "dark"
                        ? "light"
                        : "dark"
                );

            }
        );


    $$(".appearance-option")
        .forEach(
            option => {

                option.addEventListener(
                    "click",
                    () => {

                        setTheme(
                            option.dataset.theme
                        );


                        showToast(
                            option.dataset.theme ===
                                "dark"
                                ? "تم تفعيل الخلفية السوداء"
                                : "تم تفعيل الخلفية البيضاء"
                        );

                    }
                );

            }
        );


    /* =========================================
       PRIMARY COLOR
    ========================================= */

    const COLORS = [
        "purple",
        "turquoise",
        "green",
        "blue",
        "red"
    ];


    function getColor() {

        const color =
            localStorage.getItem(
                STORAGE.color
            );


        return COLORS.includes(
            color
        )
            ? color
            : "purple";

    }


    function setColor(
        color
    ) {

        if (!COLORS.includes(color)) {
            color = "purple";
        }


        document.documentElement
            .setAttribute(
                "data-color",
                color
            );


        localStorage.setItem(
            STORAGE.color,
            color
        );


        updateColorUI();

    }


    function updateColorUI() {

        const color =
            getColor();


        $$(".color-option")
            .forEach(
                option => {

                    option.classList.toggle(
                        "active",
                        option.dataset.color ===
                            color
                    );

                }
            );

    }


    const colorNames = {

        purple: "البنفسجي",
        turquoise: "التركوازي",
        green: "الأخضر",
        blue: "الأزرق",
        red: "الأحمر"

    };


    $$(".color-option")
        .forEach(
            option => {

                option.addEventListener(
                    "click",
                    () => {

                        const color =
                            option.dataset.color;


                        setColor(color);


                        showToast(
                            `تم اختيار اللون ${colorNames[color]}`
                        );

                    }
                );

            }
        );


    /* =========================================
       TOAST
    ========================================= */

    let toastTimer = null;


    function showToast(
        message
    ) {

        const toast =
            $("#teacherToast");

        const text =
            $("#teacherToastMessage");


        if (
            !toast ||
            !text
        ) {
            return;
        }


        text.textContent =
            message;


        toast.classList.add(
            "show"
        );


        clearTimeout(
            toastTimer
        );


        toastTimer =
            setTimeout(
                () => {

                    toast.classList.remove(
                        "show"
                    );

                },
                3200
            );

    }


    $(".toast-close")
        ?.addEventListener(
            "click",
            () => {

                $("#teacherToast")
                    ?.classList.remove(
                        "show"
                    );

            }
        );


    /* =========================================
       MODALS
    ========================================= */

    function openModal(
        id
    ) {

        const modal =
            document.getElementById(id);


        if (!modal) {
            return;
        }


        modal.classList.add(
            "open"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    function closeModal(
        id
    ) {

        const modal =
            document.getElementById(id);


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "open"
        );


        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    $$(".modal")
        .forEach(
            modal => {

                modal.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target.classList
                                .contains(
                                    "modal-backdrop"
                                )
                        ) {

                            closeModal(
                                modal.id
                            );

                        }


                        if (
                            event.target.closest(
                                "[data-close-modal]"
                            )
                        ) {

                            closeModal(
                                modal.id
                            );

                        }


                        if (
                            event.target.closest(
                                ".modal-cancel"
                            )
                        ) {

                            closeModal(
                                modal.id
                            );

                        }

                    }
                );

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {
                return;
            }


            $$(".modal.open")
                .forEach(
                    modal =>
                        closeModal(
                            modal.id
                        )
                );

        }
    );


    /* =========================================
       GROUP HELPERS
    ========================================= */

    function groupName(
        groupId
    ) {

        const group =
            groups.find(
                item =>
                    item.id === groupId
            );


        return group
            ? group.name
            : "بدون مجموعة";

    }


    function populateGroupSelect(
        selector,
        selectedId = "",
        includeAll = false
    ) {

        const select =
            $(selector);


        if (!select) {
            return;
        }


        let html = "";


        if (includeAll) {

            html += `
                <option value="">
                    كل المجموعات
                </option>
            `;

        }


        groups.forEach(
            group => {

                html += `
                    <option
                        value="${escapeHTML(group.id)}"
                        ${
                            group.id === selectedId
                                ? "selected"
                                : ""
                        }
                    >
                        ${escapeHTML(group.name)}
                        — ${escapeHTML(group.grade || "")}
                    </option>
                `;

            }
        );


        select.innerHTML =
            html;

    }


    function populateNotificationTargets() {

        const select =
            $("#notificationTarget");


        if (!select) {
            return;
        }


        select.innerHTML = `
            <option value="all">
                جميع الطلاب
            </option>

            ${
                groups.map(
                    group => `
                        <option value="${escapeHTML(group.id)}">
                            مجموعة: ${escapeHTML(group.name)}
                        </option>
                    `
                ).join("")
            }
        `;

    }


    /* =========================================
       GRADES
    ========================================= */

    const grades = {

        "ابتدائي": [
            "سادسة ابتدائي"
        ],

        "إعدادي": [
            "أولى إعدادي",
            "ثانية إعدادي",
            "ثالثة إعدادي"
        ],

        "ثانوي": [
            "أولى ثانوي"
        ]

    };


    function updateGradeOptions() {

        const stage =
            $("#groupStage")?.value;


        const select =
            $("#groupGrade");


        if (!select) {
            return;
        }


        const options =
            grades[stage] || [];


        select.innerHTML = `
            <option value="">
                اختاري الصف
            </option>

            ${
                options.map(
                    grade => `
                        <option value="${escapeHTML(grade)}">
                            ${escapeHTML(grade)}
                        </option>
                    `
                ).join("")
            }
        `;

    }


    $("#groupStage")
        ?.addEventListener(
            "change",
            updateGradeOptions
        );


    /* =========================================
       OVERVIEW
    ========================================= */

    function renderOverview() {

        $("#totalStudents")
            .textContent =
            students.length;


        $("#totalJoinRequests")
            .textContent =
            requests.filter(
                request =>
                    request.status !== "approved" &&
                    request.status !== "rejected"
            ).length;


        $("#totalGroups")
            .textContent =
            groups.length;


        $("#totalLessons")
            .textContent =
            lessons.length;


        $("#totalTests")
            .textContent =
            tests.length;


        const latest =
            $("#latestRequests");


        if (!latest) {
            return;
        }


        const list =
            requests
                .filter(
                    request =>
                        request.status !==
                            "approved"
                )
                .slice(-4)
                .reverse();


        if (!list.length) {

            latest.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid fa-inbox"></i>
                    </div>

                    <h3>
                        لا توجد طلبات
                    </h3>

                    <p>
                        ستظهر الطلبات الجديدة هنا.
                    </p>

                </div>
            `;

            return;

        }


        latest.innerHTML =
            list.map(
                request => `

                    <div class="request-card">

                        <div class="request-avatar">
                            <i class="fa-solid fa-user"></i>
                        </div>

                        <div class="request-info">

                            <strong>
                                ${escapeHTML(request.name)}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    request.grade ||
                                    request.stage ||
                                    ""
                                )}
                            </span>

                        </div>

                        <button
                            type="button"
                            class="primary-button small"
                            data-approve-request="${escapeHTML(request.id)}"
                        >
                            مراجعة
                        </button>

                    </div>

                `
            ).join("");

    }


    /* =========================================
       GROUPS
    ========================================= */

    function renderGroups() {

        const container =
            $("#groupsGrid");


        if (!container) {
            return;
        }


        if (!groups.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid fa-users"></i>
                    </div>

                    <h3>
                        لا توجد مجموعات
                    </h3>

                    <p>
                        ابدئي بإنشاء أول مجموعة.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML =
            groups.map(
                group => {

                    const count =
                        students.filter(
                            student =>
                                student.groupId ===
                                group.id
                        ).length;


                    return `
                        <article class="group-card">

                            <div class="group-card-header">

                                <div class="group-card-icon">
                                    <i class="fa-solid fa-users"></i>
                                </div>

                            </div>

                            <h3>
                                ${escapeHTML(group.name)}
                            </h3>


                            <div class="group-card-meta">

                                <div>
                                    المرحلة:
                                    ${escapeHTML(
                                        group.stage || "-"
                                    )}
                                </div>

                                <div>
                                    الصف:
                                    ${escapeHTML(
                                        group.grade || "-"
                                    )}
                                </div>

                                <div>
                                    السنة:
                                    ${escapeHTML(
                                        group.year || "-"
                                    )}
                                </div>

                            </div>


                            <div class="group-card-footer">

                                <span>
                                    ${count} طالب
                                </span>


                                <button
                                    type="button"
                                    class="primary-button small"
                                    data-open-group="${escapeHTML(group.id)}"
                                >
                                    فتح المجموعة
                                </button>

                            </div>

                        </article>
                    `;

                }
            ).join("");

    }


    $("#createGroupButton")
        ?.addEventListener(
            "click",
            () => {

                $("#groupForm")?.reset();

                updateGradeOptions();

                openModal(
                    "groupModal"
                );

            }
        );


    $("#groupForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const name =
                    $("#groupName")
                        .value
                        .trim();


                const stage =
                    $("#groupStage")
                        .value;


                const grade =
                    $("#groupGrade")
                        .value;


                const year =
                    $("#groupYear")
                        .value
                        .trim();


                if (
                    !name ||
                    !stage ||
                    !grade
                ) {

                    showToast(
                        "أكملي بيانات المجموعة."
                    );

                    return;

                }


                groups.push({

                    id:
                        uid("group"),

                    name,

                    stage,

                    grade,

                    year,

                    createdAt:
                        new Date()
                            .toISOString()

                });


                save(
                    STORAGE.groups,
                    groups
                );


                closeModal(
                    "groupModal"
                );


                refreshAll();


                showToast(
                    "تم إنشاء المجموعة."
                );

            }
        );


    /* =========================================
       GROUP DETAIL
    ========================================= */

    function openGroup(
        groupId
    ) {

        const group =
            groups.find(
                item =>
                    item.id === groupId
            );


        if (!group) {
            return;
        }


        currentGroupId =
            groupId;


        $("#groupDetailStage")
            .textContent =
            group.stage || "";


        $("#groupDetailName")
            .textContent =
            group.name || "";


        $("#groupDetailYear")
            .textContent =
            group.year ||
            "بدون تحديد";


        renderGroupDetail();


        showPage(
            "groupDetail"
        );

    }


    function renderGroupDetail() {

        if (!currentGroupId) {
            return;
        }


        renderGroupStudents();

        renderGroupLessons();

        renderGroupTests();

        renderGroupFiles();

        renderGroupClasses();

        renderGroupNotifications();

        renderGroupChat();

    }


    function renderGroupStudents() {

        const container =
            $("#groupStudentsList");


        if (!container) {
            return;
        }


        const list =
            students.filter(
                student =>
                    student.groupId ===
                    currentGroupId
            );


        $("#groupStudentsCount")
            .textContent =
            `${list.length} طالب`;


        if (!list.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid fa-user-graduate"></i>
                    </div>

                    <h3>
                        لا يوجد طلاب
                    </h3>

                    <p>
                        سيظهر الطلاب المقبولون هنا.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML =
            list.map(
                student => `

                    <div class="request-card">

                        <div class="request-avatar">
                            <i class="fa-solid fa-user-graduate"></i>
                        </div>


                        <div class="request-info">

                            <strong>
                                ${escapeHTML(
                                    student.name
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    student.phone || ""
                                )}
                            </span>

                        </div>


                        <button
                            type="button"
                            class="danger-button"
                            data-remove-group-student="${escapeHTML(student.id)}"
                        >
                            إزالة
                        </button>

                    </div>

                `
            ).join("");

    }


    function renderGroupLessons() {

        renderGroupContent(
            "#groupLessonsList",
            lessons.filter(
                item =>
                    item.groupId ===
                    currentGroupId
            ),
            "fa-book-open",
            "لا توجد دروس في المجموعة."
        );

    }


    function renderGroupTests() {

        renderGroupContent(
            "#groupTestsList",
            tests.filter(
                item =>
                    item.groupId ===
                    currentGroupId
            ),
            "fa-file-circle-check",
            "لا توجد اختبارات في المجموعة."
        );

    }


    function renderGroupFiles() {

        renderGroupContent(
            "#groupFilesList",
            files.filter(
                item =>
                    item.groupId ===
                    currentGroupId
            ),
            "fa-folder-open",
            "لا توجد ملفات في المجموعة."
        );

    }


    function renderGroupClasses() {

        renderGroupContent(
            "#groupClassesList",
            classes.filter(
                item =>
                    item.groupId ===
                    currentGroupId
            ),
            "fa-video",
            "لا توجد حصص في المجموعة."
        );

    }


    function renderGroupNotifications() {

        renderGroupContent(
            "#groupNotificationsList",
            notifications.filter(
                item =>
                    item.target ===
                    currentGroupId
            ),
            "fa-bell",
            "لا توجد إشعارات في المجموعة."
        );

    }


    function renderGroupContent(
        selector,
        list,
        icon,
        emptyText
    ) {

        const container =
            $(selector);


        if (!container) {
            return;
        }


        if (!list.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid ${icon}"></i>
                    </div>

                    <h3>
                        ${escapeHTML(emptyText)}
                    </h3>

                </div>
            `;

            return;

        }


        container.innerHTML =
            list.map(
                item => {

                    const title =
                        item.title ||
                        item.name ||
                        item.fileName ||
                        "عنصر";


                    const description =
                        item.description ||
                        item.message ||
                        item.date ||
                        "";


                    return `
                        <article class="content-card">

                            <div class="content-card-icon">
                                <i class="fa-solid ${icon}"></i>
                            </div>

                            <h3>
                                ${escapeHTML(title)}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    description
                                )}
                            </p>


                            <div class="content-card-footer">

                                <span>
                                    ${formatDate(
                                        item.createdAt
                                    )}
                                </span>

                            </div>

                        </article>
                    `;

                }
            ).join("");

    }


    /* =========================================
       GROUP TABS
    ========================================= */

    $$(".group-tab")
        .forEach(
            tab => {

                tab.addEventListener(
                    "click",
                    () => {

                        const target =
                            tab.dataset.groupTab;


                        $$(".group-tab")
                            .forEach(
                                item =>
                                    item.classList.remove(
                                        "active"
                                    )
                            );


                        $$(".group-tab-panel")
                            .forEach(
                                panel =>
                                    panel.classList.remove(
                                        "active"
                                    )
                            );


                        tab.classList.add(
                            "active"
                        );


                        const panel =
                            document.getElementById(
                                `group${capitalize(
                                    target
                                )}Tab`
                            );


                        panel?.classList.add(
                            "active"
                        );

                    }
                );

            }
        );


    function capitalize(
        value
    ) {

        return (
            value.charAt(0).toUpperCase() +
            value.slice(1)
        );

    }


    $("#backToGroups")
        ?.addEventListener(
            "click",
            () => {

                showPage(
                    "groups"
                );

            }
        );


    $("#deleteCurrentGroup")
        ?.addEventListener(
            "click",
            () => {

                if (!currentGroupId) {
                    return;
                }


                const group =
                    groups.find(
                        item =>
                            item.id ===
                            currentGroupId
                    );


                if (!group) {
                    return;
                }


                if (
                    !window.confirm(
                        `هل تريدين حذف مجموعة "${group.name}"؟`
                    )
                ) {
                    return;
                }


                groups =
                    groups.filter(
                        item =>
                            item.id !==
                            currentGroupId
                    );


                students =
                    students.map(
                        student => {

                            if (
                                student.groupId ===
                                currentGroupId
                            ) {

                                return {
                                    ...student,
                                    groupId: ""
                                };

                            }

                            return student;

                        }
                    );


                lessons =
                    lessons.filter(
                        item =>
                            item.groupId !==
                            currentGroupId
                    );


                tests =
                    tests.filter(
                        item =>
                            item.groupId !==
                            currentGroupId
                    );


                files =
                    files.filter(
                        item =>
                            item.groupId !==
                            currentGroupId
                    );


                classes =
                    classes.filter(
                        item =>
                            item.groupId !==
                            currentGroupId
                    );


                notifications =
                    notifications.filter(
                        item =>
                            item.target !==
                            currentGroupId
                    );


                save(
                    STORAGE.groups,
                    groups
                );


                save(
                    STORAGE.students,
                    students
                );


                save(
                    STORAGE.lessons,
                    lessons
                );


                save(
                    STORAGE.tests,
                    tests
                );


                save(
                    STORAGE.files,
                    files
                );


                save(
                    STORAGE.classes,
                    classes
                );


                save(
                    STORAGE.notifications,
                    notifications
                );


                currentGroupId = null;


                refreshAll();


                showPage(
                    "groups"
                );


                showToast(
                    "تم حذف المجموعة ومحتواها."
                );

            }
        );


    /* =========================================
       REQUESTS
    ========================================= */

    function renderRequests() {

        const container =
            $("#joinRequestsList");


        if (!container) {
            return;
        }


        const search =
            $("#requestSearch")
                ?.value
                .trim()
                .toLowerCase() || "";


        const stage =
            $("#requestStageFilter")
                ?.value || "";


        const list =
            requests.filter(
                request => {

                    const matchesSearch =
                        !search ||
                        String(
                            request.name || ""
                        )
                            .toLowerCase()
                            .includes(
                                search
                            ) ||
                        String(
                            request.phone || ""
                        )
                            .toLowerCase()
                            .includes(
                                search
                            );


                    const matchesStage =
                        !stage ||
                        request.stage ===
                            stage;


                    return (
                        matchesSearch &&
                        matchesStage
                    );

                }
            );


        if (!list.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid fa-inbox"></i>
                    </div>

                    <h3>
                        لا توجد طلبات
                    </h3>

                    <p>
                        لا توجد طلبات مطابقة.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML =
            list.map(
                request => {

                    const approved =
                        request.status ===
                        "approved";


                    const rejected =
                        request.status ===
                        "rejected";


                    return `
                        <div class="request-card">

                            <div class="request-avatar">
                                <i class="fa-solid fa-user"></i>
                            </div>


                            <div class="request-info">

                                <strong>
                                    ${escapeHTML(
                                        request.name
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        request.phone || ""
                                    )}
                                </span>

                                <span>
                                    ${escapeHTML(
                                        request.stage || ""
                                    )}
                                    —
                                    ${escapeHTML(
                                        request.grade || ""
                                    )}
                                </span>

                            </div>


                            <div class="request-actions">

                                ${
                                    approved

                                        ? `
                                            <span class="status-badge success">
                                                مقبول
                                            </span>
                                        `

                                        : rejected

                                            ? `
                                                <span class="status-badge danger">
                                                    مرفوض
                                                </span>
                                            `

                                            : `
                                                <button
                                                    type="button"
                                                    class="primary-button small"
                                                    data-approve-request="${escapeHTML(request.id)}"
                                                >
                                                    قبول
                                                </button>

                                                <button
                                                    type="button"
                                                    class="danger-button"
                                                    data-reject-request="${escapeHTML(request.id)}"
                                                >
                                                    رفض
                                                </button>
                                            `
                                }

                            </div>

                        </div>
                    `;

                }
            ).join("");

    }


    $("#requestSearch")
        ?.addEventListener(
            "input",
            renderRequests
        );


    $("#requestStageFilter")
        ?.addEventListener(
            "change",
            renderRequests
        );


    function openApproval(
        requestId
    ) {

        const request =
            requests.find(
                item =>
                    item.id === requestId
            );


        if (!request) {
            return;
        }


        const matchingGroups =
            groups.filter(
                group =>
                    group.stage ===
                        request.stage &&
                    group.grade ===
                        request.grade
            );


        if (!matchingGroups.length) {

            showToast(
                "لا توجد مجموعة مناسبة. أنشئي المجموعة أولًا."
            );

            return;

        }


        currentApprovalRequestId =
            requestId;


        $("#approvalStudentName")
            .textContent =
            request.name || "-";


        $("#approvalStudentGrade")
            .textContent =
            `${request.stage || ""} — ${
                request.grade || ""
            }`;


        $("#approvalGroup").innerHTML = `
            <option value="">
                اختاري المجموعة
            </option>

            ${
                matchingGroups.map(
                    group => `
                        <option value="${escapeHTML(group.id)}">
                            ${escapeHTML(group.name)}
                        </option>
                    `
                ).join("")
            }
        `;


        openModal(
            "approvalModal"
        );

    }


    $("#confirmApproval")
        ?.addEventListener(
            "click",
            () => {

                const groupId =
                    $("#approvalGroup")
                        .value;


                if (!groupId) {

                    showToast(
                        "اختاري المجموعة."
                    );

                    return;

                }


                const request =
                    requests.find(
                        item =>
                            item.id ===
                            currentApprovalRequestId
                    );


                if (!request) {
                    return;
                }


                const existingIndex =
                    students.findIndex(
                        student =>
                            student.phone &&
                            request.phone &&
                            student.phone ===
                            request.phone
                    );


                const student = {

                    id:
                        existingIndex >= 0
                            ? students[
                                existingIndex
                            ].id
                            : uid("student"),

                    name:
                        request.name,

                    phone:
                        request.phone,

                    guardianPhone:
                        request.guardianPhone,

                    stage:
                        request.stage,

                    grade:
                        request.grade,

                    groupId,

                    status:
                        "active",

                    joinedAt:
                        new Date()
                            .toISOString()

                };


                if (existingIndex >= 0) {

                    students[
                        existingIndex
                    ] = student;

                } else {

                    students.push(
                        student
                    );

                }


                // Create (or update) the actual student
                // login account now that the request is
                // approved. The student site logs in against
                // "studentAccounts", so this is what lets the
                // student sign in after approval.
                const accounts =
                    load("studentAccounts");

                const existingAccountIndex =
                    accounts.findIndex(
                        account =>
                            account.phone &&
                            request.phone &&
                            account.phone ===
                            request.phone
                    );

                const account = {

                    id:
                        existingAccountIndex >= 0
                            ? accounts[
                                existingAccountIndex
                            ].id
                            : student.id,

                    name:
                        request.name,

                    phone:
                        request.phone,

                    guardianPhone:
                        request.guardianPhone,

                    stage:
                        request.stage,

                    grade:
                        request.grade,

                    groupId,

                    password:
                        request.password,

                    paymentStatus:
                        existingAccountIndex >= 0
                            ? accounts[
                                existingAccountIndex
                            ].paymentStatus
                            : "غير مدفوع",

                    createdAt:
                        existingAccountIndex >= 0
                            ? accounts[
                                existingAccountIndex
                            ].createdAt
                            : new Date()
                                .toISOString()

                };

                if (existingAccountIndex >= 0) {

                    accounts[
                        existingAccountIndex
                    ] = account;

                } else {

                    accounts.push(
                        account
                    );

                }

                save(
                    "studentAccounts",
                    accounts
                );


                request.status =
                    "approved";


                request.groupId =
                    groupId;


                save(
                    STORAGE.students,
                    students
                );


                save(
                    STORAGE.requests,
                    requests
                );


                closeModal(
                    "approvalModal"
                );


                currentApprovalRequestId =
                    null;


                refreshAll();


                showToast(
                    "تم قبول الطالب وإضافته للمجموعة."
                );

            }
        );


    /* =========================================
       STUDENTS
    ========================================= */

    function renderStudents() {

        const body =
            $("#studentsTableBody");


        if (!body) {
            return;
        }


        const search =
            $("#studentSearch")
                ?.value
                .trim()
                .toLowerCase() || "";


        const groupId =
            $("#studentGroupFilter")
                ?.value || "";


        const list =
            students.filter(
                student => {

                    const matchesSearch =
                        !search ||
                        String(
                            student.name || ""
                        )
                            .toLowerCase()
                            .includes(
                                search
                            ) ||
                        String(
                            student.phone || ""
                        )
                            .toLowerCase()
                            .includes(
                                search
                            );


                    const matchesGroup =
                        !groupId ||
                        student.groupId ===
                            groupId;


                    return (
                        matchesSearch &&
                        matchesGroup
                    );

                }
            );


        if (!list.length) {

            body.innerHTML = `
                <tr>
                    <td colspan="7">

                        <div class="empty-state">

                            <div class="empty-state-icon">
                                <i class="fa-solid fa-user-graduate"></i>
                            </div>

                            <h3>
                                لا يوجد طلاب
                            </h3>

                            <p>
                                ستظهر الطلاب المقبولون هنا.
                            </p>

                        </div>

                    </td>
                </tr>
            `;

            return;

        }


        body.innerHTML =
            list.map(
                student => `

                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    student.name
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                student.phone || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                student.stage || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                student.grade || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                groupName(
                                    student.groupId
                                )
                            )}
                        </td>

                        <td>

                            <span class="status-badge success">
                                نشط
                            </span>

                        </td>

                        <td>

                            <button
                                type="button"
                                class="danger-button"
                                data-remove-student="${escapeHTML(student.id)}"
                            >
                                إزالة
                            </button>

                        </td>

                    </tr>

                `
            ).join("");

    }


    $("#studentSearch")
        ?.addEventListener(
            "input",
            renderStudents
        );


    $("#studentGroupFilter")
        ?.addEventListener(
            "change",
            renderStudents
        );


    /* =========================================
       LESSON VIDEO PICKER
    ========================================= */

    $("#chooseLessonVideo")
        ?.addEventListener(
            "click",
            () => {

                $("#lessonVideoPicker")
                    ?.click();

            }
        );


    $("#lessonVideoPicker")
        ?.addEventListener(
            "change",
            event => {

                const file =
                    event.target.files?.[0];


                if (!file) {
                    return;
                }


                selectedLessonVideo =
                    file;


                $("#selectedLessonVideoName")
                    .textContent =
                    file.name;


                showToast(
                    "تم اختيار فيديو الدرس."
                );

            }
        );


    /* =========================================
       LESSONS
    ========================================= */

    $("#createLessonButton")
        ?.addEventListener(
            "click",
            () => {

                if (!groups.length) {

                    showToast(
                        "أنشئي مجموعة أولًا."
                    );

                    return;

                }


                $("#lessonForm")
                    ?.reset();


                selectedLessonVideo =
                    null;


                $("#selectedLessonVideoName")
                    .textContent =
                    "لم يتم اختيار فيديو";


                populateGroupSelect(
                    "#lessonGroup"
                );


                openModal(
                    "lessonModal"
                );

            }
        );


    $("#addGroupLesson")
        ?.addEventListener(
            "click",
            () => {

                if (!currentGroupId) {
                    return;
                }


                $("#lessonForm")
                    ?.reset();


                selectedLessonVideo =
                    null;


                $("#selectedLessonVideoName")
                    .textContent =
                    "لم يتم اختيار فيديو";


                populateGroupSelect(
                    "#lessonGroup",
                    currentGroupId
                );


                $("#lessonGroup").value =
                    currentGroupId;


                openModal(
                    "lessonModal"
                );

            }
        );


    $("#lessonForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const title =
                    $("#lessonTitle")
                        .value
                        .trim();


                const groupId =
                    $("#lessonGroup")
                        .value;


                const description =
                    $("#lessonDescription")
                        .value
                        .trim();


                if (
                    !title ||
                    !groupId
                ) {

                    showToast(
                        "أكملي بيانات الدرس."
                    );

                    return;

                }


                lessons.push({

                    id:
                        uid("lesson"),

                    title,

                    groupId,

                    description,

                    videoName:
                        selectedLessonVideo
                            ?.name || "",

                    videoType:
                        selectedLessonVideo
                            ?.type || "",

                    videoSize:
                        selectedLessonVideo
                            ?.size || 0,

                    videoSelected:
                        Boolean(
                            selectedLessonVideo
                        ),

                    createdAt:
                        new Date()
                            .toISOString()

                });


                save(
                    STORAGE.lessons,
                    lessons
                );


                closeModal(
                    "lessonModal"
                );


                selectedLessonVideo =
                    null;


                refreshAll();


                showToast(
                    "تم إضافة الدرس بنجاح."
                );

            }
        );


    function renderLessons() {

        const container =
            $("#teacherLessonsGrid");


        if (!container) {
            return;
        }


        if (!lessons.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid fa-book-open"></i>
                    </div>

                    <h3>
                        لا توجد دروس
                    </h3>

                    <p>
                        ابدئي بإضافة أول درس.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML =
            lessons.map(
                lesson => `

                    <article class="content-card">

                        <div class="content-card-icon">
                            <i class="fa-solid fa-book-open"></i>
                        </div>


                        <h3>
                            ${escapeHTML(
                                lesson.title
                            )}
                        </h3>


                        <p>
                            ${escapeHTML(
                                lesson.description || ""
                            )}
                        </p>


                        <div class="content-card-footer">

                            <span>
                                ${escapeHTML(
                                    groupName(
                                        lesson.groupId
                                    )
                                )}
                            </span>


                            <span>
                                ${
                                    lesson.videoSelected
                                        ? "فيديو مضاف"
                                        : "بدون فيديو"
                                }
                            </span>


                            <button
                                type="button"
                                class="danger-button"
                                data-delete-lesson="${escapeHTML(lesson.id)}"
                            >
                                حذف
                            </button>

                        </div>

                    </article>

                `
            ).join("");

    }


    /* =========================================
       TESTS
    ========================================= */

    function openTestModal(
        groupId = ""
    ) {

        if (!groups.length) {

            showToast(
                "أنشئي مجموعة أولًا."
            );

            return;

        }


        $("#testForm")
            ?.reset();


        populateGroupSelect(
            "#testGroup",
            groupId
        );


        if (groupId) {

            $("#testGroup").value =
                groupId;

        }


        openModal(
            "testModal"
        );

    }


    $("#createTestButton")
        ?.addEventListener(
            "click",
            () => {

                openTestModal();

            }
        );


    $("#addGroupTest")
        ?.addEventListener(
            "click",
            () => {

                openTestModal(
                    currentGroupId
                );

            }
        );


    $("#testForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const title =
                    $("#testTitle")
                        .value
                        .trim();


                const groupId =
                    $("#testGroup")
                        .value;


                const date =
                    $("#testDate")
                        .value;


                const duration =
                    $("#testDuration")
                        .value;


                const description =
                    $("#testDescription")
                        .value
                        .trim();


                if (
                    !title ||
                    !groupId
                ) {

                    showToast(
                        "أكملي بيانات الاختبار."
                    );

                    return;

                }


                tests.push({

                    id:
                        uid("test"),

                    title,

                    groupId,

                    date,

                    duration,

                    description,

                    createdAt:
                        new Date()
                            .toISOString()

                });


                save(
                    STORAGE.tests,
                    tests
                );


                closeModal(
                    "testModal"
                );


                refreshAll();


                showToast(
                    "تم إنشاء الاختبار."
                );

            }
        );


    function renderTests() {

        const container =
            $("#teacherTestsGrid");


        if (!container) {
            return;
        }


        if (!tests.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid fa-file-circle-check"></i>
                    </div>

                    <h3>
                        لا توجد اختبارات
                    </h3>

                    <p>
                        ابدئي بإنشاء أول اختبار.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML =
            tests.map(
                test => `

                    <article class="content-card">

                        <div class="content-card-icon">
                            <i class="fa-solid fa-file-circle-check"></i>
                        </div>


                        <h3>
                            ${escapeHTML(
                                test.title
                            )}
                        </h3>


                        <p>
                            المجموعة:
                            ${escapeHTML(
                                groupName(
                                    test.groupId
                                )
                            )}
                        </p>


                        <div class="content-card-footer">

                            <span>
                                ${
                                    test.date
                                        ? escapeHTML(
                                            test.date
                                        )
                                        : "بدون تاريخ"
                                }
                            </span>


                            <button
                                type="button"
                                class="danger-button"
                                data-delete-test="${escapeHTML(test.id)}"
                            >
                                حذف
                            </button>

                        </div>

                    </article>

                `
            ).join("");

    }


    /* =========================================
       FILES
    ========================================= */

    $("#uploadFileButton")
        ?.addEventListener(
            "click",
            () => {

                if (!groups.length) {

                    showToast(
                        "أنشئي مجموعة أولًا."
                    );

                    return;

                }


                currentUploadGroupId =
                    null;


                const groupId =
                    window.prompt(
                        "أدخلي ID المجموعة التي تريدين رفع الملف إليها:"
                    );


                if (!groupId) {
                    return;
                }


                if (
                    !groups.some(
                        group =>
                            group.id ===
                            groupId
                    )
                ) {

                    showToast(
                        "المجموعة غير موجودة."
                    );

                    return;

                }


                currentUploadGroupId =
                    groupId;


                $("#filePicker").click();

            }
        );


    $("#addGroupFile")
        ?.addEventListener(
            "click",
            () => {

                if (!currentGroupId) {
                    return;
                }


                currentUploadGroupId =
                    currentGroupId;


                $("#filePicker").click();

            }
        );


    $("#filePicker")
        ?.addEventListener(
            "change",
            event => {

                const file =
                    event.target.files?.[0];


                if (!file) {
                    return;
                }


                if (!currentUploadGroupId) {

                    showToast(
                        "لم يتم تحديد المجموعة."
                    );

                    event.target.value =
                        "";

                    return;

                }


                files.push({

                    id:
                        uid("file"),

                    title:
                        file.name,

                    fileName:
                        file.name,

                    groupId:
                        currentUploadGroupId,

                    size:
                        file.size,

                    type:
                        file.type,

                    createdAt:
                        new Date()
                            .toISOString()

                });


                save(
                    STORAGE.files,
                    files
                );


                event.target.value =
                    "";


                currentUploadGroupId =
                    null;


                refreshAll();


                showToast(
                    "تم إضافة الملف."
                );

            }
        );


    function renderFiles() {

        const container =
            $("#teacherFilesGrid");


        if (!container) {
            return;
        }


        if (!files.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid fa-folder-open"></i>
                    </div>

                    <h3>
                        لا توجد ملفات
                    </h3>

                    <p>
                        أضيفي المذكرات والملفات التعليمية.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML =
            files.map(
                file => `

                    <article class="content-card">

                        <div class="content-card-icon">
                            <i class="fa-solid fa-folder-open"></i>
                        </div>


                        <h3>
                            ${escapeHTML(
                                file.title
                            )}
                        </h3>


                        <p>
                            ${escapeHTML(
                                groupName(
                                    file.groupId
                                )
                            )}
                        </p>


                        <div class="content-card-footer">

                            <span>
                                ${formatDate(
                                    file.createdAt
                                )}
                            </span>


                            <button
                                type="button"
                                class="danger-button"
                                data-delete-file="${escapeHTML(file.id)}"
                            >
                                حذف
                            </button>

                        </div>

                    </article>

                `
            ).join("");

    }


    /* =========================================
       CLASSES
    ========================================= */

    $("#createClassButton")
        ?.addEventListener(
            "click",
            () => {

                if (!groups.length) {

                    showToast(
                        "أنشئي مجموعة أولًا."
                    );

                    return;

                }


                $("#classForm")
                    ?.reset();


                populateGroupSelect(
                    "#classGroup"
                );


                openModal(
                    "classModal"
                );

            }
        );


    $("#addGroupClass")
        ?.addEventListener(
            "click",
            () => {

                if (!currentGroupId) {
                    return;
                }


                $("#classForm")
                    ?.reset();


                populateGroupSelect(
                    "#classGroup",
                    currentGroupId
                );


                $("#classGroup").value =
                    currentGroupId;


                openModal(
                    "classModal"
                );

            }
        );


    $("#classForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const title =
                    $("#classTitle")
                        .value
                        .trim();


                const groupId =
                    $("#classGroup")
                        .value;


                const link =
                    $("#classLink")
                        .value
                        .trim();


                if (
                    !title ||
                    !groupId
                ) {

                    showToast(
                        "أكملي بيانات الحصة."
                    );

                    return;

                }


                classes.push({

                    id:
                        uid("class"),

                    title,

                    groupId,

                    link,

                    createdAt:
                        new Date()
                            .toISOString()

                });


                save(
                    STORAGE.classes,
                    classes
                );


                closeModal(
                    "classModal"
                );


                refreshAll();


                showToast(
                    "تم إنشاء الحصة."
                );

            }
        );


    function renderClasses() {

        const container =
            $("#classesAdminList");


        if (!container) {
            return;
        }


        if (!classes.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid fa-video"></i>
                    </div>

                    <h3>
                        لا توجد حصص
                    </h3>

                    <p>
                        أضيفي الحصص الأونلاين.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML =
            classes.map(
                item => `

                    <article class="content-card">

                        <div class="content-card-icon">
                            <i class="fa-solid fa-video"></i>
                        </div>


                        <h3>
                            ${escapeHTML(
                                item.title
                            )}
                        </h3>


                        <p>
                            المجموعة:
                            ${escapeHTML(
                                groupName(
                                    item.groupId
                                )
                            )}
                        </p>


                        <div class="content-card-footer">

                            <span>
                                ${
                                    item.link
                                        ? "يوجد رابط"
                                        : "بدون رابط"
                                }
                            </span>


                            <button
                                type="button"
                                class="danger-button"
                                data-delete-class="${escapeHTML(item.id)}"
                            >
                                حذف
                            </button>

                        </div>

                    </article>

                `
            ).join("");

    }


    /* =========================================
       NOTIFICATIONS
    ========================================= */

    $("#createNotificationButton")
        ?.addEventListener(
            "click",
            () => {

                $("#notificationForm")
                    ?.reset();


                populateNotificationTargets();


                openModal(
                    "notificationModal"
                );

            }
        );


    $("#addGroupNotification")
        ?.addEventListener(
            "click",
            () => {

                if (!currentGroupId) {
                    return;
                }


                $("#notificationForm")
                    ?.reset();


                populateNotificationTargets();


                $("#notificationTarget")
                    .value =
                    currentGroupId;


                openModal(
                    "notificationModal"
                );

            }
        );


    $("#notificationForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const title =
                    $("#notificationTitle")
                        .value
                        .trim();


                const target =
                    $("#notificationTarget")
                        .value;


                const message =
                    $("#notificationMessage")
                        .value
                        .trim();


                if (
                    !title ||
                    !message
                ) {

                    showToast(
                        "أكملي بيانات الإشعار."
                    );

                    return;

                }


                notifications.push({

                    id:
                        uid("notification"),

                    title,

                    target,

                    message,

                    createdAt:
                        new Date()
                            .toISOString()

                });


                save(
                    STORAGE.notifications,
                    notifications
                );


                closeModal(
                    "notificationModal"
                );


                refreshAll();


                showToast(
                    "تم إرسال الإشعار."
                );

            }
        );


    function renderNotifications() {

        const container =
            $("#teacherNotificationsList");


        if (!container) {
            return;
        }


        if (!notifications.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid fa-bell"></i>
                    </div>

                    <h3>
                        لا توجد إشعارات
                    </h3>

                    <p>
                        ستظهر الإشعارات هنا.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML =
            notifications.map(
                item => {

                    const target =
                        item.target === "all"
                            ? "جميع الطلاب"
                            : groupName(
                                item.target
                            );


                    return `
                        <article class="content-card">

                            <div class="content-card-icon">
                                <i class="fa-solid fa-bell"></i>
                            </div>


                            <h3>
                                ${escapeHTML(
                                    item.title
                                )}
                            </h3>


                            <p>
                                ${escapeHTML(
                                    item.message
                                )}
                            </p>


                            <div class="content-card-footer">

                                <span>
                                    ${escapeHTML(
                                        target
                                    )}
                                </span>


                                <button
                                    type="button"
                                    class="danger-button"
                                    data-delete-notification="${escapeHTML(item.id)}"
                                >
                                    حذف
                                </button>

                            </div>

                        </article>
                    `;

                }
            ).join("");

    }


    /* =========================================
       CHAT
    ========================================= */

    function renderChatStudents() {

        const container =
            $("#chatStudents");


        const count =
            $("#chatStudentsCount");


        if (!container) {
            return;
        }


        if (count) {

            count.textContent =
                students.length;

        }


        if (!students.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid fa-comments"></i>
                    </div>

                    <h3>
                        لا يوجد طلاب
                    </h3>

                </div>
            `;

            return;

        }


        container.innerHTML =
            students.map(
                student => `

                    <button
                        type="button"
                        class="chat-student ${
                            currentChatStudentId ===
                                student.id
                                ? "active"
                                : ""
                        }"
                        data-chat-student="${escapeHTML(student.id)}"
                    >

                        <div class="chat-student-avatar">
                            <i class="fa-solid fa-user-graduate"></i>
                        </div>


                        <div>

                            <strong>
                                ${escapeHTML(
                                    student.name
                                )}
                            </strong>

                        </div>

                    </button>

                `
            ).join("");

    }


    function renderStudentChat() {

        const container =
            $("#teacherChatMessages");


        const title =
            $("#selectedChatStudent");


        if (!container) {
            return;
        }


        const student =
            students.find(
                item =>
                    item.id ===
                    currentChatStudentId
            );


        if (!student) {

            if (title) {

                title.textContent =
                    "اختاري طالبًا";

            }


            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid fa-comments"></i>
                    </div>

                    <h3>
                        اختاري طالبًا
                    </h3>

                    <p>
                        ستظهر المحادثة هنا.
                    </p>

                </div>
            `;

            return;

        }


        title.textContent =
            student.name;


        const messages =
            chats[
                currentChatStudentId
            ] || [];


        if (!messages.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid fa-comments"></i>
                    </div>

                    <h3>
                        لا توجد رسائل
                    </h3>

                    <p>
                        ابدئي المحادثة.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML =
            messages.map(
                message => `

                    <div class="message ${message.sender}">
                        ${escapeHTML(message.text)}
                    </div>

                `
            ).join("");

    }


    $("#teacherChatForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                if (!currentChatStudentId) {

                    showToast(
                        "اختاري طالبًا أولًا."
                    );

                    return;

                }


                const input =
                    $("#teacherChatInput");


                const text =
                    input.value.trim();


                if (!text) {
                    return;
                }


                if (
                    !chats[
                        currentChatStudentId
                    ]
                ) {

                    chats[
                        currentChatStudentId
                    ] = [];

                }


                chats[
                    currentChatStudentId
                ].push({

                    id:
                        uid("message"),

                    sender:
                        "teacher",

                    text,

                    createdAt:
                        new Date()
                            .toISOString()

                });


                save(
                    STORAGE.chats,
                    chats
                );


                input.value = "";


                renderStudentChat();

            }
        );


    function renderGroupChat() {

        const container =
            $("#groupChatMessages");


        if (
            !container ||
            !currentGroupId
        ) {
            return;
        }


        const messages =
            groupChats[
                currentGroupId
            ] || [];


        if (!messages.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid fa-comments"></i>
                    </div>

                    <h3>
                        لا توجد رسائل
                    </h3>

                    <p>
                        ابدئي المحادثة مع المجموعة.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML =
            messages.map(
                message => `

                    <div class="message teacher">
                        ${escapeHTML(
                            message.text
                        )}
                    </div>

                `
            ).join("");

    }


    $("#groupChatForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                if (!currentGroupId) {
                    return;
                }


                const input =
                    $("#groupChatInput");


                const text =
                    input.value.trim();


                if (!text) {
                    return;
                }


                if (
                    !groupChats[
                        currentGroupId
                    ]
                ) {

                    groupChats[
                        currentGroupId
                    ] = [];

                }


                groupChats[
                    currentGroupId
                ].push({

                    id:
                        uid("group_message"),

                    sender:
                        "teacher",

                    text,

                    createdAt:
                        new Date()
                            .toISOString()

                });


                save(
                    STORAGE.groupChats,
                    groupChats
                );


                input.value = "";


                renderGroupChat();

            }
        );


    /* =========================================
       PAYMENTS
    ========================================= */

    function renderPayments() {

        let total = 0;
        let paid = 0;


        payments.forEach(
            payment => {

                total +=
                    Number(
                        payment.total || 0
                    );


                paid +=
                    Number(
                        payment.paid || 0
                    );

            }
        );


        const remaining =
            total - paid;


        $("#teacherTotalPayments")
            .textContent =
            total;


        $("#teacherPaidPayments")
            .textContent =
            paid;


        $("#teacherRemainingPayments")
            .textContent =
            remaining;


        const body =
            $("#teacherPaymentsBody");


        if (!body) {
            return;
        }


        if (!payments.length) {

            body.innerHTML = `
                <tr>
                    <td colspan="6">

                        <div class="empty-state">

                            <div class="empty-state-icon">
                                <i class="fa-solid fa-wallet"></i>
                            </div>

                            <h3>
                                لا توجد مدفوعات
                            </h3>

                            <p>
                                ستظهر بيانات المدفوعات هنا.
                            </p>

                        </div>

                    </td>
                </tr>
            `;

            return;

        }


        body.innerHTML =
            payments.map(
                payment => {

                    const paymentRemaining =
                        Number(
                            payment.total || 0
                        ) -
                        Number(
                            payment.paid || 0
                        );


                    return `
                        <tr>

                            <td>
                                ${escapeHTML(
                                    payment.studentName ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    groupName(
                                        payment.groupId
                                    )
                                )}
                            </td>

                            <td>
                                ${Number(
                                    payment.total || 0
                                )}
                            </td>

                            <td>
                                ${Number(
                                    payment.paid || 0
                                )}
                            </td>

                            <td>
                                ${paymentRemaining}
                            </td>

                            <td>

                                <span class="status-badge ${
                                    paymentRemaining <=
                                    0
                                        ? "success"
                                        : "warning"
                                }">

                                    ${
                                        paymentRemaining <=
                                        0
                                            ? "مكتمل"
                                            : "متبقي"
                                    }

                                </span>

                            </td>

                        </tr>
                    `;

                }
            ).join("");

    }


    /* =========================================
       INSTAPAY
    ========================================= */

    function getInstaPayUrl() {

        const backendUrl =
            window.platformConfig
                ?.instapayUrl;


        const savedUrl =
            localStorage.getItem(
                "instapayPaymentUrl"
            );


        return (
            backendUrl ||
            savedUrl ||
            ""
        );

    }


    function openInstaPay() {

        const url =
            getInstaPayUrl();


        if (!url) {

            showToast(
                "سيتم ربط رابط InstaPay من الـBackend."
            );

            return;

        }


        try {

            const parsed =
                new URL(url);


            if (
                parsed.protocol !== "https:" &&
                parsed.protocol !== "http:"
            ) {

                throw new Error(
                    "Invalid URL"
                );

            }


            window.open(
                parsed.href,
                "_blank",
                "noopener,noreferrer"
            );

        } catch {

            showToast(
                "رابط InstaPay غير صالح."
            );

        }

    }


    $("#instapayButton")
        ?.addEventListener(
            "click",
            openInstaPay
        );


    $("#instapaySettingsButton")
        ?.addEventListener(
            "click",
            openInstaPay
        );


    /* =========================================
       DELETE HELPERS
    ========================================= */

    document.addEventListener(
        "click",
        event => {

            const approve =
                event.target.closest(
                    "[data-approve-request]"
                );


            if (approve) {

                openApproval(
                    approve.dataset
                        .approveRequest
                );

                return;

            }


            const reject =
                event.target.closest(
                    "[data-reject-request]"
                );


            if (reject) {

                const id =
                    reject.dataset
                        .rejectRequest;


                const request =
                    requests.find(
                        item =>
                            item.id === id
                    );


                if (request) {

                    request.status =
                        "rejected";


                    save(
                        STORAGE.requests,
                        requests
                    );


                    refreshAll();


                    showToast(
                        "تم رفض الطلب."
                    );

                }

                return;

            }


            const group =
                event.target.closest(
                    "[data-open-group]"
                );


            if (group) {

                openGroup(
                    group.dataset.openGroup
                );

                return;

            }


            const removeStudent =
                event.target.closest(
                    "[data-remove-student]"
                );


            if (removeStudent) {

                removeStudentFromPlatform(
                    removeStudent.dataset
                        .removeStudent
                );

                return;

            }


            const removeGroupStudent =
                event.target.closest(
                    "[data-remove-group-student]"
                );


            if (removeGroupStudent) {

                removeStudentFromGroup(
                    removeGroupStudent.dataset
                        .removeGroupStudent
                );

                return;

            }


            const chatStudent =
                event.target.closest(
                    "[data-chat-student]"
                );


            if (chatStudent) {

                currentChatStudentId =
                    chatStudent.dataset
                        .chatStudent;


                renderChatStudents();

                renderStudentChat();

                return;

            }


            deleteByAttribute(
                event,
                "data-delete-lesson",
                STORAGE.lessons
            );


            deleteByAttribute(
                event,
                "data-delete-test",
                STORAGE.tests
            );


            deleteByAttribute(
                event,
                "data-delete-file",
                STORAGE.files
            );


            deleteByAttribute(
                event,
                "data-delete-class",
                STORAGE.classes
            );


            deleteByAttribute(
                event,
                "data-delete-notification",
                STORAGE.notifications
            );

        }
    );


    function deleteByAttribute(
        event,
        attribute,
        storageKey
    ) {

        const button =
            event.target.closest(
                `[${attribute}]`
            );


        if (!button) {
            return;
        }


        if (
            !window.confirm(
                "هل أنتِ متأكدة من الحذف؟"
            )
        ) {
            return;
        }


        const map = {

            [STORAGE.lessons]:
                lessons,

            [STORAGE.tests]:
                tests,

            [STORAGE.files]:
                files,

            [STORAGE.classes]:
                classes,

            [STORAGE.notifications]:
                notifications

        };


        const list =
            map[storageKey];


        if (!list) {
            return;
        }


        const id =
            button.getAttribute(
                attribute
            );


        const updated =
            list.filter(
                item =>
                    item.id !== id
            );


        save(
            storageKey,
            updated
        );


        if (
            storageKey ===
            STORAGE.lessons
        ) {

            lessons =
                updated;

        }


        if (
            storageKey ===
            STORAGE.tests
        ) {

            tests =
                updated;

        }


        if (
            storageKey ===
            STORAGE.files
        ) {

            files =
                updated;

        }


        if (
            storageKey ===
            STORAGE.classes
        ) {

            classes =
                updated;

        }


        if (
            storageKey ===
            STORAGE.notifications
        ) {

            notifications =
                updated;

        }


        refreshAll();


        if (currentGroupId) {

            renderGroupDetail();

        }


        showToast(
            "تم الحذف بنجاح."
        );

    }


    /* =========================================
       REMOVE STUDENT
    ========================================= */

    function removeStudentFromPlatform(
        studentId
    ) {

        const student =
            students.find(
                item =>
                    item.id === studentId
            );


        if (!student) {
            return;
        }


        if (
            !window.confirm(
                `هل تريدين إزالة الطالب "${student.name}" من المنصة؟`
            )
        ) {
            return;
        }


        students =
            students.filter(
                item =>
                    item.id !== studentId
            );


        save(
            STORAGE.students,
            students
        );


        refreshAll();


        showToast(
            "تم إزالة الطالب من المنصة."
        );

    }


    function removeStudentFromGroup(
        studentId
    ) {

        students =
            students.map(
                student => {

                    if (
                        student.id ===
                        studentId
                    ) {

                        return {
                            ...student,
                            groupId: ""
                        };

                    }


                    return student;

                }
            );


        save(
            STORAGE.students,
            students
        );


        refreshAll();


        renderGroupDetail();


        showToast(
            "تم إزالة الطالب من المجموعة."
        );

    }


    /* =========================================
       SELECT REFRESH
    ========================================= */

    function refreshSelectors() {

        populateGroupSelect(
            "#studentGroupFilter",
            "",
            true
        );


        populateGroupSelect(
            "#lessonGroup"
        );


        populateGroupSelect(
            "#testGroup"
        );


        populateGroupSelect(
            "#classGroup"
        );


        populateNotificationTargets();

    }


    /* =========================================
       TOPBAR
    ========================================= */

    $("#teacherNotifications")
        ?.addEventListener(
            "click",
            () => {

                showPage(
                    "notifications"
                );

            }
        );


    $("#topbarProfile")
        ?.addEventListener(
            "click",
            () => {

                showPage(
                    "settings"
                );

            }
        );


    /* =========================================
       REFRESH
    ========================================= */

    function refreshAll() {

        renderOverview();

        renderRequests();

        renderStudents();

        renderGroups();

        renderLessons();

        renderTests();

        renderFiles();

        renderClasses();

        renderNotifications();

        renderChatStudents();

        renderStudentChat();

        renderPayments();

        refreshSelectors();

        updateRequestCounter();

        updateNotificationDot();


        if (currentGroupId) {

            renderGroupDetail();

        }

    }


    // Refresh the dashboard when another device changes shared data.
    window.addEventListener("cloudDataUpdated", () => {
        refreshAll();
    });


    function updateRequestCounter() {

        const count =
            requests.filter(
                request =>
                    request.status !==
                        "approved" &&
                    request.status !==
                        "rejected"
            ).length;


        const element =
            $("#joinRequestsCount");


        if (element) {

            element.textContent =
                count;

        }

    }


    function updateNotificationDot() {

        const dot =
            $("#teacherNotificationDot");


        if (!dot) {
            return;
        }


        dot.style.display =
            notifications.length
                ? "block"
                : "none";

    }


    /* =========================================
       INITIALIZE
    ========================================= */

    setTheme(
        getTheme()
    );


    setColor(
        getColor()
    );


    updateGradeOptions();


    refreshAll();


    showPage(
        "overview"
    );

});