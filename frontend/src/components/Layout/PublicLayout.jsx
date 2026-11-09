import { Outlet } from 'react-router-dom';
import PublicHeader from './PublicHeader';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-base">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
