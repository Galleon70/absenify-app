import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/teacher.json');

setup('Authenticate sebagai Guru', async ({ request, page }) => {
  // 1. Tembak API Login (Ganti email/password sesuai kredensial guru di DB kamu)
  const loginRes = await request.post('/api/auth/login', {
    data: {
      identifier: 'guru@amegakure.com',
      password: 'hambali01',
    },
  });

  // 2. Jika API login sukses, simpan cookies session
  if (loginRes.ok()) {
    const storageState = await request.storageState();
    await page.context().addCookies(storageState.cookies);
    await page.context().storageState({ path: authFile });
  } else {
    // Fallback jika API route login kamu beda: buat mock cookie session sederhana
    await page.context().addCookies([
      {
        name: 'token',
        value: 'mock-teacher-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
    await page.context().storageState({ path: authFile });
  }
});