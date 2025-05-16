export default function CoordinatorPage() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Панель координатора</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Блок управления экспертами */}
          <div className="bg-white p-4 rounded-lg shadow col-span-1">
            <h2 className="text-lg font-semibold mb-3">Управление экспертами</h2>
            {/* Список экспертов будет здесь */}
          </div>
  
          {/* Основной блок с заявками */}
          <div className="bg-white p-4 rounded-lg shadow col-span-2">
            <h2 className="text-lg font-semibold mb-3">Распределение заявок</h2>
            {/* Таблица заявок будет здесь */}
          </div>
        </div>
      </div>
    );
  }