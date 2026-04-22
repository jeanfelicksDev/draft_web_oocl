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
        
        const setCookie = loginRes.headers.get('set-cookie');
        if (setCookie) {
            console.log("Authentifié ! Vérification de l'accès à la racine...");
            const rootRes = await fetch('https://draft-web-oocl.vercel.app/', {
                headers: {
                    'Cookie': setCookie + '; ' + cookies
                },
                redirect: 'manual'
            });
            console.log("Status Racine:", rootRes.status);
            console.log("Location Racine:", rootRes.headers.get('location'));
        }
    } catch(e) {
        console.error(e);
    }
}
testLogin();
