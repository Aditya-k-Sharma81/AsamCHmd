import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '../lib/auth';

export default async function Home() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'ADMIN') {
    redirect('/admin');
  } else {
    redirect('/dashboard');
  }
}
