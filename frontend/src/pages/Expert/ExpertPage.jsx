export default function ExpertPage() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Панель эксперта</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Блок с заявками на экспертизу */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Заявки на проверку</h2>
            {/* Список заявок будет здесь */}
          </div>
  
          {/* Блок статистики */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Статистика</h2>
            {/* Графики/метрики будут здесь */}
          </div>
        </div>
      </div>
    );
  }