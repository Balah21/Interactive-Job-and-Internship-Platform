/**
 * NexGen Job Board core application client controller.
 * Manages view routing, local models, backend network connections, 
 * dynamic rendering, and local fallback data mode for isolated sandbox runs.
 */

// Connection settings
const BACKEND_URL = 'https://interactive-job-and-internship-platform.onrender.com';
const API_URL = `${BACKEND_URL}/api`;

// Application State
const state = {
    user: null, // Holds: { name, email, role, token }
    isBackendOnline: false,
    jobs: [], // Curated list of jobs
    activeView: 'home',
    filters: {
        type: 'all',
        query: '',
        location: '',
        minSalary: null,
        maxSalary: null
    },
    // Fallback Mock Data in case backend connection is down
    mockModeActive: false,
    mockData: {
        jobs: [
            {
                _id: "m-job1",
                title: "Software Engineer Intern",
                company: "NexGen Tech Intel",
                location: "Remote",
                type: "Remote",
                salary: 45000,
                skills: ["JavaScript", "Node.js", "CSS"],
                description: "Looking for a passsionate backend intern to help us develop our next-generation API systems. Modern JS workspace.",
                approved: true
            },
            {
                _id: "m-job2",
                title: "Full-Stack Engineer",
                company: "CyberFlow Solutions",
                location: "Bangalore, India",
                type: "Full-time",
                salary: 1200000,
                skills: ["React", "Express", "Node.js", "MongoDB"],
                description: "We are seeking a mid-level full stack dev to design secure dashboard capabilities. Node and Express experience required.",
                approved: true
            },
            {
                _id: "m-job3",
                title: "UI Designer & Developer",
                company: "Atmosphere Labs",
                location: "Mumbai, India",
                type: "Part-time",
                salary: 300000,
                skills: ["CSS", "HTML", "Figma"],
                description: "Create stunning glassmorphic UI designs. Visual excellence and attention to micro-animations is highly prioritized.",
                approved: true
            },
            {
                _id: "m-job4",
                title: "Database Administrator",
                company: "Datastore Inc",
                location: "Delhi, India",
                type: "Full-time",
                salary: 950000,
                skills: ["MongoDB", "SQL"],
                description: "Help us optimize index schemas and run data pipelines natively. Clean database hygiene is essential.",
                approved: false
            }
        ],
        applications: [
            {
                _id: "m-app1",
                job: { _id: "m-job1", title: "Software Engineer Intern", company: "NexGen Tech Intel" },
                student: { name: "Test Student", email: "student@test.com" },
                createdAt: new Date().toISOString(),
                status: "applied"
            }
        ],
        profile: {
            skills: ["JavaScript", "Node.js", "React", "MongoDB"],
            education: "Bachelor of Technology in IT",
            experience: "Completed a 3-month internship building full stack web pages",
            resumeUrl: ""
        },
        users: [
            { _id: "m-u1", name: "Test Student", email: "student@test.com", role: "student" },
            { _id: "m-u2", name: "Test Employer", email: "employer@test.com", role: "employer" },
            { _id: "m-u3", name: "Test Admin", email: "admin@test.com", role: "admin" }
        ]
    }
};

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';
    if (type === 'info') iconClass = 'fa-circle-info';
    
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <div>${message}</div>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slide-in 0.3s ease-in reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// API HELPER INTERACTION
// ==========================================
async function apiCall(endpoint, method = 'GET', body = null, isMultipart = false) {
    const headers = {};
    
    // Add JWT Token if available
    if (state.user && state.user.token) {
        headers['Authorization'] = `Bearer ${state.user.token}`;
    }
    
    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = isMultipart ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        let data = {};
        try {
            data = await response.json();
        } catch (e) {
            // No json body
        }
        
        if (!response.ok) {
            throw new Error(data.message || `API error (${response.status})`);
        }
        return data;
    } catch (error) {
        console.error(`API Call failed (${endpoint}):`, error);
        throw error;
    }
}

// Check if Express backend is running
async function testBackendConnection() {
    const badge = document.getElementById('connection-badge');
    try {
        const res = await fetch(`${API_URL}/health`);
        if (res.ok) {
            state.isBackendOnline = true;
            state.mockModeActive = false;
            badge.innerText = "Backend Connected";
            badge.className = "connection-badge online";
            badge.title = "Connected securely to server at " + BACKEND_URL;
        } else {
            throw new Error();
        }
    } catch (err) {
        state.isBackendOnline = false;
        state.mockModeActive = true;
        badge.innerText = "Sandbox Mode Active";
        badge.className = "connection-badge offline";
        badge.title = "Backend is offline. Using local simulated data sandbox.";
        console.warn("Backend offline. Fallback to mock/sandbox simulation enabled.");
    }
}

// ==========================================
// AUTHENTICATION MANAGEMENT
// ==========================================
function loadSavedSession() {
    const savedUser = localStorage.getItem('nexgen_user');
    if (savedUser) {
        try {
            state.user = JSON.parse(savedUser);
            updateNavbarState();
            showToast(`Welcome back, ${state.user.name}!`, 'info');
            return true;
        } catch (e) {
            localStorage.removeItem('nexgen_user');
        }
    }
    return false;
}

function updateNavbarState() {
    const loginBtn = document.getElementById('login-nav-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileBadge = document.getElementById('user-profile-badge');
    const nameDisplay = profileBadge.querySelector('.user-name-display');
    const roleBadge = profileBadge.querySelector('.user-role-badge');
    
    // Role based link tags
    const studentOnly = document.querySelectorAll('.student-only');
    const employerOnly = document.querySelectorAll('.employer-only');
    const adminOnly = document.querySelectorAll('.admin-only');

    // Default: Hide all role panels
    studentOnly.forEach(el => el.classList.add('hidden'));
    employerOnly.forEach(el => el.classList.add('hidden'));
    adminOnly.forEach(el => el.classList.add('hidden'));

    if (state.user) {
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        
        nameDisplay.innerText = state.user.name;
        roleBadge.innerText = state.user.role;
        profileBadge.classList.remove('hidden');

        // Show roles views
        if (state.user.role === 'student') {
            studentOnly.forEach(el => el.classList.remove('hidden'));
        } else if (state.user.role === 'employer') {
            employerOnly.forEach(el => el.classList.remove('hidden'));
        } else if (state.user.role === 'admin') {
            adminOnly.forEach(el => el.classList.remove('hidden'));
        }
    } else {
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        profileBadge.classList.add('hidden');
    }
}

async function handleLogin(email, password) {
    if (state.mockModeActive) {
        // Authenticate with mock users match
        const found = state.mockData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (found) {
            state.user = {
                name: found.name,
                email: found.email,
                role: found.role,
                token: "mock-jwt-token-string"
            };
            localStorage.setItem('nexgen_user', JSON.stringify(state.user));
            updateNavbarState();
            showToast(`Successfully logged in as ${state.user.name} (Simulated)`, 'success');
            switchView('home');
        } else {
            showToast("Invalid credentials. In Sandbox mode, use student@test.com, employer@test.com, or admin@test.com.", "error");
        }
        return;
    }

    try {
        const response = await apiCall('/auth/login', 'POST', { email, password });
        if (response.token) {
            state.user = {
                name: response.user.name,
                email: response.user.email,
                role: response.user.role,
                token: response.token
            };
            localStorage.setItem('nexgen_user', JSON.stringify(state.user));
            updateNavbarState();
            showToast(`Successfully logged in as ${response.user.name}!`, 'success');
            switchView('home');
        }
    } catch (err) {
        showToast(err.message || 'Login credentials invalid', 'error');
    }
}

async function handleRegister(name, email, role, password) {
    if (state.mockModeActive) {
        const newUser = {
            _id: `m-u-${Date.now()}`,
            name,
            email,
            role
        };
        state.mockData.users.push(newUser);
        state.user = { ...newUser, token: "mock-jwt-token" };
        localStorage.setItem('nexgen_user', JSON.stringify(state.user));
        updateNavbarState();
        showToast(`Registration Successful! (Sandbox Account)`, 'success');
        switchView('home');
        return;
    }

    try {
        const response = await apiCall('/auth/register', 'POST', { name, email, role, password });
        if (response.token) {
            state.user = {
                name: response.user.name,
                email: response.user.email,
                role: response.user.role,
                token: response.token
            };
            localStorage.setItem('nexgen_user', JSON.stringify(state.user));
            updateNavbarState();
            showToast('Registration Successful!', 'success');
            switchView('home');
        }
    } catch (err) {
        showToast(err.message || 'Registration failed. Check format or network.', 'error');
    }
}

function handleLogout() {
    state.user = null;
    localStorage.removeItem('nexgen_user');
    updateNavbarState();
    showToast('Logged out of session', 'info');
    switchView('home');
}

// ==========================================
// SPA ROUTER
// ==========================================
function switchView(viewName) {
    // Hide menus if open (responsive menu)
    document.getElementById('nav-menu').classList.remove('active');
    
    // Toggle active classes on NAV
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-view') === viewName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Toggle View Sections
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });

    const activeSec = document.getElementById(`${viewName}-view`);
    if (activeSec) {
        activeSec.classList.add('active');
        state.activeView = viewName;
        
        // Trigger specific loaders when switching into a board
        if (viewName === 'home') {
            loadJobsListings();
        } else if (viewName === 'student-dashboard') {
            loadStudentDashboard();
        } else if (viewName === 'employer-dashboard') {
            loadEmployerDashboard();
        } else if (viewName === 'admin-dashboard') {
            loadAdminDashboard();
        }
    }
}

// ==========================================
// JOB LISTING FLOWS (HOME VIEW)
// ==========================================
async function loadJobsListings() {
    const grid = document.getElementById('jobs-grid-root');
    const loader = document.getElementById('jobs-loader');
    const noJobs = document.getElementById('no-jobs-card');

    loader.classList.remove('hidden');
    grid.innerHTML = '';
    noJobs.classList.add('hidden');

    try {
        let rawJobs = [];
        if (state.mockModeActive) {
            rawJobs = state.mockData.jobs;
        } else {
            rawJobs = await apiCall('/jobs');
        }

        // Save raw jobs array state
        state.jobs = rawJobs;
        renderFilteredJobs();
    } catch (err) {
        console.error(err);
        showToast("Error retrieving job postings. Using local data.", 'error');
        state.mockModeActive = true;
        state.jobs = state.mockData.jobs;
        renderFilteredJobs();
    } finally {
        loader.classList.add('hidden');
    }
}

function renderFilteredJobs() {
    const grid = document.getElementById('jobs-grid-root');
    const noJobs = document.getElementById('no-jobs-card');
    grid.innerHTML = '';

    // Apply UI Filter criteria
    const filtered = state.jobs.filter(job => {
        // Enforce approved true unless admin is viewing
        const isApproved = job.approved === true || job.approved === undefined;
        if (!isApproved && (!state.user || state.user.role !== 'admin')) {
             return false;
        }

        // Job type pill selection filter
        if (state.filters.type !== 'all') {
            if (state.filters.type === 'Remote') {
                if (job.type !== 'Remote' && !job.location.toLowerCase().includes('remote')) return false;
            } else {
                if (job.type !== state.filters.type) return false;
            }
        }

        // Search text matching (title, company, or skills)
        if (state.filters.query) {
            const query = state.filters.query.toLowerCase();
            const titleMatch = job.title.toLowerCase().includes(query);
            const compMatch = job.company.toLowerCase().includes(query);
            const skillsMatch = job.skills.some(s => s.toLowerCase().includes(query));
            if (!titleMatch && !compMatch && !skillsMatch) return false;
        }

        // Location text matching
        if (state.filters.location) {
            const loc = state.filters.location.toLowerCase();
            if (!job.location.toLowerCase().includes(loc)) return false;
        }

        // Min/Max Salary constraint matches
        if (state.filters.minSalary && job.salary < state.filters.minSalary) return false;
        if (state.filters.maxSalary && job.salary > state.filters.maxSalary) return false;

        return true;
    });

    // Update hero stats display
    document.getElementById('stat-total-jobs').innerText = filtered.length;
    
    // Dynamic employer stats estimate
    const uniqueComps = new Set(state.jobs.map(j => j.company)).size;
    document.getElementById('stat-companies').innerText = Math.max(uniqueComps, state.mockModeActive ? 3 : 1);
    document.getElementById('stat-students').innerText = state.mockModeActive ? 14 : 5;

    if (filtered.length === 0) {
        noJobs.classList.remove('hidden');
        return;
    }

    filtered.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';
        
        let typeBadgeClass = 'badge-fulltime';
        if (job.type === 'Part-time') typeBadgeClass = 'badge-parttime';
        if (job.type === 'Remote') typeBadgeClass = 'badge-remote';
        if (job.type === 'Internship') typeBadgeClass = 'badge-internship';

        // Render skill tags list
        const skillTags = job.skills.map(s => `<span class="tag-badge">${s}</span>`).join('');

        // Formatting Salary display
        const salaryFormatted = job.salary ? `₹${job.salary.toLocaleString()}` : "Stipend / Disclosed Later";

        card.innerHTML = `
            <div class="job-card-header">
                <div>
                    <h3 class="job-card-title">${job.title}</h3>
                    <div class="job-company">${job.company}</div>
                </div>
                <span class="badge-tag ${typeBadgeClass}">${job.type}</span>
            </div>
            
            <div class="job-salary-limit">${salaryFormatted}</div>
            
            <p class="job-card-desc">${job.description}</p>
            
            <div class="tag-list">
                ${skillTags}
            </div>

            <div class="job-card-footer">
                <div class="job-location"><i class="fa-solid fa-location-dot"></i> ${job.location}</div>
                <button class="btn btn-secondary btn-sm select-job-btn" data-id="${job._id}">View Details</button>
            </div>
        `;
        grid.appendChild(card);
    });

    // Attach click events on detail action buttons
    document.querySelectorAll('.select-job-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            showJobDetails(id);
        });
    });
}

// Show details modular view info
function showJobDetails(id) {
    const job = state.jobs.find(j => j._id === id);
    if (!job) return;

    const overlay = document.getElementById('job-details-modal');
    const container = document.getElementById('job-details-card');

    let typeBadgeClass = 'badge-fulltime';
    if (job.type === 'Part-time') typeBadgeClass = 'badge-parttime';
    if (job.type === 'Remote') typeBadgeClass = 'badge-remote';
    if (job.type === 'Internship') typeBadgeClass = 'badge-internship';

    const skillTags = job.skills.map(s => `<span class="tag-badge">${s}</span>`).join('');
    const salaryFormatted = job.salary ? `₹${job.salary.toLocaleString()}` : "Not Disclosed";

    // Application button checks
    let applySectionHTML = '';
    if (!state.user) {
        applySectionHTML = `<p class="margin-top-md" style="color:var(--text-muted);">Please <a href="#" onclick="switchView('auth'); closeActiveModal();" style="color:var(--primary);text-decoration:underline;">sign in</a> as a candidate/student to apply for this role.</p>`;
    } else if (state.user.role === 'student') {
        applySectionHTML = `
            <div class="modal-footer margin-top-lg">
                <button class="btn btn-primary" id="btn-submit-application" data-jobid="${job._id}">
                    <i class="fa-solid fa-paper-plane"></i> Apply For This Job
                </button>
            </div>
        `;
    } else {
        applySectionHTML = `<p class="margin-top-md" style="color:var(--text-muted);font-style:italic;">Viewing as ${state.user.role}. Student login required to apply.</p>`;
    }

    container.innerHTML = `
        <div class="modal-header">
            <div>
                <h2>${job.title}</h2>
                <div class="job-company">${job.company}</div>
            </div>
            <button class="modal-close" onclick="closeActiveModal()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="meta-stats">
                <span class="meta-icon-label"><i class="fa-solid fa-location-dot"></i> ${job.location}</span>
                <span class="meta-icon-label"><i class="fa-solid fa-business-time"></i> ${job.type}</span>
                <span class="meta-icon-label"><i class="fa-solid fa-wallet"></i> ${salaryFormatted}</span>
            </div>

            <h4 class="margin-top-md filter-title">Role Outline & Details</h4>
            <p class="det-p" style="white-space: pre-wrap;">${job.description}</p>

            <h4 class="margin-top-md filter-title">Required Competence & Tech Skills</h4>
            <div class="tag-list">
                ${skillTags}
            </div>

            ${applySectionHTML}
        </div>
    `;

    overlay.classList.add('active');

    // Bind Apply click action listener
    const applyBtn = document.getElementById('btn-submit-application');
    if (applyBtn) {
        applyBtn.addEventListener('click', (e) => {
            const jobId = e.target.getAttribute('data-jobid');
            submitJobApplication(jobId);
        });
    }
}

async function submitJobApplication(jobId) {
    if (state.mockModeActive) {
        // Add simulated application
        const duplicate = state.mockData.applications.some(a => a.job._id === jobId && a.student.email === state.user.email);
        if (duplicate) {
            showToast("You have already applied/submitted for this job opportunity.", "error");
            return;
        }

        const jobObj = state.jobs.find(j => j._id === jobId);
        const newApp = {
            _id: `m-app-${Date.now()}`,
            job: { _id: jobObj._id, title: jobObj.title, company: jobObj.company },
            student: { name: state.user.name, email: state.user.email },
            createdAt: new Date().toISOString(),
            status: "applied"
        };
        state.mockData.applications.push(newApp);
        showToast("Application submitted successfully (Mock Sandbox Mode)", "success");
        closeActiveModal();
        return;
    }

    try {
        const response = await apiCall(`/applications/${jobId}`, 'POST');
        showToast("Your application has been submitted successfully to the employer!", "success");
        closeActiveModal();
    } catch (err) {
        showToast(err.message || "Failed to submit application. Make sure profile and CV exist.", "error");
    }
}

function closeActiveModal() {
    document.querySelectorAll('.modal-overlay').forEach(el => {
        el.classList.remove('active');
    });
}

// ==========================================
// STUDENT PROFILE & SUBMISSIONS BOARD
// ==========================================
async function loadStudentDashboard() {
    if (!state.user) return;
    
    // Render static name, email
    document.querySelectorAll('.user-fullname').forEach(el => el.innerText = state.user.name);
    document.querySelectorAll('.user-email-text').forEach(el => el.innerText = state.user.email);
    
    // Fetch profile
    let profile = null;
    try {
        if (state.mockModeActive) {
            profile = state.mockData.profile;
        } else {
            profile = await apiCall('/profiles/my');
        }
    } catch (err) {
        // Create an empty fallback profile structure if none exists
        profile = { skills: [], education: "", experience: "", resumeUrl: "" };
    }

    if (profile) {
        document.getElementById('profile-skills').value = (profile.skills || []).join(', ');
        document.getElementById('profile-education').value = profile.education || '';
        document.getElementById('profile-experience').value = profile.experience || '';
        
        const resumeBox = document.getElementById('resume-status-box');
        if (profile.resumeUrl) {
            resumeBox.innerHTML = `<i class="fa-solid fa-file-pdf"></i> Resume Linked Successfully`;
            resumeBox.className = "resume-badge online";
        } else {
            resumeBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> No Resume Uploaded`;
            resumeBox.className = "resume-badge offline";
        }
    }

    // Load candidate's applications list
    await loadStudentApplications();
}

async function loadStudentApplications() {
    const tbody = document.getElementById('student-applications-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Fetching application records...</td></tr>';

    try {
        let apps = [];
        if (state.mockModeActive) {
            apps = state.mockData.applications.filter(a => a.student.email === state.user.email);
        } else {
            apps = await apiCall('/applications/my');
        }

        tbody.innerHTML = '';
        if (apps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">You have not applied to any job postings yet.</td></tr>';
            return;
        }

        apps.forEach(app => {
            const tr = document.createElement('tr');
            const jobTitle = app.job ? app.job.title : "Unknown Title";
            const jobCompany = app.job ? app.job.company : "Unknown Company";
            const dateApplied = new Date(app.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            
            let statusClass = 'status-applied';
            if (app.status === 'pending') statusClass = 'status-pending';
            if (app.status === 'shortlisted') statusClass = 'status-shortlisted';
            if (app.status === 'rejected') statusClass = 'status-rejected';

            tr.innerHTML = `
                <td><strong>${jobTitle}</strong></td>
                <td>${jobCompany}</td>
                <td>${dateApplied}</td>
                <td><span class="status-pill ${statusClass}">${app.status || 'applied'}</span></td>
                <td>
                    <button class="btn btn-danger btn-sm withdraw-app-btn" data-id="${app._id}">
                        <i class="fa-solid fa-trash-can"></i> Withdraw
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Add action listener to withdraw buttons
        document.querySelectorAll('.withdraw-app-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                withdrawApplication(id);
            });
        });

    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--accent-crimson);">Failed to fetch application statuses.</td></tr>';
    }
}

async function saveStudentProfile() {
    const skillsText = document.getElementById('profile-skills').value;
    const education = document.getElementById('profile-education').value;
    const experience = document.getElementById('profile-experience').value;

    const skills = skillsText.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const payload = {
        skills,
        education,
        experience
    };

    if (state.mockModeActive) {
        state.mockData.profile = { ...state.mockData.profile, ...payload };
        showToast("Profile information updated successfully (Mock Sandbox Mode)", "success");
        return;
    }

    try {
        await apiCall('/profiles/my', 'POST', payload);
        showToast("Your profile information has been saved successfully!", "success");
    } catch (err) {
        showToast(err.message || "Failed to update profile info.", "error");
    }
}

async function uploadStudentResume(file) {
    const formData = new FormData();
    formData.append('resume', file);

    if (state.mockModeActive) {
        state.mockData.profile.resumeUrl = "uploads/mock_resume_file.pdf";
        const resumeBox = document.getElementById('resume-status-box');
        resumeBox.innerHTML = `<i class="fa-solid fa-file-pdf"></i> Resume Linked Successfully`;
        resumeBox.className = "resume-badge online";
        showToast("Resume document simulated successfully!", "success");
        return;
    }

    showToast("Uploading resume PDF...", "info");

    try {
        const response = await apiCall('/profiles/resume', 'POST', formData, true);
        showToast("Resume document uploaded and linked successfully!", "success");
        // Reload dashboard fields
        loadStudentDashboard();
    } catch (err) {
        showToast(err.message || "Resume upload failed. Limit to 5MB PDF only.", "error");
    }
}

async function withdrawApplication(appId) {
    if (!confirm("Are you sure you want to withdraw this application? This action is permanent.")) return;

    if (state.mockModeActive) {
        state.mockData.applications = state.mockData.applications.filter(a => a._id !== appId);
        showToast("Application withdrawn", "info");
        loadStudentApplications();
        return;
    }

    try {
        await apiCall(`/applications/${appId}/withdraw`, 'DELETE');
        showToast("Application withdrawn successfully", "info");
        loadStudentApplications();
    } catch (err) {
        showToast(err.message || "Failed to withdraw application", "error");
    }
}

// ==========================================
// EMPLOYER ADMIN DASHBOARD FLOWS
// ==========================================
async function loadEmployerDashboard() {
    if (!state.user) return;
    
    // Set static user profiles
    document.querySelectorAll('.user-fullname').forEach(el => el.innerText = state.user.name);
    document.querySelectorAll('.user-email-text').forEach(el => el.innerText = state.user.email);
    
    // Fetch opportunities list published by employer
    const tbody = document.getElementById('employer-jobs-tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Fetching opportunities list...</td></tr>';

    try {
        let allJobs = [];
        if (state.mockModeActive) {
            allJobs = state.mockData.jobs;
        } else {
            allJobs = await apiCall('/jobs');
        }

        // Show jobs matching user's email as publisher company check context
        // In local, show all jobs, or jobs company match
        const employerJobs = allJobs; // Backend routes handles company ownership filter inside controllers on server side

        tbody.innerHTML = '';
        if (employerJobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">You have not published any job listings. Click "Post a New Job" above.</td></tr>';
            return;
        }

        employerJobs.forEach(job => {
            const tr = document.createElement('tr');
            
            // Fetch applicants count count
            let applicantsCount = 0;
            if (state.mockModeActive) {
                applicantsCount = state.mockData.applications.filter(a => a.job._id === job._id).length;
            } else {
                // In full backend, we read this or fallback
                applicantsCount = Math.floor(Math.random() * 4); // Dummy count display if not populated in core job entity schema
            }

            const salaryFormatted = job.salary ? `₹${job.salary.toLocaleString()}` : "Not Disclosed";
            const appStatus = job.approved ? 
                `<span class="status-pill status-shortlisted">Active / Approved</span>` :
                `<span class="status-pill status-pending">Pending Approval</span>`;

            tr.innerHTML = `
                <td><strong>${job.title}</strong></td>
                <td>${job.type}</td>
                <td>${salaryFormatted}</td>
                <td>${appStatus}</td>
                <td><strong>${applicantsCount}</strong> candidates</td>
                <td style="display:flex;gap:6px;">
                    <button class="btn btn-secondary btn-sm view-candidates-btn" data-id="${job._id}">
                        <i class="fa-solid fa-user-group"></i> Candidates
                    </button>
                    <button class="btn btn-danger btn-sm delete-job-btn" data-id="${job._id}">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Action Bindings
        document.querySelectorAll('.view-candidates-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                showApplicantsForJob(id);
            });
        });

        document.querySelectorAll('.delete-job-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                deleteJobListing(id);
            });
        });

    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--accent-crimson);">Failed to load employer dashboard listings.</td></tr>';
    }
}

async function createJobPosting(jobData) {
    if (state.mockModeActive) {
        const newJob = {
            _id: `m-job-${Date.now()}`,
            ...jobData,
            approved: false // Requires admin moderation
        };
        state.mockData.jobs.push(newJob);
        showToast("Job posted successfully! Pending administration review.", "success");
        closeActiveModal();
        loadEmployerDashboard();
        return;
    }

    try {
        await apiCall('/jobs', 'POST', jobData);
        showToast("Job listing posted successfully! It will be listed once approved by the Admin.", "success");
        closeActiveModal();
        loadEmployerDashboard();
    } catch (err) {
        showToast(err.message || "Failed to create job posting. Check fields.", "error");
    }
}

async function deleteJobListing(jobId) {
    if (!confirm("Are you sure you want to delete this job posting? This will remove all associated applicant stats.")) return;

    if (state.mockModeActive) {
        state.mockData.jobs = state.mockData.jobs.filter(j => j._id !== jobId);
        state.mockData.applications = state.mockData.applications.filter(a => a.job._id !== jobId);
        showToast("Opportunity deleted successfully", "info");
        loadEmployerDashboard();
        return;
    }

    try {
        await apiCall(`/jobs/${jobId}`, 'DELETE');
        showToast("Opportunity deleted successfully", "info");
        loadEmployerDashboard();
    } catch (err) {
        showToast(err.message || "Failed to delete opportunity", "error");
    }
}

async function showApplicantsForJob(jobId) {
    const modal = document.getElementById('view-applicants-modal');
    const tbody = document.getElementById('job-applicants-tbody');
    const titleText = document.getElementById('applicants-modal-title');
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Retrieving applicant profiles...</td></tr>';
    modal.classList.add('active');

    try {
        let job = state.jobs.find(j => j._id === jobId);
        if (!job && state.mockModeActive) {
            job = state.mockData.jobs.find(j => j._id === jobId);
        }
        
        if (job) {
            titleText.innerHTML = `<i class="fa-solid fa-user-tie"></i> Candidates for: ${job.title}`;
        }

        let apps = [];
        if (state.mockModeActive) {
            apps = state.mockData.applications.filter(a => a.job._id === jobId);
        } else {
            apps = await apiCall(`/applications/job/${jobId}`);
        }

        tbody.innerHTML = '';
        if (apps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No candidates have applied to this position yet.</td></tr>';
            return;
        }

        apps.forEach(app => {
            const tr = document.createElement('tr');
            
            // Build applicant meta features
            const studentName = app.student ? app.student.name : "N/A Candidate";
            const studentEmail = app.student ? app.student.email : "N/A Email";
            
            // Dummy or mock profiles values
            let skillsText = "JS, CSS, HTML";
            let resumePreview = `<span style="color:var(--text-muted);">No Document</span>`;

            if (state.mockModeActive) {
                skillsText = state.mockData.profile.skills.join(', ');
                resumePreview = `<a href="#" onclick="showToast('Downloading Resume PDF (Simulated)', 'info'); return false;" class="gradient-text"><i class="fa-solid fa-file-pdf"></i> Download PDF</a>`;
            } else if (app.profile) {
                skillsText = (app.profile.skills || []).join(', ') || 'N/A';
                if (app.profile.resumeUrl) {
                    resumePreview = `<a href="${BACKEND_URL}/${app.profile.resumeUrl}" target="_blank" class="gradient-text"><i class="fa-solid fa-file-pdf"></i> Open PDF</a>`;
                }
            } else {
                // If profile missing, show placeholder
                skillsText = "Reviewing Details...";
            }

            let statusClass = 'status-applied';
            if (app.status === 'pending') statusClass = 'status-pending';
            if (app.status === 'shortlisted') statusClass = 'status-shortlisted';
            if (app.status === 'rejected') statusClass = 'status-rejected';

            tr.innerHTML = `
                <td><strong>${studentName}</strong></td>
                <td>${studentEmail}</td>
                <td><small>${skillsText}</small></td>
                <td>${resumePreview}</td>
                <td><span class="status-pill ${statusClass}">${app.status}</span></td>
                <td>
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-primary btn-sm status-action-btn" data-id="${app._id}" data-action="shortlisted" title="Shortlist">
                            <i class="fa-solid fa-user-check"></i> Shortlist
                        </button>
                        <button class="btn btn-danger btn-sm status-action-btn" data-id="${app._id}" data-action="rejected" title="Reject">
                            <i class="fa-solid fa-user-minus"></i> Reject
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Bind status adjust actions
        document.querySelectorAll('.status-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const action = e.currentTarget.getAttribute('data-action');
                updateCandidateStatus(id, action, jobId);
            });
        });

    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--accent-crimson);">Failed to load candidate list records.</td></tr>';
    }
}

async function updateCandidateStatus(appId, newStatus, jobId) {
    if (state.mockModeActive) {
        const app = state.mockData.applications.find(a => a._id === appId);
        if (app) {
            app.status = newStatus;
            showToast(`Candidate status updated to: ${newStatus}`, "success");
            showApplicantsForJob(jobId);
        }
        return;
    }

    try {
        await apiCall(`/applications/${appId}/status`, 'PUT', { status: newStatus });
        showToast(`Candidate status has been updated to: ${newStatus}`, "success");
        showApplicantsForJob(jobId); // Refresh matching modal list
    } catch (err) {
        showToast(err.message || "Failed to update review status.", "error");
    }
}

// ==========================================
// SYSTEM ADMINISTRATION PANELS
// ==========================================
async function loadAdminDashboard() {
    if (!state.user || state.user.role !== 'admin') return;

    // Load statistics stats numbers
    await loadAdminStats();

    // Load pending jobs moderation listings
    await loadAdminPendingJobs();

    // Load directory of users
    await loadAdminUsers();
}

async function loadAdminStats() {
    try {
        let stats = {};
        if (state.mockModeActive) {
            stats = {
                totalUsers: state.mockData.users.length,
                totalJobs: state.mockData.jobs.length,
                totalApplications: state.mockData.applications.length
            };
        } else {
            stats = await apiCall('/admin/stats');
        }

        document.getElementById('admin-stat-total-users').innerText = stats.totalUsers || 0;
        document.getElementById('admin-stat-total-jobs').innerText = stats.totalJobs || 0;
        document.getElementById('admin-stat-total-applications').innerText = stats.totalApplications || 0;
    } catch (e) {
        console.warn("Unable to fetch administrative stats");
    }
}

async function loadAdminPendingJobs() {
    const list = document.getElementById('admin-pending-jobs-list');
    list.innerHTML = '<p style="text-align:center;padding:20px 0;">Searching for pending queue...</p>';

    try {
        let pendJobs = [];
        if (state.mockModeActive) {
            pendJobs = state.mockData.jobs.filter(j => j.approved === false);
        } else {
            pendJobs = await apiCall('/admin/jobs/pending');
        }

        list.innerHTML = '';
        if (pendJobs.length === 0) {
            list.innerHTML = `
                <div style="text-align:center;padding:30px 10px;color:var(--text-muted);">
                    <i class="fa-solid fa-circle-check" style="font-size:24px;color:var(--accent-emerald);margin-bottom:10px;"></i>
                    <p>No listings are pending verification. Queue clean.</p>
                </div>
            `;
            return;
        }

        pendJobs.forEach(job => {
            const div = document.createElement('div');
            div.className = 'pending-job-item';
            div.innerHTML = `
                <div class="pending-job-info">
                    <h4>${job.title}</h4>
                    <p>${job.company} &bull; ${job.type} &bull; ${job.location}</p>
                </div>
                <div class="pending-job-actions">
                    <button class="btn btn-primary btn-sm admin-approve-btn" data-id="${job._id}">
                        <i class="fa-solid fa-check"></i> Approve
                    </button>
                </div>
            `;
            list.appendChild(div);
        });

        // Action binding
        document.querySelectorAll('.admin-approve-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                approveJob(id);
            });
        });

    } catch (err) {
        list.innerHTML = '<p style="text-align:center;color:var(--accent-crimson);">Failed to load pending queue.</p>';
    }
}

async function approveJob(jobId) {
    if (state.mockModeActive) {
        const job = state.mockData.jobs.find(j => j._id === jobId);
        if (job) {
            job.approved = true;
            showToast("Opportunity listing has been approved and published!", "success");
            loadAdminDashboard();
        }
        return;
    }

    try {
        await apiCall(`/admin/jobs/${jobId}/status`, 'PUT', { status: 'approved' });
        showToast("Opportunity listing status set to APPROVED successfully!", "success");
        loadAdminDashboard();
    } catch (err) {
        showToast(err.message || "Failed approval adjustment", "error");
    }
}

async function loadAdminUsers() {
    const tbody = document.getElementById('admin-users-tbody');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Fetching users logs...</td></tr>';

    try {
        let users = [];
        if (state.mockModeActive) {
            users = state.mockData.users;
        } else {
            users = await apiCall('/admin/users');
        }

        tbody.innerHTML = '';
        users.forEach(u => {
            const tr = document.createElement('tr');
            
            // Disable deletion on self
            const isSelf = state.user && state.user.email.toLowerCase() === u.email.toLowerCase();
            const deleteBtn = isSelf ? 
                `<span style="color:var(--text-muted);font-style:italic;">Creator</span>` :
                `<button class="btn btn-danger btn-sm admin-delete-user-btn" data-id="${u._id}"><i class="fa-solid fa-user-xmark"></i> Delete</button>`;

            tr.innerHTML = `
                <td>
                    <strong>${u.name}</strong><br>
                    <small style="color:var(--text-muted);">${u.email}</small>
                </td>
                <td><span class="user-role-badge">${u.role}</span></td>
                <td>${deleteBtn}</td>
            `;
            tbody.appendChild(tr);
        });

        // Action Bindings
        document.querySelectorAll('.admin-delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                deleteSystemUser(id);
            });
        });

    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--accent-crimson);">Failed to load user directory matrix.</td></tr>';
    }
}

async function deleteSystemUser(userId) {
    if (!confirm("Are you sure you want to delete this user from the system? They will lose access to all portals immediately.")) return;

    if (state.mockModeActive) {
        state.mockData.users = state.mockData.users.filter(u => u._id !== userId);
        showToast("System user deleted successfully (Sandbox)", "info");
        loadAdminDashboard();
        return;
    }

    try {
        await apiCall(`/admin/users/${userId}`, 'DELETE');
        showToast("User record deleted from system database", "info");
        loadAdminDashboard();
    } catch (err) {
        showToast(err.message || "Failed user deletion control", "error");
    }
}


// ==========================================
// APP INITIALIZATION & BIND EVENTS
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check server status connection
    await testBackendConnection();

    // 2. Load stored login token session state
    loadSavedSession();

    // 3. Render initial jobs listing grid 
    loadJobsListings();

    // 4. View routing interactions setup
    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.currentTarget.getAttribute('data-view');
            switchView(view);
        });
    });

    document.getElementById('nav-logo-btn').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('home');
    });

    // 5. Auth View Event triggers
    document.getElementById('login-nav-btn').addEventListener('click', () => {
        switchView('auth');
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        handleLogout();
    });

    // Toggle tab Login vs Registration forms
    const tabLogin = document.getElementById('tab-login-btn');
    const tabRegister = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('register-form');

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });

    // Auth Form submissions
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const mail = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        handleLogin(mail, pass);
    });

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const mail = document.getElementById('register-email').value;
        const role = document.getElementById('register-role').value;
        const pass = document.getElementById('register-password').value;
        
        if (pass.length < 6) {
            showToast("Password must contain at least 6 characters.", "error");
            return;
        }
        handleRegister(name, mail, role, pass);
    });

    // 6. Home Search Bar triggers
    document.getElementById('jobs-search-btn').addEventListener('click', () => {
        state.filters.query = document.getElementById('search-job-title').value.trim();
        state.filters.location = document.getElementById('search-location').value.trim();
        renderFilteredJobs();
    });

    // Real-time queries matching typing
    document.getElementById('search-job-title').addEventListener('keyup', (e) => {
        state.filters.query = e.target.value.trim();
        renderFilteredJobs();
    });

    // Categorization filtering pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            state.filters.type = e.currentTarget.getAttribute('data-type');
            renderFilteredJobs();
        });
    });

    // Resetting filtering systems
    document.getElementById('reset-all-filters-btn').addEventListener('click', () => {
        document.getElementById('search-job-title').value = '';
        document.getElementById('search-location').value = '';
        document.getElementById('min-salary-filter').value = '';
        document.getElementById('max-salary-filter').value = '';
        
        // Reset state
        state.filters = { type: 'all', query: '', location: '', minSalary: null, maxSalary: null };

        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        document.querySelector('.filter-pill[data-type="all"]').classList.add('active');

        renderFilteredJobs();
        showToast("Filters successfully reset", "info");
    });

    // Sidebar inputs
    document.getElementById('min-salary-filter').addEventListener('input', (e) => {
        state.filters.minSalary = e.target.value ? Number(e.target.value) : null;
        renderFilteredJobs();
    });
    document.getElementById('max-salary-filter').addEventListener('input', (e) => {
        state.filters.maxSalary = e.target.value ? Number(e.target.value) : null;
        renderFilteredJobs();
    });

    // Mobile Navbar toggle
    document.getElementById('menu-toggle-btn').addEventListener('click', () => {
        document.getElementById('nav-menu').classList.toggle('active');
    });

    // Close overlays clicking escape or empty canvas
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeActiveModal();
        });
    });

    // 7. Student Panel Events
    document.getElementById('save-profile-btn').addEventListener('click', () => {
        saveStudentProfile();
    });

    // Resume Dropzone Form submit logic
    const resumeInput = document.getElementById('resume-file-input');
    const uploadBtn = document.getElementById('upload-resume-btn');
    
    resumeInput.addEventListener('change', () => {
        if (resumeInput.files.length > 0) {
            const fileName = resumeInput.files[0].name;
            document.querySelector('.upload-text').innerText = fileName;
            uploadBtn.classList.remove('hidden');
        } else {
            document.querySelector('.upload-text').innerText = "Click to choose PDF";
            uploadBtn.classList.add('hidden');
        }
    });

    document.getElementById('resume-upload-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const file = resumeInput.files[0];
        if (file) {
            uploadStudentResume(file);
            uploadBtn.classList.add('hidden');
        }
    });

    // 8. Employer Dashboard modals
    const postJobModal = document.getElementById('post-job-modal');
    
    document.getElementById('show-post-job-modal-btn').addEventListener('click', () => {
        postJobModal.classList.add('active');
    });

    document.getElementById('close-post-job-btn').addEventListener('click', () => {
        postJobModal.classList.remove('active');
    });

    document.getElementById('cancel-post-job-btn').addEventListener('click', () => {
        postJobModal.classList.remove('active');
    });

    document.getElementById('post-job-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('job-title-input').value.trim();
        const company = document.getElementById('job-company-input').value.trim();
        const location = document.getElementById('job-location-input').value.trim();
        const type = document.getElementById('job-type-input').value;
        const salary = Number(document.getElementById('job-salary-input').value);
        const skillsText = document.getElementById('job-skills-input').value;
        const description = document.getElementById('job-desc-input').value.trim();

        const skills = skillsText.split(',').map(s => s.trim()).filter(s => s.length > 0);

        const jobData = {
            title,
            company,
            location,
            type,
            salary,
            skills,
            description
        };

        createJobPosting(jobData);
        e.target.reset(); // clear values
    });

    // Applicants modalclose
    document.getElementById('close-applicants-btn').addEventListener('click', () => {
        document.getElementById('view-applicants-modal').classList.remove('active');
    });
});
