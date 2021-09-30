# hw_nodejs
Вам нужно написать сервис для замены фона у изображений. В результате должно получиться приложение Node.js, которое позволяет:
  - загрузить в сервис изображения в формате jpeg
  - заменять фон у заданного изображения на другой
    - фон является изображением такого же размера
    - при наложении фона должна быть возможность задать цвет, который считаем прозрачным
    
API
  - POST /upload  — загрузка изображения (сохраняет его на диск и возвращает идентификатор сохраненного изображения)
  - GET /list  - получить список изображений в формате json (должен содержать их id, размер, дата загрузки)
  - GET /image/:id  — скачать изображение с заданным id
  - DELETE /image/:id  — удалить изображение
  - GET /merge?front=<id>&back=<id>&color=145,54,32&threshold=5  — замена фона у изображения
Обратите внимание, что нужно отдавать правильные коды ответов)

Примечания:
  - приложение должно работать в node 14.18.0
  - приложение должно запускаться командой npm start  и работать на порту 8080 
  - храните картинки на диске в папке приложения
  - генерируйте id любым способом на свое усмотрение, например, с помощью готового инструмента
  - для замены фона используйте пакет   backrem @npm
  - отдавать части картинки на клиент нужно сразу, по мере их готовности
  - если размер изображения и размер фона не совпадает, генерировать ошибку
  - multipart/form-data
