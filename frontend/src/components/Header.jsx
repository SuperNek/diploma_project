import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm w-full">
      <div className="w-full px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Система управления заявками</h1>
        
        {user && (
          <div className="flex items-center space-x-4">
            <button 
              onClick={logout}
              className="text-primary hover:text-primary-dark"
            >
              Выйти
            </button>
          </div>
        )}
      </div>
    </header>
  );
}