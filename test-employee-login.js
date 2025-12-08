// Employee Login API Test Script
const BASE_URL = 'http://localhost:5000/api';

async function testEmployeeLogin() {
    console.log('\n=== TESTING EMPLOYEE LOGIN API ===\n');

    try {
        // Step 1: Register HR user to get HR token
        console.log('1. Registering HR user...');
        const hrRegister = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test HR',
                email: `testhr${Date.now()}@example.com`,
                password: 'hr123',
                role: 'hr'
            })
        });

        const hrData = await hrRegister.json();
        const hrToken = hrData.token;
        console.log(hrRegister.ok ? '✅ HR registered successfully' : '❌ Failed:', hrData.message);

        if (!hrToken) {
            console.log('❌ No HR token received');
            return;
        }

        // Step 2: Add an employee with password
        console.log('\n2. Adding employee with password...');
        const empEmail = `testemp${Date.now()}@example.com`;
        const empPassword = 'employee123';

        const addEmployee = await fetch(`${BASE_URL}/employees/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${hrToken}`
            },
            body: JSON.stringify({
                name: 'Test Employee',
                employeeId: `TEST${Date.now()}`,
                email: empEmail,
                phone: '1234567890',
                department: 'Engineering',
                designation: 'Developer',
                password: empPassword,
                salary: 50000,
                joiningDate: '2024-01-01',
                address: 'Test Address'
            })
        });

        const empData = await addEmployee.json();
        console.log(addEmployee.ok ? '✅ Employee added successfully' : '❌ Failed:', empData.message);

        if (empData.employee) {
            console.log('   - Employee ID:', empData.employee.employeeId);
            console.log('   - Password in response:', empData.employee.password ? '❌ EXPOSED (BAD!)' : '✅ Hidden (GOOD!)');
        }

        // Step 3: Employee Login
        console.log('\n3. Testing employee login...');
        const employeeLogin = await fetch(`${BASE_URL}/employees/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: empEmail,
                password: empPassword
            })
        });

        const loginData = await employeeLogin.json();
        console.log(employeeLogin.ok ? '✅ Employee login successful' : '❌ Failed:', loginData.message);

        const employeeToken = loginData.token;
        if (loginData.employee) {
            console.log('   - Name:', loginData.employee.name);
            console.log('   - Employee ID:', loginData.employee.employeeId);
            console.log('   - Department:', loginData.employee.department);
            console.log('   - Salary in response:', loginData.employee.salary ? '❌ EXPOSED (BAD!)' : '✅ Hidden (GOOD!)');
            console.log('   - Token received:', employeeToken ? '✅ Yes' : '❌ No');
        }

        // Step 4: Invalid password test
        console.log('\n4. Testing invalid password...');
        const invalidLogin = await fetch(`${BASE_URL}/employees/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: empEmail,
                password: 'wrongpassword'
            })
        });

        const invalidData = await invalidLogin.json();
        console.log(!invalidLogin.ok ? '✅ Correctly rejected invalid password' : '❌ Security issue - invalid password accepted!');
        console.log('   - Message:', invalidData.message);

        // Step 5: Get Employee Profile
        if (employeeToken) {
            console.log('\n5. Testing employee profile endpoint...');
            const profile = await fetch(`${BASE_URL}/employees/profile`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${employeeToken}` }
            });

            const profileData = await profile.json();
            console.log(profile.ok ? '✅ Employee profile retrieved' : '❌ Failed:', profileData.message);

            if (profileData.employee) {
                console.log('   - Name:', profileData.employee.name);
                console.log('   - Salary in profile:', profileData.employee.salary ? '❌ EXPOSED (BAD!)' : '✅ Hidden (GOOD!)');
            }

            // Step 6: Test employee token on HR endpoint (should fail)
            console.log('\n6. Testing employee token on HR-only endpoint...');
            const hrEndpoint = await fetch(`${BASE_URL}/leaves`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${employeeToken}` }
            });

            const hrData = await hrEndpoint.json();
            console.log(!hrEndpoint.ok ? '✅ Correctly blocked from HR endpoint' : '❌ Security issue - employee accessed HR endpoint!');
            console.log('   - Status:', hrEndpoint.status);
        }

        console.log('\n=== TEST COMPLETE ===\n');

    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

// Run tests manually with: node test-employee-login.js
// testEmployeeLogin();
