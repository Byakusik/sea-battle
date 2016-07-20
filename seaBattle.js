/**
 * Created by Timur on 14.07.2016.
 */

var drownedPCShips = 0,     // Количество кораблей, потопленных у компьютера
    drownedPlayerShips = 0, // У игрока
    playerName = '',        // Имя игрока
    woundedX = '',          // Координаты последней "раненой" клетки
    woundedY = '',
    woundedFX = '',         // Координаты первой раненой клетки корабля
    woundedFY = '',
    woundedDirection = 0;   // Направление в котором стоит продолжать стрелять


$(document).ready(function () {

    // Функция помогает избежать перезагрузки страницы при нажатии Enter при вводе имени
    $('#loginForm').on("submit", function (e) {
        e.preventDefault();
    });

    // Нажатие на кнопку "В бой" - старт игры
    $('#startBtn').on('click', function () {
        playerName = $('.login-form input').val(); // Имя игрока берется из инпута и сохраняется в глобальной переменной
        // Проверка на пустое имя пользователя
        if (playerName.trim() == '') {
            $('.login-form input').css('border', '1px solid #FF0000');
            $('.error').html('Вы должны ввести имя!').show();
            return;
        }

        // Рендер игровых полей и кораблей на них
        drawField(1);
        drawField(2);
        drawShips(1);
        drawShips(2);
        $('.battleground .turn').html('Ход игрока ' + playerName);  // Рендер надписи с очередностью хода
        $('.login-form').hide();                                    // Скрываем форму авторизации
        $('.battleground').show();                                  // Отображаем игровое поле
    });

    // Функция отрисовки игрового поля
    // id (integer) - идентификатор поля (1 - поле игрока, 2 - поле компьютера)
    function drawField(id) {
        // Отображение, кому принадлежит поле
        id == 1 ? $('.battleground #ground' + id + ' .name').html(playerName) : $('.battleground #ground' + id + ' .name').html('Компьютер');

        // Рисуем игровое поле div'ами со всеми необходимыми атрибутами
        for (y = 1; y <= 10; y++) {
            for (x = 1; x <= 10; x++) {
                $('.battleground #ground' + id + ' #field' + id).append('<div class="cell white hitable" id="c' + id + x + y + '" x=' + x + ' y=' + y + ' onclick="fire(this);"></div>');
            }
            $('.battleground #ground' + id + ' #field' + id).append('<br>');
        }
    }

    // Отрисовка кораблей
    // id (integer) - идентификатор поля (1 - поле игрока, 2 - поле компьютера)
    function drawShips(id) {
        var ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];     // массив кораблей, каждый элемент - кол-во палуб

        // Отрисовываем каждый корабль
        ships.forEach(function (ship, i) {
            shipCells = []; // Клетки (палубы) корабля
            cells = document.querySelectorAll('.battleground #ground' + id + ' #field' + id + ' .cell.white');  // Берем всё незанятые клетки соответствующего поля

            // Заполняем массив элементами (клетками корабля), перебираем возможные варианты, пока не получим удовлетворяющий (сколько палуб (массив ships), столько и клеток)
            while (shipCells.length < ship) {

                cell = cells[Math.floor(Math.random() * cells.length)]; // Берем случайную клетку из всех незанятых

                direction = [1, 2][Math.floor(Math.random() * 2)];  // Случайно выбирается направление в котором будет рисоваться корабль
                offset = (direction == 1) ? 'x' : 'y';

                // Проверяем, не выйдет ли корабль за пределы поля
                if (cell.getAttribute(offset) <= 11 - ship) {
                    shipCells = getShipCells(cells, cell, offset, ship, id);
                }

            }
            // Найдя удовлетворяющий набор клеток, окрашиваем их
            paintRed(shipCells, id, ship, i);

            for (j = 1; j <= ship; j++) {
                $('.battleground #ground' + id + ' .addShips').append('<div class="addS red" name="addShip' + id + ship + i + '"></div>');
            }
            $('.battleground #ground' + id + ' .addShips').append('<br>');

        });

    }

    // Функция, определяющая, какие ячейки займет корабль, относительно первой и направления отрисовки, и могут ли они быть заняты этим кораблём (свободны ли они)
    // cells - все свободные ячейки
    // cell - начальная клетка корабля
    // offst - смещение (по X или Y)
    // ship - тип корабля (кол-во клеток)
    // id - идентификатор принадлежности поля
    // return shipCells - массив элементов - клеток корабля
    function getShipCells(cells, cell, offset, ship, id) {
        shipCells = [];                                         // Клетки корабля

        // Проходим по каждой клетке корабля
        for (i = 0; i < ship; i++) {
            x = parseInt(cell.getAttribute('x')) + i;           // Каждой клетке указываем смещение от начальной
            y = parseInt(cell.getAttribute('y')) + i;

            // Координату, по которой нет смещения, оставляем равную изначальной
            if (offset == 'x') {
                y = cell.getAttribute('y');
            } else {
                x = cell.getAttribute('x');
            }

            // Являются ли выбранные клетки свободными
            if ($.inArray($('.cell#c' + id + x + y), cells)) {
                // И нет ли кораблей на соседних с мини клетках
                if (checkNearCells(x, y, id))
                    shipCells.push($('.cell#c' + id + x + y));  // Добавляем подходящие клетки к кораблю
            }
        }

        return shipCells;
    }

    // Проверка, нет ли кораблей на клетках, соседних с данной (в т.ч. по диагонали)
    // x, y - координаты клетки
    // return false, если хотя бы одна соседняя клетка содержит часть корабля, иначе - true
    function checkNearCells(x, y, id) {
        // Клетка, содержащая фрагмент корабля, имеет класс "red"
        if ($('.cell#c' + id + x + (parseInt(y) - 1)).hasClass('red') ||
            $('.cell#c' + id + (parseInt(x) - 1) + y).hasClass('red') ||
            $('.cell#c' + id + x + (parseInt(y) + 1)).hasClass('red') ||
            $('.cell#c' + id + (parseInt(x) + 1) + y).hasClass('red') ||
            $('.cell#c' + id + (parseInt(x) + 1) + (parseInt(y) + 1)).hasClass('red') ||
            $('.cell#c' + id + (parseInt(x) - 1) + (parseInt(y) + 1)).hasClass('red') ||
            $('.cell#c' + id + (parseInt(x) + 1) + (parseInt(y) - 1)).hasClass('red') ||
            $('.cell#c' + id + (parseInt(x) - 1) + (parseInt(y) - 1)).hasClass('red')
        ) {
            return false;
        } else {
            return true;
        }
    }

    // Окрашивание клеток корабля, фактически присвоение им классов, по которым можно будет идентифицировать, является ли клетка частью корабля
    // shipCells - окрашиваемые элементы (клетки корабля)
    // id - идентификатор поля
    // ship - тип корабля (кол-во клеток)
    // sn - номер корабля (для неуникального аттрибута name)
    function paintRed(shipCells, id, ship, sn) {
        // Каждую из клеток окрашиваем отдлельно
        shipCells.forEach(function (cell, i) {
            cell.removeClass('white').addClass('red');
            cell[0].setAttribute('name', 's' + ship + sn); // Аттрибут name вида "s"[тип_корабля][номер_корабля]. Клетки каждого корабля имеют одинаковое значение name - уникальное для каждого корабля

            // Берем координаты клетки
            x = parseInt(cell[0].getAttribute('x'));
            y = parseInt(cell[0].getAttribute('y'));

            if (id == 2) cell[0].style.backgroundColor = '#FFFFFF'; // Корабли на поле противника окрашиваем обратно в белый

            // Каждую клетку вокруг текущей делаем "несвободной" (класс "grey")
            $('.cell#c' + id + x + (parseInt(y) - 1)).removeClass('white').addClass('grey');
            $('.cell#c' + id + (parseInt(x) - 1) + y).removeClass('white').addClass('grey');
            $('.cell#c' + id + x + (parseInt(y) + 1)).removeClass('white').addClass('grey');
            $('.cell#c' + id + (parseInt(x) + 1) + y).removeClass('white').addClass('grey');
            $('.cell#c' + id + (parseInt(x) + 1) + (parseInt(y) + 1)).removeClass('white').addClass('grey');
            $('.cell#c' + id + (parseInt(x) - 1) + (parseInt(y) + 1)).removeClass('white').addClass('grey');
            $('.cell#c' + id + (parseInt(x) + 1) + (parseInt(y) - 1)).removeClass('white').addClass('grey');
            $('.cell#c' + id + (parseInt(x) - 1) + (parseInt(y) - 1)).removeClass('white').addClass('grey');
        });
    }

});

// Стрельба
// el - элемент-клетка, по которой произведен выстрел
function fire(el) {
    cellName = '';                                                          // Имя ячейки (аттрибут name)
    if (drownedPlayerShips == 20 || drownedPCShips == 20) return;           // Блокируем какие-либо действия, если игра окончена
    // Проверяем, в разрешенную ли клетку выстрелил игрок
    // 1я часть условия говорит, что можно стрелять только в своё поле
    // 2я - можно ли вообще стрелять в эту клетку (класс hitable имеют элементы, в которые еще не стреляли)
    if ($(el).parent()[0].id == 'field2' && $(el).hasClass('hitable')) {
        if ($(el).hasClass('red')) {                                        // Попал
            el.style.backgroundColor = '#700000';                           // Окрашиваем
            $(el).removeClass('red hitable').addClass('hit');               // Убираем классы, означающие Живая часть корабля и "Сюда можно стрелять", ставим класс "Попал"
            drownedPCShips++;                                               // Добавляем количество подбитых частей

            cellName = el.getAttribute('name');                             // Имя ячейки
            shipCellsNum = cellName[1];                                     // 2й символ имени - кол-во ячеек (палуб) корабля
            currentShip = document.querySelectorAll('#field2 .cell.hit[name="' + cellName + '"]');  // Берём все ячейки этого корабля, по которым было попадание
            if (shipCellsNum == currentShip.length) {                       // Если все ячейки корабля подбиты,
                tooltip = 'Убил!';                                          // корабль убит.
                makeUnhitable(currentShip, 2);                              // Выделяем убитый корабль
                shipName = currentShip[0].getAttribute('name')[1] + currentShip[0].getAttribute('name')[2];                     // Формируем имя корабля из его элементов
                addShip = document.querySelectorAll('.battleground #ground2 .addShips .addS[name=addShip2' + shipName + ']');   // Находим его копию в панели индикации "живых" кораблей
                $(addShip).removeClass('red').addClass('hit');              // "Убиваем" копию-индикатор
            } else {
                tooltip = 'Ранил!';                                         // Если НЕ все ячейки корабля подбиты, корабль "ранен"
            }
            $('.tooltip').html(tooltip).show();                             // Выводим результат попадания в облачко уведовлений

            if (drownedPCShips == 20) {                                     // Если все корабли подбиты, конец игры
                endGame(1);
                return;
            }
        } else if (!$(el).hasClass('hit')) {                                // Если не попал и выстрел произведен не в клетку "мимо",
            $(el).removeClass('hitable').addClass('miss');                  // даем этой клетке класс "miss" - мимо
        }

        $('.battleground .turn').html('Ход компьютера');                    // Меняем отображение очередности хода
        pcFire();                                                           // Выстрел компьютера
    }
}

// Выстрел компьютера
function pcFire() {
    setTimeout(function () {                                                // Небольшая задержка, чтоб выглядело реалистичнее
        $('.tooltip').hide();                                               // Скрываем облачко с результатом попадания игрока

        if (woundedX != '' && woundedY != '') {                             // Было ли попадание прошлым выстрелом
            if (woundedDirection > 0) {                                     // Фактически означает, что было неоднократное попадание по кораблю
                rCell = woundedDirection;                                   // rCell - переменная, означающая направление следующего после попадания выстрела
            } else {
                rCell = Math.floor(Math.random() * 4) + 1;                  // Если прошлое попадание было первым по этому кораблю, случайно выбираем направление, куда стрелять дальше
            }

            c = 0;
            p = 1;
            while (c < 1) {
                c = 1;

                // Предотвращение выстрела за пределы поля (левее столбца 1, выше строки 1 и т.п.)
                if (woundedX == 1 && rCell == 4) {
                    while (rCell == 4) {
                        rCell = Math.floor(Math.random() * 4) + 1;
                    }
                }
                if (woundedX == 10 && rCell == 2) {
                    while (rCell == 2) {
                        rCell = Math.floor(Math.random() * 4) + 1;
                    }
                }
                if (woundedY == 1 && rCell == 1) {
                    while (rCell == 1) {
                        rCell = Math.floor(Math.random() * 4) + 1;
                    }
                }
                if (woundedY == 10 && rCell == 3) {
                    while (rCell == 3) {
                        rCell = Math.floor(Math.random() * 4) + 1;
                    }
                }

                // Допустимо ли выстрелить в выбранном направлении
                if (rCell == 1 && $('.cell#c1' + woundedX + (parseInt(woundedY) - 1)).hasClass('hitable')) {
                    cell = $('.cell#c1' + woundedX + (parseInt(woundedY) - 1))[0];
                } else if (rCell == 2 && $('.cell#c1' + (parseInt(woundedX) + 1) + woundedY).hasClass('hitable')) {
                    cell = $('.cell#c1' + (parseInt(woundedX) + 1) + woundedY)[0];
                } else if (rCell == 3 && $('.cell#c1' + woundedX + (parseInt(woundedY) + 1)).hasClass('hitable')) {
                    cell = $('.cell#c1' + woundedX + (parseInt(woundedY) + 1))[0];
                } else if (rCell == 4 && $('.cell#c1' + (parseInt(woundedX) - 1) + woundedY).hasClass('hitable')) {
                    cell = $('.cell#c1' + (parseInt(woundedX) - 1) + woundedY)[0];
                } else {
                    // Алгоритм на случай, если компьютер начнет бить корабль с середины. Дойдёт до последней ячейки, продолжит быть в противоположную сторону от первой подбитой
                    switch (rCell) {
                        case 1:
                        case 2:
                            rCell += 2;
                            break;
                        case 3:
                        case 4:
                            rCell -= 2;
                            break;
                    }
                    c = 0;
                    woundedX = woundedFX;
                    woundedY = woundedFY;
                }
                p++;
                if (p > 2) {
                    rCell = woundedDirection = Math.floor(Math.random() * 4) + 1;
                }
                if (p > 5) break;                                           // Прерывание на случай, если подведёт Великий Корейский Рандом
            }
        } else {
            // Если в прошлый раз не попали и не идёт добивание корабля, стредяем в случайную "нестрелянную" клетку
            cells = document.querySelectorAll('.battleground #ground1' + ' #field1' + ' .cell.hitable');    // "нестрелянные" клетки
            cell = cells[Math.floor(Math.random() * cells.length)];         // Случайная "нестрелянная" клетка
        }

        if ($(cell).hasClass('red')) {                                      // Попал
            $(cell).removeClass('red hitable').addClass('hit');             // Убираем классы, означающие Живая часть корабля и "Сюда можно стрелять", ставим класс "Попал"
            drownedPlayerShips++;                                           // Добавляем количество подбитых частей

            if (woundedX != '' && woundedY != '') {                         // Если прошлый выстрел тоже был попаданием
                switch (rCell) {                                            // Смотрим, в какую сторону стреляли
                    case 1:
                    case 3:                                                 // Если вниз или вверх,
                        $('.cell#c1' + (parseInt(woundedX) - 1) + woundedY).removeClass('hitable'); // делаем клетки справа и слева недоступными для стрельбы (корабли прямые)
                        $('.cell#c1' + (parseInt(woundedX) + 1) + woundedY).removeClass('hitable');
                        break;
                    case 2:
                    case 4:                                                 // Если влево или вправо,
                        $('.cell#c1' + woundedX + (parseInt(woundedY) - 1)).removeClass('hitable'); // делаем клетки сверху и снизу недоступными для стрельбы
                        $('.cell#c1' + woundedX + (parseInt(woundedY) + 1)).removeClass('hitable');
                        break;
                }
                                                                            // Также делаем недоступными все клетки по диагонали
                $('.cell#c1' + (parseInt(woundedX) + 1) + (parseInt(woundedY) + 1)).removeClass('hitable');
                $('.cell#c1' + (parseInt(woundedX) - 1) + (parseInt(woundedY) + 1)).removeClass('hitable');
                $('.cell#c1' + (parseInt(woundedX) + 1) + (parseInt(woundedY) - 1)).removeClass('hitable');
                $('.cell#c1' + (parseInt(woundedX) - 1) + (parseInt(woundedY) - 1)).removeClass('hitable');
                woundedDirection = rCell;                                   // Запоминаем направление выстрела
            }

            cellName = cell.getAttribute('name');                           // Берем все ячейки этого корабля, по которым было попадание
            shipCellsNum = cellName[1];
            currentShip = document.querySelectorAll('#field1 .cell.hit[name="' + cellName + '"]');
            if (shipCellsNum == currentShip.length) {                       // Если все подбиты, корабль убит
                shipName = currentShip[0].getAttribute('name')[1] + currentShip[0].getAttribute('name')[2];
                addShip = document.querySelectorAll('.battleground #ground1 .addShips .addS[name=addShip1' + shipName + ']');
                $(addShip).removeClass('red').addClass('hit');              // "Убиваем" его копию-индикатор

                makeUnhitable(currentShip, 1);                              // Выделяем убитый корабль

                woundedX = '';                                              // Забываем все попадания по этому кораблю
                woundedY = '';
                woundedFX = '';
                woundedFY = '';
            } else {                                                        // Ранен
                if (woundedX == '' && woundedY == '') {                     // Если это первое ранение корабля, запоминаем координаты
                    woundedFX = cell.getAttribute('x');
                    woundedFY = cell.getAttribute('y');
                }

                woundedX = cell.getAttribute('x');                          // Запоминаем координаты попадания
                woundedY = cell.getAttribute('y');
            }
            if (drownedPlayerShips == 20) {                                 // Если подбиты все корабли, конец игры
                endGame(2);
                return;
            }
        } else {
            $(cell).removeClass('white hitable').addClass('miss');          // Промах
        }

        $('.battleground .turn').html('Ход игрока ' + playerName);          // Меняем отображение очередности хода
    }, 800);                                                                // Задержка в 0,8 секунды кажется достаточной, чтобы создать эффект "думающего" соперника
}

// Конец игры
// winner - победитель: 1 - Игрок / 2 - Компьютер
function endGame(winner) {
    // Вместо очередности хода появляется надпись с результатами игры
    if (winner == 1) {
        $('.battleground .turn').html('Вы победили!').css('font-size: 72px');
    } else {
        $('.battleground .turn').html('Вы проиграли...').css('font-size: 72px');
    }

}

// Сделать клетки вокруг корабля недоступными для стрельбы и с эффектом промаха
// aShip - массив элементов-клеток корабля
// id - идентификатор поля
function makeUnhitable(aShip, id) {
    aShip.forEach(function (shipCell, i) {                                  // Проходимся по каждой клетке
        x = shipCell.getAttribute('x');                                     // Берем координаты
        y = shipCell.getAttribute('y');

        // Убираем возможность стрелять по клеткам вокруг данной (в т.ч. и по диагонали) и даём эффект промаха
        $('.cell#c' + id + x + (parseInt(y) - 1)).removeClass('hitable').addClass('miss');
        $('.cell#c' + id + (parseInt(x) - 1) + y).removeClass('hitable').addClass('miss');
        $('.cell#c' + id + x + (parseInt(y) + 1)).removeClass('hitable').addClass('miss');
        $('.cell#c' + id + (parseInt(x) + 1) + y).removeClass('hitable').addClass('miss');
        $('.cell#c' + id + (parseInt(x) + 1) + (parseInt(y) + 1)).removeClass('hitable').addClass('miss');
        $('.cell#c' + id + (parseInt(x) - 1) + (parseInt(y) + 1)).removeClass('hitable').addClass('miss');
        $('.cell#c' + id + (parseInt(x) + 1) + (parseInt(y) - 1)).removeClass('hitable').addClass('miss');
        $('.cell#c' + id + (parseInt(x) - 1) + (parseInt(y) - 1)).removeClass('hitable').addClass('miss');
    });

    // Последняя процедура даёт пересечение клеток корабля и эффекта промаха, поэтому
    // у самих клеток корабля убираем этот эффект (класс "miss")
    aShip.forEach(function (shipCell, i) {
        if ($(shipCell).hasClass('grey')) $(shipCell).removeClass('miss');
    });
}
