import { useEffect, useState } from 'react';
import api from '../../api';

export default function UserPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/tickets/my');
        setTickets(data.tickets || []);
      } catch (err) {
        setError('Ошибка загрузки заявок');
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, []);

  return (
    <div className="flex-1 w-full px-8 pb-8">
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-md w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={() => setShowForm(false)}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900">Новая заявка</h2>
            <div className="text-gray-500">Форма заявки (реализуйте по вашим полям)</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 pt-8">
        <h1 className="text-3xl font-bold text-gray-900">Мои заявки</h1>
        <button
          className="px-5 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark transition"
          onClick={() => setShowForm(true)}
        >
          Создать заявку
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Загрузка заявок...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : tickets.length === 0 ? (
        <div className="text-gray-400">У вас пока нет заявок.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-white rounded shadow p-6 flex flex-col gap-2">
              <div className="font-semibold text-lg text-gray-900">{ticket.title || 'Без названия'}</div>
              <div className="text-gray-600 text-sm">Статус: {ticket.status || 'Неизвестно'}</div>
              <div className="text-gray-500 text-xs">Создана: {ticket.createdAt && new Date(ticket.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}