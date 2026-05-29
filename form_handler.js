// Конфигурация
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbypLxdPnpP-K6xg5YkSbRVbjDb6UPGTllTseH0Vmziuyiwmbg_KYbu9_amA6EnohQi8/exec'; // Вставьте URL после деплоя

// Отправка формы
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form'); // Укажите селектор вашей формы
    const submitButton = form.querySelector('button[type="submit"]');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Отключаем кнопку во время отправки
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Отправка...';
        
        // Собираем данные
        const formData = {
            name: form.querySelector('[name="name"]').value.trim(),
            phone: form.querySelector('[name="phone"]').value.trim(),
            contactHandle: form.querySelector('[name="contactHandle"]').value.trim(),
            website: form.querySelector('[name="website"]')?.value.trim() || '' // Honeypot
        };
        
        try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Важно для Google Apps Script
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            // С mode: 'no-cors' мы не можем прочитать ответ,
            // поэтому просто показываем успех
            alert('Спасибо! Заявка отправлена.');
            form.reset();
            
            // Опционально: редирект
            // window.location.href = './thank-you.html';
            
        } catch (error) {
            console.error('Error:', error);
            alert('Не удалось отправить заявку. Попробуйте еще раз.');
        } finally {
            // Возвращаем кнопку в исходное состояние
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
});