import { Outlet } from 'react-router-dom';
import PublicHeader from './PublicHeader';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <div className="relative z-10 flex flex-col flex-1">
        <PublicHeader />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
