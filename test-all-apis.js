// Automated API Test Suite for AttendMate Backend
// Run with: node test-all-apis.js

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let employeeToken = '';
let testResults = [];
let employeeId1 = '';
let employeeMongoId = '';
let leaveId = '';
let eventId = '';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const color = type === 'success' ? colors.green : type === 'error' ? colors.red : type === 'warning' ? colors.yellow : colors.blue;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

async function makeRequest(method, endpoint, data = null, token = null) {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const responseData = await response.json();

        return {
            success: response.ok,
            status: response.status,
            data: responseData,
        };
    } catch (error) {
        return {
            success: false,
            status: 0,
            error: error.message,
        };
    }
}

function recordTest(testName, passed, details = '') {
    testResults.push({ testName, passed, details });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const type = passed ? 'success' : 'error';
    log(`${status} - ${testName}${details ? ': ' + details : ''}`, type);
}

async function testHealthCheck() {
    log('\n========== TESTING HEALTH CHECK ==========', 'info');
    const result = await makeRequest('GET', '/health');
    recordTest('Health Check', result.success && result.data.ok === true);
}

async function testAuthRegisterAndLogin() {
    log('\n========== TESTING AUTHENTICATION ==========', 'info');

    // Register Admin
    const adminRegister = await makeRequest('POST', '/auth/register', {
        name: 'Test Admin',
        email: 'testadmin@test.com',
        password: 'admin123',
        role: 'admin'
    });

    if (adminRegister.success && adminRegister.data.token) {
        adminToken = adminRegister.data.token;
        recordTest('Register Admin', true, `Token received`);
    } else {
        recordTest('Register Admin', false, adminRegister.data.message || 'No token');
    }

    // Register Employee
    const empRegister = await makeRequest('POST', '/auth/register', {
        name: 'Test Employee',
        email: 'testemp@test.com',
        password: 'emp123',
        role: 'employee'
    });

    if (empRegister.success && empRegister.data.token) {
        employeeToken = empRegister.data.token;
        recordTest('Register Employee', true);
    } else {
        recordTest('Register Employee', false, empRegister.data.message);
    }

    // Login Admin
    const adminLogin = await makeRequest('POST', '/auth/login', {
        email: 'testadmin@test.com',
        password: 'admin123'
    });

    if (adminLogin.success && adminLogin.data.token) {
        adminToken = adminLogin.data.token;
        recordTest('Login Admin', true);
    } else {
        recordTest('Login Admin', false);
    }

    // Test /me endpoint
    const meResult = await makeRequest('GET', '/auth/me', null, adminToken);
    recordTest('Get Current User (/me)', meResult.success && meResult.data.user);

    // Test Logout
    const logoutResult = await makeRequest('POST', '/auth/logout', null, adminToken);
    recordTest('Logout', logoutResult.success);
}

async function testEmployeeCRUD() {
    log('\n========== TESTING EMPLOYEE CRUD ==========', 'info');

    // Add Employee 1
    const addEmp1 = await makeRequest('POST', '/employees/add', {
        name: 'John Doe',
        employeeId: 'EMP001',
        email: 'john@company.com',
        phone: '1234567890',
        department: 'Engineering',
        designation: 'Software Engineer',
        salary: 60000,
        joiningDate: '2024-01-15'
    }, adminToken);

    if (addEmp1.success && addEmp1.data.employee) {
        employeeId1 = 'EMP001';
        employeeMongoId = addEmp1.data.employee._id;
        recordTest('Add Employee 1', true);
    } else {
        recordTest('Add Employee 1', false, addEmp1.data.message);
    }

    // Add Employee 2
    const addEmp2 = await makeRequest('POST', '/employees/add', {
        name: 'Jane Smith',
        employeeId: 'EMP002',
        email: 'jane@company.com',
        phone: '0987654321',
        department: 'HR',
        designation: 'HR Manager',
        salary: 55000,
        joiningDate: '2024-02-01'
    }, adminToken);

    recordTest('Add Employee 2', addEmp2.success);

    // Test duplicate employeeId
    const dupEmp = await makeRequest('POST', '/employees/add', {
        name: 'Duplicate',
        employeeId: 'EMP001',
        email: 'dup@company.com',
        phone: '1111111111',
        department: 'Test',
        designation: 'Test',
        salary: 50000,
        joiningDate: '2024-01-01'
    }, adminToken);

    recordTest('Duplicate EmployeeId Prevention', !dupEmp.success);

    // Get All Employees
    const allEmps = await makeRequest('GET', '/employees', null, adminToken);
    recordTest('Get All Employees', allEmps.success && Array.isArray(allEmps.data));

    // Get Employee by Custom ID
    const empByCustomId = await makeRequest('GET', `/employees/find/${employeeId1}`, null, adminToken);
    recordTest('Get Employee by Custom ID (EMP001)', empByCustomId.success && empByCustomId.data.employeeId === 'EMP001');

    // Get Employee by MongoDB ID
    if (employeeMongoId) {
        const empByMongoId = await makeRequest('GET', `/employees/${employeeMongoId}`, null, adminToken);
        recordTest('Get Employee by MongoDB ID', empByMongoId.success);
    }

    // Update Employee
    if (employeeMongoId) {
        const updateEmp = await makeRequest('PUT', `/employees/${employeeMongoId}`, {
            department: 'Product Engineering',
            salary: 65000
        }, adminToken);
        recordTest('Update Employee', updateEmp.success);
    }
}

async function testAttendance() {
    log('\n========== TESTING ATTENDANCE ==========', 'info');

    const today = new Date().toISOString().split('T')[0];

    // Check-in
    const checkIn1 = await makeRequest('POST', '/attendance/check-in', {
        employeeId: 'EMP001',
        date: today,
        time: '09:30:00'
    }, adminToken);

    recordTest('Check-in Employee (On Time)', checkIn1.success);

    // Check-in Late
    const checkIn2 = await makeRequest('POST', '/attendance/check-in', {
        employeeId: 'EMP002',
        date: today,
        time: '10:30:00'
    }, adminToken);

    recordTest('Check-in Employee (Late)', checkIn2.success && checkIn2.data.attendance?.status === 'Late');

    // Prevent Double Check-in
    const doubleCheckIn = await makeRequest('POST', '/attendance/check-in', {
        employeeId: 'EMP001',
        date: today,
        time: '10:00:00'
    }, adminToken);

    recordTest('Prevent Double Check-in', !doubleCheckIn.success);

    // Check-out
    const checkOut = await makeRequest('POST', '/attendance/check-out', {
        employeeId: 'EMP001',
        date: today,
        time: '18:00:00'
    }, adminToken);

    recordTest('Check-out Employee', checkOut.success && checkOut.data.attendance?.duration > 0);

    // Get All Attendance
    const allAttendance = await makeRequest('GET', '/attendance', null, adminToken);
    recordTest('Get All Attendance', allAttendance.success && Array.isArray(allAttendance.data));

    // Get Attendance by Date
    const attByDate = await makeRequest('GET', `/attendance?date=${today}`, null, adminToken);
    recordTest('Get Attendance by Date', attByDate.success && attByDate.data.length >= 2);

    // Get Attendance by Employee
    const attByEmp = await makeRequest('GET', '/attendance/EMP001', null, adminToken);
    recordTest('Get Attendance by Employee', attByEmp.success && Array.isArray(attByEmp.data));
}

async function testLeaveManagement() {
    log('\n========== TESTING LEAVE MANAGEMENT ==========', 'info');

    // Request Leave
    const requestLeave = await makeRequest('POST', '/leaves/request', {
        employeeId: 'EMP001',
        leaveType: 'Sick Leave',
        fromDate: '2024-12-10',
        toDate: '2024-12-12',
        reason: 'Medical appointment'
    }, adminToken);

    if (requestLeave.success && requestLeave.data.leave) {
        leaveId = requestLeave.data.leave._id;
        recordTest('Request Leave', true);
    } else {
        recordTest('Request Leave', false, requestLeave.data.message);
    }

    // Request Overlapping Leave (should fail)
    const overlapLeave = await makeRequest('POST', '/leaves/request', {
        employeeId: 'EMP001',
        leaveType: 'Casual Leave',
        fromDate: '2024-12-11',
        toDate: '2024-12-13',
        reason: 'Personal'
    }, adminToken);

    recordTest('Prevent Overlapping Leave', !overlapLeave.success);

    // Get All Leaves (Admin)
    const allLeaves = await makeRequest('GET', '/leaves', null, adminToken);
    recordTest('Get All Leaves (Admin)', allLeaves.success && Array.isArray(allLeaves.data));

    // Get Leaves by Employee
    const empLeaves = await makeRequest('GET', '/leaves/employee/EMP001', null, adminToken);
    recordTest('Get Leaves by Employee', empLeaves.success && Array.isArray(empLeaves.data));

    // Approve Leave
    if (leaveId) {
        const approveLeave = await makeRequest('PUT', `/leaves/${leaveId}`, {
            status: 'Approved'
        }, adminToken);
        recordTest('Approve Leave (Admin)', approveLeave.success && approveLeave.data.leave?.status === 'Approved');
    }

    // Reject Leave (create another one first)
    const requestLeave2 = await makeRequest('POST', '/leaves/request', {
        employeeId: 'EMP002',
        leaveType: 'Casual Leave',
        fromDate: '2024-12-15',
        toDate: '2024-12-16',
        reason: 'Personal work'
    }, adminToken);

    if (requestLeave2.success && requestLeave2.data.leave) {
        const rejectLeave = await makeRequest('PUT', `/leaves/${requestLeave2.data.leave._id}`, {
            status: 'Rejected'
        }, adminToken);
        recordTest('Reject Leave (Admin)', rejectLeave.success);
    }
}

async function testEventManagement() {
    log('\n========== TESTING EVENT MANAGEMENT ==========', 'info');

    // Add Event
    const addEvent = await makeRequest('POST', '/events/add', {
        title: 'Team Meeting',
        start: '2024-12-10T10:00:00',
        end: '2024-12-10T11:00:00',
        description: 'Monthly team sync',
        allDay: false,
        type: 'Meeting'
    }, adminToken);

    if (addEvent.success && addEvent.data.event) {
        eventId = addEvent.data.event._id;
        recordTest('Add Event', true);
    } else {
        recordTest('Add Event', false, addEvent.data.message);
    }

    // Add Holiday Event
    const addHoliday = await makeRequest('POST', '/events/add', {
        title: 'Christmas',
        start: '2024-12-25T00:00:00',
        end: '2024-12-25T23:59:59',
        description: 'Christmas Holiday',
        allDay: true,
        type: 'Holiday'
    }, adminToken);

    recordTest('Add Holiday Event', addHoliday.success);

    // Get All Events
    const allEvents = await makeRequest('GET', '/events', null, adminToken);
    recordTest('Get All Events', allEvents.success && Array.isArray(allEvents.data));

    // Update Event
    if (eventId) {
        const updateEvent = await makeRequest('PUT', `/events/${eventId}`, {
            title: 'Updated Team Meeting',
            description: 'Updated monthly sync'
        }, adminToken);
        recordTest('Update Event', updateEvent.success);
    }

    // Delete Event
    if (eventId) {
        const deleteEvent = await makeRequest('DELETE', `/events/${eventId}`, null, adminToken);
        recordTest('Delete Event', deleteEvent.success);
    }
}

async function testAccessControl() {
    log('\n========== TESTING ACCESS CONTROL ==========', 'info');

    // Employee tries to add employee (should fail)
    const empAddEmp = await makeRequest('POST', '/employees/add', {
        name: 'Unauthorized',
        employeeId: 'EMP999',
        email: 'unauth@test.com',
        phone: '9999999999',
        department: 'Test',
        designation: 'Test',
        salary: 50000,
        joiningDate: '2024-01-01'
    }, employeeToken);

    recordTest('Prevent Employee from Adding Employee', !empAddEmp.success || empAddEmp.status === 403);

    // Employee tries to get all leaves (should fail)
    const empGetLeaves = await makeRequest('GET', '/leaves', null, employeeToken);
    recordTest('Prevent Employee from Getting All Leaves', !empGetLeaves.success || empGetLeaves.status === 403);
}

function printSummary() {
    log('\n========== TEST SUMMARY ==========', 'info');

    const passed = testResults.filter(t => t.passed).length;
    const failed = testResults.filter(t => !t.passed).length;
    const total = testResults.length;
    const passRate = ((passed / total) * 100).toFixed(2);

    console.log(`\n${colors.blue}Total Tests: ${total}${colors.reset}`);
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`${colors.yellow}Pass Rate: ${passRate}%${colors.reset}\n`);

    if (failed > 0) {
        log('Failed Tests:', 'error');
        testResults.filter(t => !t.passed).forEach(t => {
            console.log(`  ${colors.red}❌ ${t.testName}${t.details ? ': ' + t.details : ''}${colors.reset}`);
        });
    }

    log('\n========== TEST COMPLETED ==========', 'success');
}

async function runAllTests() {
    log('Starting Automated API Tests...', 'info');
    log(`Base URL: ${BASE_URL}`, 'info');

    try {
        await testHealthCheck();
        await testAuthRegisterAndLogin();
        await testEmployeeCRUD();
        await testAttendance();
        await testLeaveManagement();
        await testEventManagement();
        await testAccessControl();

        printSummary();
    } catch (error) {
        log(`Fatal Error: ${error.message}`, 'error');
        console.error(error);
    }
}

// Run tests
runAllTests();
