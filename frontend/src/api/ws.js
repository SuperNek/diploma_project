const PORT = process.env.PORT || 3001;

export const initWebSocket = (onMessage, maxRetries = 5) => {
  let retries = 0;
  let socket = null;

  const connect = () => {
    socket = new WebSocket(`ws://localhost:${PORT}/ws`);

    socket.onopen = () => {
      console.log('WebSocket connected');
      retries = 0; // Сброс счетчика попыток
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error('Ошибка обработки сообщения:', error);
      }
    };

    socket.onclose = (event) => {
      if (event.wasClean) {
        console.log('WebSocket закрыт чисто');
      } else if (retries < maxRetries) {
        retries++;
        const delay = Math.min(1000 * retries, 5000);
        console.log(`Переподключение через ${delay}ms... (попытка ${retries}/${maxRetries})`);
        setTimeout(connect, delay);
      } else {
        console.error('Превышено количество попыток переподключения');
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket ошибка:', error);
    };
  };

  connect();

  return {
    close: () => {
      if (socket) {
        socket.close();
      }
    },
    reconnect: () => {
      if (socket) {
        socket.close();
      }
      connect();
    }
  };
};