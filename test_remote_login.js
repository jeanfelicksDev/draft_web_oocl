const testLogin = async () => {
    try {
        const resCsrf = await fetch('https://draft-web-oocl.vercel.app/api/auth/csrf');
        const { csrfToken } = await resCsrf.json();
        const cookies = resCsrf.headers.get('set-cookie');
        
        const loginRes = await fetch('https://draft-web-oocl.vercel.app/api/auth/callback/credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookies,
                'User-Agent': 'Mozilla/5.0'
            },
            body: new URLSearchParams({
                email: 'admin@test.com',
                password: 'admin123',
                csrfToken
            }),
            redirect: 'manual'
        });
        
        console.log("Status:", loginRes.status);
        console.log("Location:", loginRes.headers.get('location'));
        const body = await loginRes.text();
        // console.log("Body:", body.substring(0, 500));
    } catch(e) {
        console.error(e);
    }
}
testLogin();
