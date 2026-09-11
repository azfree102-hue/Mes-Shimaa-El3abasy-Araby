"use strict";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE = {
    accounts: "studentAccounts",
    requests: "teacherJoinRequests",

    currentStudent: "studentCurrentAccount",

    groups: "teacherGroups",
    lessons: "teacherLessons",
    tests: "teacherTests",
    files: "teacherFiles",
    classes: "teacherClasses",
    notifications: "teacherNotifications",
    chats: "teacherChats",

    theme: "studentTheme",
    color: "studentColor"
};

/* =========================================================
   STATE
========================================================= */

const state = {
    page: "overview",

    lessonSearch: "",
    testSearch: "",
    fileSearch: "",

    currentLesson: null
};

/* =========================================================
   HELPERS
========================================================= */

function readJSON(key, fallback = []) {
    try {
        const value = localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : fallback;
    } catch {
        return fallback;
    }
}

function writeJSON(key, value) {
    localStorage.setItem(
        key,
        JSON.stringify(value)
    );
}

function normalize(value) {
    return String(value ?? "")
        .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
        .trim();
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =========================================================
   CURRENT USER
========================================================= */

function getCurrentStudentId() {
    return localStorage.getItem(
        STORAGE.currentStudent
    );
}

function getAccounts() {
    return readJSON(
        STORAGE.accounts,
        []
    );
}

function getCurrentStudent() {
    const id =
        getCurrentStudentId();

    if (!id) {
        return null;
    }

    return getAccounts().find(
        account =>
            normalize(account.id) ===
            normalize(id)
    ) || null;
}

function saveAccounts(accounts) {
    writeJSON(
        STORAGE.accounts,
        accounts
    );
}

function getJoinRequests() {
    return readJSON(
        STORAGE.requests,
        []
    );
}

function saveJoinRequests(requests) {
    writeJSON(
        STORAGE.requests,
        requests
    );
}

/* =========================================================
   GROUPS
========================================================= */

function getGroups() {
    return readJSON(
        STORAGE.groups,
        []
    );
}

function getGroupById(id) {
    return getGroups().find(
        group =>
            normalize(group.id) ===
            normalize(id)
    ) || null;
}

function getCurrentGroup() {
    const student =
        getCurrentStudent();

    return getGroupById(
        student?.groupId || ""
    );
}

function getItemGroupId(item) {
    return normalize(
        item?.groupId ??
        item?.group ??
        item?.groupID ??
        item?.group_id
    );
}

function belongsToStudentGroup(item) {

    const student =
        getCurrentStudent();

    if (!student) {
        return false;
    }

    const studentGroup =
        normalize(
            student.groupId
        );

    if (!studentGroup) {
        return true;
    }

    const itemGroup =
        getItemGroupId(item);

    if (!itemGroup) {
        return true;
    }

    return itemGroup === studentGroup;
}

function filterStudentContent(items) {
    return items.filter(
        belongsToStudentGroup
    );
}

/* =========================================================
   DATES
========================================================= */

function formatDate(value) {

    if (!value) {
        return "";
    }

    try {

        return new Date(value)
            .toLocaleDateString(
                "ar-EG",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );

    } catch {

        return String(value);
    }
}

function formatShortDate(value) {

    if (!value) {
        return "";
    }

    try {

        return new Date(value)
            .toLocaleDateString(
                "ar-EG",
                {
                    day: "numeric",
                    month: "short"
                }
            );

    } catch {

        return String(value);
    }
}

function formatTime(value) {

    if (!value) {
        return "";
    }

    try {

        return new Date(value)
            .toLocaleTimeString(
                "ar-EG",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    } catch {

        return "";
    }
}

/* =========================================================
   TOAST
========================================================= */

function showToast(
    title,
    message
) {

    const toast =
        document.querySelector(
            "#toast"
        );

    if (!toast) {
        return;
    }

    const titleElement =
        document.querySelector(
            "#toastTitle"
        );

    const messageElement =
        document.querySelector(
            "#toastMessage"
        );

    if (titleElement) {
        titleElement.textContent =
            title;
    }

    if (messageElement) {
        messageElement.textContent =
            message;
    }

    toast.classList.add("show");

    clearTimeout(
        window.__studentToastTimer
    );

    window.__studentToastTimer =
        setTimeout(
            () => {
                toast.classList.remove(
                    "show"
                );
            },
            3000
        );
}

/* =========================================================
   AUTH SCREEN
========================================================= */

function showAuth() {

    document
        .querySelector("#authScreen")
        ?.classList.remove("hidden");

    document
        .querySelector("#platform")
        ?.classList.add("hidden");
}

function showPlatform() {

    document
        .querySelector("#authScreen")
        ?.classList.add("hidden");

    document
        .querySelector("#platform")
        ?.classList.remove("hidden");

    renderAll();
}

/* =========================================================
   LOGIN / REGISTER SWITCH
========================================================= */

function showLoginBox() {

    document
        .querySelector("#loginBox")
        ?.classList.remove("hidden");

    document
        .querySelector("#registerBox")
        ?.classList.add("hidden");
}

function showRegisterBox() {

    document
        .querySelector("#loginBox")
        ?.classList.add("hidden");

    document
        .querySelector("#registerBox")
        ?.classList.remove("hidden");
}

document
    .querySelector("#showRegister")
    ?.addEventListener(
        "click",
        showRegisterBox
    );

document
    .querySelector("#showLogin")
    ?.addEventListener(
        "click",
        showLoginBox
    );

document
    .querySelector("#backToLogin")
    ?.addEventListener(
        "click",
        showLoginBox
    );

/* =========================================================
   VALIDATE PHONE
========================================================= */

function cleanPhone(value) {

    return String(value || "")
        .replace(/[^\d+]/g, "")
        .replace(/\s+/g, "");
}

function isValidPhone(value) {

    const phone =
        cleanPhone(value);

    const digits =
        phone.replace(/\D/g, "");

    return (
        digits.length >= 10 &&
        digits.length <= 15
    );
}

/* =========================================================
   GRADES
========================================================= */

const GRADES = {

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

function populateGrades() {

    const stage =
        document.querySelector(
            "#registerStage"
        )?.value;

    const grade =
        document.querySelector(
            "#registerGrade"
        );

    if (!grade) {
        return;
    }

    grade.innerHTML = "";

    if (!stage || !GRADES[stage]) {

        grade.disabled = true;

        grade.innerHTML = `
            <option value="">
                اختر المرحلة أولاً
            </option>
        `;

        return;
    }

    grade.disabled = false;

    grade.innerHTML = `
        <option value="">
            اختر الصف
        </option>

        ${GRADES[stage]
            .map(item => `
                <option value="${escapeHTML(item)}">
                    ${escapeHTML(item)}
                </option>
            `)
            .join("")}
    `;
}

document
    .querySelector("#registerStage")
    ?.addEventListener(
        "change",
        () => {

            populateGrades();

            const group =
                document.querySelector(
                    "#registerGroup"
                );

            if (group) {

                group.disabled = true;

                group.innerHTML = `
                    <option value="">
                        اختر الصف أولاً
                    </option>
                `;
            }
        }
    );

/* =========================================================
   GROUPS BY GRADE
========================================================= */

function populateRegisterGroups() {

    const grade =
        document.querySelector(
            "#registerGrade"
        )?.value;

    const select =
        document.querySelector(
            "#registerGroup"
        );

    if (!select) {
        return;
    }

    const groups =
        getGroups();

    select.innerHTML = "";

    if (!grade) {

        select.disabled = true;

        select.innerHTML = `
            <option value="">
                اختر الصف أولاً
            </option>
        `;

        return;
    }

    const matchingGroups =
        groups.filter(group => {

            const groupGrade =
                normalize(
                    group.grade
                );

            return (
                !groupGrade ||
                groupGrade ===
                normalize(grade)
            );
        });

    select.disabled = false;

    if (!matchingGroups.length) {

        select.innerHTML = `
            <option value="">
                لا توجد مجموعات لهذا الصف
            </option>
        `;

        return;
    }

    select.innerHTML = `
        <option value="">
            اختر المجموعة
        </option>

        ${matchingGroups
            .map(group => `
                <option
                    value="${escapeHTML(group.id)}"
                >
                    ${escapeHTML(
                        group.name ||
                        "مجموعة"
                    )}
                </option>
            `)
            .join("")}
    `;
}

document
    .querySelector("#registerGrade")
    ?.addEventListener(
        "change",
        populateRegisterGroups
    );

/* =========================================================
   REGISTER
========================================================= */

document
    .querySelector("#registerForm")
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const name =
                normalize(
                    document.querySelector(
                        "#registerName"
                    )?.value
                );

            const phone =
                cleanPhone(
                    document.querySelector(
                        "#registerPhone"
                    )?.value
                );

            const guardianPhone =
                cleanPhone(
                    document.querySelector(
                        "#registerGuardianPhone"
                    )?.value
                );

            const stage =
                normalize(
                    document.querySelector(
                        "#registerStage"
                    )?.value
                );

            const grade =
                normalize(
                    document.querySelector(
                        "#registerGrade"
                    )?.value
                );

            const groupId =
                normalize(
                    document.querySelector(
                        "#registerGroup"
                    )?.value
                );

            const password =
                document.querySelector(
                    "#registerPassword"
                )?.value || "";

            const confirmPassword =
                document.querySelector(
                    "#registerConfirmPassword"
                )?.value || "";

            const terms =
                document.querySelector(
                    "#acceptTerms"
                )?.checked;

            if (name.length < 3) {

                showToast(
                    "تنبيه",
                    "اكتب اسم الطالب بالكامل."
                );

                return;
            }

            if (!isValidPhone(phone)) {

                showToast(
                    "تنبيه",
                    "الرقم الأساسي غير صحيح."
                );

                return;
            }

            if (!isValidPhone(
                guardianPhone
            )) {

                showToast(
                    "تنبيه",
                    "رقم ولي الأمر غير صحيح."
                );

                return;
            }

            if (phone === guardianPhone) {

                showToast(
                    "تنبيه",
                    "رقم الطالب ورقم ولي الأمر يجب أن يكونا مختلفين."
                );

                return;
            }

            if (!stage) {

                showToast(
                    "تنبيه",
                    "اختر المرحلة الدراسية."
                );

                return;
            }

            if (!grade) {

                showToast(
                    "تنبيه",
                    "اختر الصف الدراسي."
                );

                return;
            }

            if (!groupId) {

                showToast(
                    "تنبيه",
                    "اختر المجموعة."
                );

                return;
            }

            if (password.length < 6) {

                showToast(
                    "تنبيه",
                    "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
                );

                return;
            }

            if (password !== confirmPassword) {

                showToast(
                    "تنبيه",
                    "كلمتا المرور غير متطابقتين."
                );

                return;
            }

            if (!terms) {

                showToast(
                    "تنبيه",
                    "يجب الموافقة على صحة البيانات."
                );

                return;
            }

            const accounts =
                getAccounts();

            const exists =
                accounts.some(
                    account =>
                        cleanPhone(
                            account.phone
                        ) === phone
                );

            if (exists) {

                showToast(
                    "الحساب موجود",
                    "هذا الرقم لديه حساب بالفعل."
                );

                showLoginBox();

                const loginPhone =
                    document.querySelector(
                        "#loginPhone"
                    );

                if (loginPhone) {
                    loginPhone.value = phone;
                }

                const loginNameField =
                    document.querySelector(
                        "#loginName"
                    );

                if (loginNameField) {
                    loginNameField.value = name;
                }

                return;
            }

            const requests =
                getJoinRequests();

            const pendingExists =
                requests.some(
                    request =>
                        cleanPhone(
                            request.phone
                        ) === phone &&
                        request.status !== "approved" &&
                        request.status !== "rejected"
                );

            if (pendingExists) {

                showToast(
                    "الطلب قيد المراجعة",
                    "طلب الانضمام بهذا الرقم قيد المراجعة بالفعل، من فضلك انتظري رد المس."
                );

                return;
            }

            // Join requests only go into the pending-approval
            // queue here. The account itself (studentAccounts)
            // is created by the teacher dashboard once the
            // request is approved — see teacher.js confirmApproval.
            const request = {

                id:
                    `request_${Date.now()}`,

                name,

                phone,

                guardianPhone,

                stage,

                grade,

                groupId,

                password,

                status:
                    "pending",

                createdAt:
                    new Date().toISOString()
            };

            requests.push(
                request
            );

            saveJoinRequests(
                requests
            );

            showToast(
                "تم إرسال طلب الانضمام",
                "هيتم مراجعة طلبك من المس، وهتقدري تسجلي الدخول بعد الموافقة."
            );

            setTimeout(
                () => {
                    showLoginBox();

                    const loginPhone =
                        document.querySelector(
                            "#loginPhone"
                        );

                    if (loginPhone) {
                        loginPhone.value = phone;
                    }
                },
                800
            );
        }
    );

/* =========================================================
   LOGIN
========================================================= */

document
    .querySelector("#loginForm")
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const name =
                normalize(
                    document.querySelector(
                        "#loginName"
                    )?.value
                );

            const phone =
                cleanPhone(
                    document.querySelector(
                        "#loginPhone"
                    )?.value
                );

            const password =
                normalize(
                    document.querySelector(
                        "#loginPassword"
                    )?.value
                );

            // Admin / teacher quick login
            // Name: admin | Phone: 01000000000 | Password: admin123
            // This login does not require creating a student account.
            if (
                name.toLowerCase() === "admin" &&
                phone === "01000000000" &&
                password === "admin123"
            ) {

                localStorage.setItem("teacherAuthenticated", "true");
                localStorage.setItem("teacherUsername", "admin");

                showToast(
                    "تم تسجيل الدخول",
                    "مرحباً بك في واجهة المس."
                );

                setTimeout(() => {
                    window.location.href = "/teacher/";
                }, 400);

                return;
            }

            if (!name || !phone || !password) {

                showToast(
                    "تنبيه",
                    "أدخل الاسم والرقم وكلمة المرور."
                );

                return;
            }

            const account =
                getAccounts().find(
                    item =>
                        normalize(
                            item.name
                        ).toLowerCase() ===
                        name.toLowerCase() &&
                        cleanPhone(
                            item.phone
                        ) === phone &&
                        item.password ===
                        password
                );

            if (!account) {

                showToast(
                    "فشل الدخول",
                    "الاسم أو الرقم أو كلمة المرور غير صحيحة."
                );

                return;
            }

            localStorage.setItem(
                STORAGE.currentStudent,
                account.id
            );

            showToast(
                "مرحباً بك",
                `أهلاً ${account.name}`
            );

            setTimeout(
                showPlatform,
                400
            );
        }
    );

/* =========================================================
   FORGOT PASSWORD
========================================================= */

document
    .querySelector("#forgotPasswordButton")
    ?.addEventListener(
        "click",
        () => {

            document
                .querySelector(
                    "#forgotModal"
                )
                ?.classList.add("show");
        }
    );

document.addEventListener(
    "click",
    event => {

        if (
            event.target.closest(
                "[data-close-forgot]"
            )
        ) {

            document
                .querySelector(
                    "#forgotModal"
                )
                ?.classList.remove(
                    "show"
                );
        }
    }
);

document
    .querySelector(
        "#resetPasswordButton"
    )
    ?.addEventListener(
        "click",
        () => {

            const phone =
                cleanPhone(
                    document.querySelector(
                        "#forgotPhone"
                    )?.value
                );

            const newPassword =
                document.querySelector(
                    "#forgotNewPassword"
                )?.value || "";

            if (!isValidPhone(phone)) {

                showToast(
                    "تنبيه",
                    "أدخل الرقم الأساسي بشكل صحيح."
                );

                return;
            }

            if (newPassword.length < 6) {

                showToast(
                    "تنبيه",
                    "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل."
                );

                return;
            }

            const accounts =
                getAccounts();

            const index =
                accounts.findIndex(
                    item =>
                        cleanPhone(
                            item.phone
                        ) === phone
                );

            if (index === -1) {

                showToast(
                    "الحساب غير موجود",
                    "لا يوجد حساب بهذا الرقم."
                );

                return;
            }

            accounts[index].password =
                newPassword;

            saveAccounts(
                accounts
            );

            document
                .querySelector(
                    "#forgotModal"
                )
                ?.classList.remove(
                    "show"
                );

            showToast(
                "تم التغيير",
                "تم تحديث كلمة المرور."
            );
        }
    );

/* =========================================================
   PASSWORD TOGGLE
========================================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".password-toggle"
            );

        if (!button) {
            return;
        }

        const targetId =
            button.dataset.target;

        const input =
            document.getElementById(
                targetId
            );

        if (!input) {
            return;
        }

        const icon =
            button.querySelector("i");

        if (
            input.type ===
            "password"
        ) {

            input.type =
                "text";

            icon.className =
                "fa-regular fa-eye-slash";

        } else {

            input.type =
                "password";

            icon.className =
                "fa-regular fa-eye";
        }
    }
);

/* =========================================================
   NAVIGATION
========================================================= */

const PAGE_META = {

    overview: {
        title: "الرئيسية",
        subtitle: "أهلاً بك في منصتك التعليمية"
    },

    lessons: {
        title: "الدروس",
        subtitle: "تابع الدروس الخاصة بك"
    },

    tests: {
        title: "الاختبارات",
        subtitle: "اختبر مستواك"
    },

    files: {
        title: "الملفات والمذكرات",
        subtitle: "كل ملفاتك التعليمية"
    },

    classes: {
        title: "الحصص الأونلاين",
        subtitle: "الحصص المباشرة"
    },

    notifications: {
        title: "الإشعارات",
        subtitle: "آخر التنبيهات"
    },

    chat: {
        title: "المحادثات",
        subtitle: "تواصل مع الأستاذة"
    },

    payments: {
        title: "المدفوعات",
        subtitle: "حالة الحساب المالي"
    },

    settings: {
        title: "الإعدادات",
        subtitle: "إعدادات الحساب والمنصة"
    }

};

function navigateTo(page) {

    if (!PAGE_META[page]) {
        page = "overview";
    }

    state.page =
        page;

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page ===
                page
            );
        });

    document
        .querySelectorAll(
            ".page"
        )
        .forEach(section => {

            section.classList.toggle(
                "active",
                section.id ===
                `page-${page}`
            );
        });

    const meta =
        PAGE_META[page];

    document.querySelector(
        "#pageTitle"
    ).textContent =
        meta.title;

    document.querySelector(
        "#pageSubtitle"
    ).textContent =
        meta.subtitle;

    document
        .querySelector(
            "#sidebar"
        )
        ?.classList.remove(
            "open"
        );

    renderPage(
        page
    );
}

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-page]"
            );

        if (!button) {
            return;
        }

        navigateTo(
            button.dataset.page
        );
    }
);

/* =========================================================
   PROFILE
========================================================= */

function renderProfile() {

    const student =
        getCurrentStudent();

    const group =
        getCurrentGroup();

    if (!student) {
        return;
    }

    const groupName =
        group?.name ||
        "المجموعة الخاصة بك";

    const name =
        student.name ||
        "الطالب";

    document.querySelector(
        "#sidebarStudentName"
    ).textContent =
        name;

    document.querySelector(
        "#sidebarStudentGroup"
    ).textContent =
        groupName;

    document.querySelector(
        "#heroStudentName"
    ).textContent =
        name;

    document.querySelector(
        "#heroGroupName"
    ).textContent =
        groupName;

    document.querySelector(
        "#profileName"
    ).textContent =
        name;

    document.querySelector(
        "#profilePhone"
    ).textContent =
        student.phone || "-";

    document.querySelector(
        "#profileGuardian"
    ).textContent =
        student.guardianPhone || "-";
}

/* =========================================================
   GROUP SELECTORS
========================================================= */

function populatePlatformGroups() {

    const groups =
        getGroups();

    const student =
        getCurrentStudent();

    const studentGroup =
        student?.groupId || "";

    const selectors = [
        "overviewGroupSelect",
        "lessonGroupSelect",
        "testGroupSelect",
        "fileGroupSelect",
        "settingsGroupSelect"
    ];

    selectors.forEach(id => {

        const select =
            document.querySelector(
                `#${id}`
            );

        if (!select) {
            return;
        }

        select.innerHTML = "";

        groups.forEach(
            group => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    group.id;

                option.textContent =
                    group.name ||
                    "مجموعة";

                select.appendChild(
                    option
                );
            }
        );

        if (studentGroup) {
            select.value =
                studentGroup;
        }
    });

    if (!groups.length) {

        selectors.forEach(id => {

            const select =
                document.querySelector(
                    `#${id}`
                );

            if (!select) {
                return;
            }

            select.innerHTML = `
                <option value="">
                    لا توجد مجموعات
                </option>
            `;
        });
    }
}

function changeStudentGroup(groupId) {

    const student =
        getCurrentStudent();

    if (!student) {
        return;
    }

    const group =
        getGroupById(
            groupId
        );

    if (!group) {

        showToast(
            "تنبيه",
            "المجموعة غير موجودة."
        );

        return;
    }

    const accounts =
        getAccounts();

    const index =
        accounts.findIndex(
            item =>
                item.id ===
                student.id
        );

    if (index === -1) {
        return;
    }

    accounts[index].groupId =
        groupId;

    saveAccounts(
        accounts
    );

    renderAll();

    showToast(
        "تم تحديث المجموعة",
        `تم اختيار ${group.name || "المجموعة"}`
    );
}

document.addEventListener(
    "change",
    event => {

        const ids = [
            "overviewGroupSelect",
            "lessonGroupSelect",
            "testGroupSelect",
            "fileGroupSelect"
        ];

        if (
            ids.includes(
                event.target.id
            )
        ) {

            changeStudentGroup(
                event.target.value
            );
        }
    }
);

document
    .querySelector(
        "#saveGroupButton"
    )
    ?.addEventListener(
        "click",
        () => {

            const select =
                document.querySelector(
                    "#settingsGroupSelect"
                );

            changeStudentGroup(
                select?.value
            );
        }
    );

/* =========================================================
   OVERVIEW
========================================================= */

function renderOverview() {

    const lessons =
        filterStudentContent(
            readJSON(
                STORAGE.lessons,
                []
            )
        );

    const tests =
        filterStudentContent(
            readJSON(
                STORAGE.tests,
                []
            )
        );

    const files =
        filterStudentContent(
            readJSON(
                STORAGE.files,
                []
            )
        );

    const classes =
        filterStudentContent(
            readJSON(
                STORAGE.classes,
                []
            )
        );

    document.querySelector(
        "#statLessons"
    ).textContent =
        lessons.length;

    document.querySelector(
        "#statTests"
    ).textContent =
        tests.length;

    document.querySelector(
        "#statFiles"
    ).textContent =
        files.length;

    document.querySelector(
        "#statClasses"
    ).textContent =
        classes.length;

    renderLatestLessons(
        lessons
    );

    renderLatestClasses(
        classes
    );
}

/* =========================================================
   LATEST
========================================================= */

function renderLatestLessons(data) {

    const container =
        document.querySelector(
            "#latestLessons"
        );

    if (!container) {
        return;
    }

    const items =
        data
            .slice()
            .reverse()
            .slice(0,4);

    if (!items.length) {

        container.innerHTML =
            emptyHTML(
                "لا توجد دروس",
                "ستظهر الدروس هنا عند إضافتها."
            );

        return;
    }

    container.innerHTML =
        items.map(
            lesson => `

                <div class="preview-item">

                    <div class="preview-icon purple">
                        <i class="fa-solid fa-play"></i>
                    </div>

                    <div class="preview-data">

                        <strong>
                            ${escapeHTML(
                                lesson.title ||
                                "درس"
                            )}
                        </strong>

                        <span>
                            ${lesson.videoName
                                ? "فيديو متاح"
                                : "درس تعليمي"}
                        </span>

                    </div>

                    <button
                        class="preview-button"
                        data-open-lesson="${escapeHTML(
                            lesson.id
                        )}"
                    >
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>

                </div>

            `
        ).join("");
}

function renderLatestClasses(data) {

    const container =
        document.querySelector(
            "#latestClasses"
        );

    if (!container) {
        return;
    }

    const items =
        data
            .slice()
            .reverse()
            .slice(0,4);

    if (!items.length) {

        container.innerHTML =
            emptyHTML(
                "لا توجد حصص",
                "ستظهر الحصص القادمة هنا."
            );

        return;
    }

    container.innerHTML =
        items.map(
            item => `

                <div class="preview-item">

                    <div class="preview-icon red">
                        <i class="fa-solid fa-video"></i>
                    </div>

                    <div class="preview-data">

                        <strong>
                            ${escapeHTML(
                                item.title ||
                                "حصة أونلاين"
                            )}
                        </strong>

                        <span>
                            ${
                                item.date
                                    ? formatShortDate(
                                        item.date
                                    )
                                    : "موعد الحصة"
                            }
                        </span>

                    </div>

                    <button
                        class="preview-button"
                        data-open-class="${escapeHTML(
                            item.id
                        )}"
                    >
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>

                </div>

            `
        ).join("");
}

/* =========================================================
   LESSONS
========================================================= */

function renderLessons() {

    const grid =
        document.querySelector(
            "#lessonsGrid"
        );

    if (!grid) {
        return;
    }

    let data =
        filterStudentContent(
            readJSON(
                STORAGE.lessons,
                []
            )
        );

    const search =
        state.lessonSearch
            .trim()
            .toLowerCase();

    if (search) {

        data =
            data.filter(
                item =>
                    String(
                        item.title || ""
                    )
                        .toLowerCase()
                        .includes(search)
            );
    }

    if (!data.length) {

        grid.innerHTML =
            emptyHTML(
                "لا توجد دروس حالياً",
                "الدروس الجديدة ستظهر هنا."
            );

        return;
    }

    grid.innerHTML =
        data.map(
            lesson => {

                const video =
                    lesson.videoUrl ||
                    lesson.videoURL ||
                    lesson.video?.url;

                return `

                    <article class="lesson-card">

                        <div class="lesson-cover">

                            <i class="fa-solid fa-play"></i>

                        </div>

                        <div class="card-body">

                            <span class="card-tag tag-purple">

                                <i class="fa-solid fa-book-open"></i>

                                درس

                            </span>

                            <h4>
                                ${escapeHTML(
                                    lesson.title ||
                                    "درس"
                                )}
                            </h4>

                            <p class="card-description">
                                ${escapeHTML(
                                    lesson.description ||
                                    "اضغط على مشاهدة لفتح الدرس."
                                )}
                            </p>

                            <div class="card-footer">

                                <span class="card-meta">
                                    ${
                                        video
                                            ? "فيديو متاح"
                                            : lesson.videoName
                                                ? "فيديو مرفق"
                                                : "محتوى تعليمي"
                                    }
                                </span>

                                <button
                                    class="card-button"
                                    data-open-lesson="${escapeHTML(
                                        lesson.id
                                    )}"
                                >
                                    مشاهدة
                                </button>

                            </div>

                        </div>

                    </article>
                `;
            }
        ).join("");
}

document
    .querySelector(
        "#lessonSearch"
    )
    ?.addEventListener(
        "input",
        event => {

            state.lessonSearch =
                event.target.value;

            renderLessons();
        }
    );

/* =========================================================
   LESSON MODAL
========================================================= */

function openLesson(lesson) {

    const modal =
        document.querySelector(
            "#lessonModal"
        );

    const video =
        document.querySelector(
            "#lessonVideo"
        );

    const placeholder =
        document.querySelector(
            "#videoPlaceholder"
        );

    document.querySelector(
        "#modalLessonTitle"
    ).textContent =
        lesson.title ||
        "الدرس";

    document.querySelector(
        "#modalLessonDescription"
    ).textContent =
        lesson.description ||
        "لا يوجد وصف لهذا الدرس.";

    const source =
        lesson.videoUrl ||
        lesson.videoURL ||
        lesson.video?.url ||
        "";

    video.pause();

    video.removeAttribute(
        "src"
    );

    video.load();

    video.style.display =
        "none";

    placeholder.style.display =
        "flex";

    if (source) {

        video.src =
            source;

        video.style.display =
            "block";

        placeholder.style.display =
            "none";
    }

    modal.classList.add(
        "show"
    );
}

function closeLesson() {

    const modal =
        document.querySelector(
            "#lessonModal"
        );

    const video =
        document.querySelector(
            "#lessonVideo"
        );

    video?.pause();

    video?.removeAttribute(
        "src"
    );

    video?.load();

    modal?.classList.remove(
        "show"
    );
}

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-open-lesson]"
            );

        if (button) {

            const lesson =
                readJSON(
                    STORAGE.lessons,
                    []
                ).find(
                    item =>
                        normalize(item.id) ===
                        normalize(
                            button.dataset.openLesson
                        )
                );

            if (lesson) {
                openLesson(
                    lesson
                );
            }
        }

        if (
            event.target.closest(
                "[data-close-lesson]"
            )
        ) {
            closeLesson();
        }
    }
);

/* =========================================================
   TESTS
========================================================= */

function renderTests() {

    const grid =
        document.querySelector(
            "#testsGrid"
        );

    if (!grid) {
        return;
    }

    let data =
        filterStudentContent(
            readJSON(
                STORAGE.tests,
                []
            )
        );

    const search =
        state.testSearch
            .trim()
            .toLowerCase();

    if (search) {

        data =
            data.filter(
                item =>
                    String(
                        item.title || ""
                    )
                        .toLowerCase()
                        .includes(search)
            );
    }

    if (!data.length) {

        grid.innerHTML =
            emptyHTML(
                "لا توجد اختبارات",
                "الاختبارات الجديدة ستظهر هنا."
            );

        return;
    }

    grid.innerHTML =
        data.map(
            test => `

                <article class="test-card">

                    <div class="card-body">

                        <span class="card-tag tag-green">

                            <i class="fa-solid fa-clipboard-check"></i>

                            اختبار

                        </span>

                        <h4>
                            ${escapeHTML(
                                test.title ||
                                "اختبار"
                            )}
                        </h4>

                        <p class="card-description">
                            ${escapeHTML(
                                test.description ||
                                "اختبار خاص بالمجموعة."
                            )}
                        </p>

                        <div class="card-footer">

                            <span class="card-meta">
                                ${
                                    test.date
                                        ? formatShortDate(
                                            test.date
                                        )
                                        : "بدون موعد"
                                }
                            </span>

                            <button
                                class="card-button"
                                data-open-test="${escapeHTML(
                                    test.id
                                )}"
                            >
                                فتح الاختبار
                            </button>

                        </div>

                    </div>

                </article>

            `
        ).join("");
}

document
    .querySelector(
        "#testSearch"
    )
    ?.addEventListener(
        "input",
        event => {

            state.testSearch =
                event.target.value;

            renderTests();
        }
    );

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-open-test]"
            );

        if (!button) {
            return;
        }

        showToast(
            "الاختبار",
            "سيتم تشغيل نموذج الأسئلة من الـBackend."
        );
    }
);

/* =========================================================
   FILES
========================================================= */

function renderFiles() {

    const grid =
        document.querySelector(
            "#filesGrid"
        );

    if (!grid) {
        return;
    }

    let data =
        filterStudentContent(
            readJSON(
                STORAGE.files,
                []
            )
        );

    const search =
        state.fileSearch
            .trim()
            .toLowerCase();

    if (search) {

        data =
            data.filter(
                item =>
                    String(
                        item.name ||
                        item.title ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)
            );
    }

    if (!data.length) {

        grid.innerHTML =
            emptyHTML(
                "لا توجد ملفات",
                "ستظهر الملفات والمذكرات هنا."
            );

        return;
    }

    grid.innerHTML =
        data.map(
            file => {

                const name =
                    file.name ||
                    file.title ||
                    "ملف";

                const url =
                    file.url ||
                    file.fileUrl ||
                    file.link ||
                    "";

                return `

                    <article class="file-card">

                        <div class="card-body">

                            <span class="card-tag tag-blue">

                                <i class="fa-solid fa-file"></i>

                                ملف

                            </span>

                            <h4>
                                ${escapeHTML(name)}
                            </h4>

                            <p class="card-description">
                                ${escapeHTML(
                                    file.description ||
                                    "ملف تعليمي."
                                )}
                            </p>

                            <div class="card-footer">

                                <span class="card-meta">
                                    ${escapeHTML(
                                        file.type ||
                                        "ملف"
                                    )}
                                </span>

                                ${
                                    url
                                        ? `
                                            <a
                                                href="${escapeHTML(url)}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="card-button"
                                            >
                                                فتح الملف
                                            </a>
                                          `
                                        : `
                                            <button
                                                class="card-button"
                                                disabled
                                            >
                                                غير متاح
                                            </button>
                                          `
                                }

                            </div>

                        </div>

                    </article>

                `;
            }
        ).join("");
}

document
    .querySelector(
        "#fileSearch"
    )
    ?.addEventListener(
        "input",
        event => {

            state.fileSearch =
                event.target.value;

            renderFiles();
        }
    );

/* =========================================================
   CLASSES
========================================================= */

function renderClasses() {

    const grid =
        document.querySelector(
            "#classesGrid"
        );

    if (!grid) {
        return;
    }

    const data =
        filterStudentContent(
            readJSON(
                STORAGE.classes,
                []
            )
        );

    if (!data.length) {

        grid.innerHTML =
            emptyHTML(
                "لا توجد حصص",
                "ستظهر الحصص الأونلاين هنا."
            );

        return;
    }

    grid.innerHTML =
        data
            .slice()
            .reverse()
            .map(
                item => {

                    const link =
                        item.link ||
                        item.url ||
                        "";

                    return `

                        <article class="class-card">

                            <div class="class-top">

                                <div class="class-date">

                                    <span class="class-date-icon">
                                        <i class="fa-solid fa-video"></i>
                                    </span>

                                    ${
                                        item.date
                                            ? formatDate(
                                                item.date
                                            )
                                            : "موعد الحصة"
                                    }

                                </div>

                                <span class="card-tag tag-red">
                                    مباشرة
                                </span>

                            </div>

                            <h4>
                                ${escapeHTML(
                                    item.title ||
                                    "حصة أونلاين"
                                )}
                            </h4>

                            <p>
                                ${escapeHTML(
                                    item.description ||
                                    "حصة مباشرة مع الأستاذة."
                                )}
                            </p>

                            <div class="class-footer">

                                <span class="card-meta">
                                    ${
                                        item.time ||
                                        (
                                            item.date
                                                ? formatTime(
                                                    item.date
                                                )
                                                : "التوقيت غير محدد"
                                        )
                                    }
                                </span>

                                ${
                                    link
                                        ? `
                                            <a
                                                class="card-button"
                                                href="${escapeHTML(link)}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                دخول الحصة
                                            </a>
                                          `
                                        : `
                                            <button
                                                class="card-button"
                                                disabled
                                            >
                                                الرابط غير متاح
                                            </button>
                                          `
                                }

                            </div>

                        </article>

                    `;
                }
            )
            .join("");
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function renderNotifications() {

    const container =
        document.querySelector(
            "#notificationsList"
        );

    if (!container) {
        return;
    }

    const data =
        filterStudentContent(
            readJSON(
                STORAGE.notifications,
                []
            )
        ).slice().reverse();

    const badge =
        document.querySelector(
            "#notificationBadge"
        );

    const dot =
        document.querySelector(
            "#topNotificationDot"
        );

    badge.textContent =
        data.length;

    dot.style.display =
        data.length
            ? "block"
            : "none";

    if (!data.length) {

        container.innerHTML =
            emptyHTML(
                "لا توجد إشعارات",
                "ستظهر إشعاراتك الجديدة هنا."
            );

        return;
    }

    container.innerHTML =
        data.map(
            item => `

                <article class="notification-card">

                    <div class="notification-icon">

                        <i class="fa-regular fa-bell"></i>

                    </div>

                    <div class="notification-data">

                        <div class="notification-head">

                            <strong>
                                ${escapeHTML(
                                    item.title ||
                                    "إشعار"
                                )}
                            </strong>

                            <span>
                                ${
                                    item.date ||
                                    item.createdAt
                                        ? formatShortDate(
                                            item.date ||
                                            item.createdAt
                                        )
                                        : ""
                                }
                            </span>

                        </div>

                        <p>
                            ${escapeHTML(
                                item.message ||
                                ""
                            )}
                        </p>

                    </div>

                </article>
            `
        ).join("");
}

/* =========================================================
   CHAT
========================================================= */

function renderChat() {

    const container =
        document.querySelector(
            "#messages"
        );

    if (!container) {
        return;
    }

    const student =
        getCurrentStudent();

    const allChats =
        readJSON(
            STORAGE.chats,
            []
        );

    const studentChats =
        allChats.filter(
            chat =>
                !chat.studentId ||
                chat.studentId ===
                student?.id
        );

    if (!studentChats.length) {

        container.innerHTML =
            emptyHTML(
                "ابدأ المحادثة",
                "أرسل أول رسالة للأستاذة."
            );

        return;
    }

    container.innerHTML =
        studentChats
            .slice(-60)
            .map(
                chat => {

                    const isStudent =
                        chat.senderType ===
                        "student" ||
                        chat.role ===
                        "student";

                    return `

                        <div class="message ${
                            isStudent
                                ? "student"
                                : "teacher"
                        }">

                            ${escapeHTML(
                                chat.message ||
                                ""
                            )}

                            <small>
                                ${
                                    chat.createdAt
                                        ? formatTime(
                                            chat.createdAt
                                        )
                                        : ""
                                }
                            </small>

                        </div>

                    `;
                }
            )
            .join("");

    container.scrollTop =
        container.scrollHeight;
}

document
    .querySelector(
        "#chatForm"
    )
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const input =
                document.querySelector(
                    "#chatInput"
                );

            const message =
                normalize(
                    input.value
                );

            if (!message) {
                return;
            }

            const student =
                getCurrentStudent();

            const chats =
                readJSON(
                    STORAGE.chats,
                    []
                );

            chats.push({

                id:
                    Date.now(),

                studentId:
                    student?.id || "",

                sender:
                    student?.name ||
                    "الطالب",

                senderType:
                    "student",

                role:
                    "student",

                message,

                createdAt:
                    new Date().toISOString()
            });

            writeJSON(
                STORAGE.chats,
                chats
            );

            input.value = "";

            renderChat();

            showToast(
                "تم الإرسال",
                "تم إرسال رسالتك."
            );
        }
    );

/* =========================================================
   PAYMENTS
========================================================= */

function renderPayments() {

    const student =
        getCurrentStudent();

    if (!student) {
        return;
    }

    document.querySelector(
        "#paymentStatus"
    ).textContent =
        student.paymentStatus ||
        "غير متاح";

    document.querySelector(
        "#paymentMessage"
    ).textContent =
        "بيانات الدفع مرتبطة بحساب الطالب.";
}

/* =========================================================
   INSTAPAY
========================================================= */

function getInstaPayUrl() {

    return (
        window.platformConfig?.instapayUrl ||
        localStorage.getItem(
            "instapayPaymentUrl"
        ) ||
        ""
    );
}

document
    .querySelector(
        "#instaPayButton"
    )
    ?.addEventListener(
        "click",
        () => {

            const url =
                getInstaPayUrl();

            if (!url) {

                showToast(
                    "InstaPay",
                    "سيتم ربط رابط InstaPay من الـBackend."
                );

                return;
            }

            try {

                const parsed =
                    new URL(url);

                if (
                    parsed.protocol !==
                        "https:" &&
                    parsed.protocol !==
                        "http:"
                ) {
                    throw new Error();
                }

                window.open(
                    parsed.href,
                    "_blank",
                    "noopener,noreferrer"
                );

            } catch {

                showToast(
                    "خطأ",
                    "رابط InstaPay غير صالح."
                );
            }
        }
    );

/* =========================================================
   THEME
========================================================= */

function applyTheme(
    theme
) {

    const selected =
        theme ||
        localStorage.getItem(
            STORAGE.theme
        ) ||
        "light";

    document.body.classList.toggle(
        "dark",
        selected === "dark"
    );

    document
        .querySelectorAll(
            ".appearance-option"
        )
        .forEach(
            button =>
                button.classList.toggle(
                    "active",
                    button.dataset.theme ===
                    selected
                )
        );

    localStorage.setItem(
        STORAGE.theme,
        selected
    );
}

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-theme]"
            );

        if (!button) {
            return;
        }

        applyTheme(
            button.dataset.theme
        );
    }
);

/* =========================================================
   COLOR
========================================================= */

function applyColor(
    color
) {

    const selected =
        color ||
        localStorage.getItem(
            STORAGE.color
        ) ||
        "#7c3aed";

    document.documentElement.style.setProperty(
        "--primary",
        selected
    );

    document
        .querySelectorAll(
            ".color-dot"
        )
        .forEach(
            button =>
                button.classList.toggle(
                    "active",
                    button.dataset.color ===
                    selected
                )
        );

    localStorage.setItem(
        STORAGE.color,
        selected
    );
}

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-color]"
            );

        if (!button) {
            return;
        }

        applyColor(
            button.dataset.color
        );

        showToast(
            "تم التغيير",
            "تم تحديث اللون الأساسي."
        );
    }
);

/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    localStorage.removeItem(
        STORAGE.currentStudent
    );

    state.page =
        "overview";

    showAuth();

    showLoginBox();

    const form =
        document.querySelector(
            "#loginForm"
        );

    form?.reset();

    showToast(
        "تم تسجيل الخروج",
        "يمكنك تسجيل الدخول مرة أخرى."
    );
}

document
    .querySelector(
        "#logoutButton"
    )
    ?.addEventListener(
        "click",
        logout
    );

document
    .querySelector(
        "#logoutSettingsButton"
    )
    ?.addEventListener(
        "click",
        logout
    );

/* =========================================================
   MOBILE SIDEBAR
========================================================= */

document
    .querySelector(
        "#openSidebar"
    )
    ?.addEventListener(
        "click",
        () => {

            document
                .querySelector(
                    "#sidebar"
                )
                ?.classList.add(
                    "open"
                );
        }
    );

document
    .querySelector(
        "#closeSidebar"
    )
    ?.addEventListener(
        "click",
        () => {

            document
                .querySelector(
                    "#sidebar"
                )
                ?.classList.remove(
                    "open"
                );
        }
    );

/* =========================================================
   EMPTY
========================================================= */

function emptyHTML(
    title,
    message
) {

    return `

        <div class="empty-state">

            <div class="empty-state-icon">
                <i class="fa-solid fa-inbox"></i>
            </div>

            <strong>
                ${escapeHTML(title)}
            </strong>

            <span>
                ${escapeHTML(message)}
            </span>

        </div>

    `;
}

/* =========================================================
   RENDER PAGE
========================================================= */

function renderPage(page) {

    switch (page) {

        case "overview":
            renderOverview();
            break;

        case "lessons":
            renderLessons();
            break;

        case "tests":
            renderTests();
            break;

        case "files":
            renderFiles();
            break;

        case "classes":
            renderClasses();
            break;

        case "notifications":
            renderNotifications();
            break;

        case "chat":
            renderChat();
            break;

        case "payments":
            renderPayments();
            break;

        case "settings":
            renderProfile();
            break;

    }
}

/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    renderProfile();

    populatePlatformGroups();

    renderOverview();

    renderLessons();

    renderTests();

    renderFiles();

    renderClasses();

    renderNotifications();

    renderChat();

    renderPayments();

    applyTheme();

    applyColor();

    navigateTo(
        state.page
    );
}

/* =========================================================
   STORAGE SYNC
========================================================= */

window.addEventListener(
    "storage",
    event => {

        const contentKeys = [
            STORAGE.groups,
            STORAGE.lessons,
            STORAGE.tests,
            STORAGE.files,
            STORAGE.classes,
            STORAGE.notifications,
            STORAGE.chats
        ];

        if (
            contentKeys.includes(
                event.key
            )
        ) {
            renderAll();
        }

        if (
            event.key ===
            STORAGE.accounts
        ) {

            if (
                getCurrentStudent()
            ) {
                renderAll();
            }
        }
    }
);

/* =========================================================
   INIT
========================================================= */

async function init() {

    // Wait for the shared API to hydrate localStorage before the first render.
    if (window.storageReady) {
        try {
            await window.storageReady;
        } catch (error) {
            console.warn("Cloud sync unavailable; using local data.", error);
        }
    }

    applyTheme();
    applyColor();

    const current = getCurrentStudent();

    if (current) {
        showPlatform();
    } else {
        showAuth();
        showLoginBox();
    }
}

// Refresh visible data when another device changes the shared database.
window.addEventListener("cloudDataUpdated", () => {
    if (getCurrentStudent()) {
        renderAll();
    }
});

document.addEventListener(
    "DOMContentLoaded",
    init
);