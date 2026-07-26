import { redirect } from 'next/navigation';

// Root redirects to login — middleware handles authenticated routing
export default function RootPage() {
  redirect('/login');
}
