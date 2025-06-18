// Контроллер для главной страницы
export const getHomePage = (req, res) => {
    // Если пользователь аутентифицирован, перенаправляем на страницу заявок
    if (req.user) {
        return res.redirect('/tickets');
    }
    
    // Иначе показываем главную страницу
    res.render('index', {
        title: 'Главная - Сервионика',
        user: req.user || null
    });
};
