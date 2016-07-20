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

            // Заполняем
            while (shipCells.length < ship) {

                cell = cells[Math.floor(Math.random() * cells.length)]; // Берем случайную клетку из всех незанятых

                direction = [1, 2][Math.floor(Math.random() * 2)];  // Случайно выбирается направление в котором будет рисоваться корабль
                offset = (direction == 1) ? 'x' : 'y';

                // Проверяем, не выйдет ли корабль за пределы поля
                if (cell.getAttribute(offset) <= 11 - ship) {
                    shipCells = getShipCells(cells, cell, offset, ship, id);
                }

            }
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

    function checkNearCells(x, y, id) {
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

    function paintRed(shipCells, id, ship, sn) {
        shipCells.forEach(function (cell, i) {
            cell.removeClass('white').addClass('red');
            cell[0].setAttribute('name', 's' + ship + sn);

            x = parseInt(cell[0].getAttribute('x'));
            y = parseInt(cell[0].getAttribute('y'));

            if (id == 2) cell[0].style.backgroundColor = '#FFFFFF';

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

function fire(el) {
    cellName = '';
    if (drownedPlayerShips == 20 || drownedPCShips == 20) return;
    if ($(el).parent()[0].id == 'field2' && $(el).hasClass('hitable')) {
        if ($(el).hasClass('red')) {
            el.style.backgroundColor = '#700000';
            $(el).removeClass('red hitable').addClass('hit');
            drownedPCShips++;

            cellName = el.getAttribute('name');
            shipCellsNum = cellName[1];
            currentShip = document.querySelectorAll('#field2 .cell.hit[name="' + cellName + '"]');
            if (shipCellsNum == currentShip.length) {
                tooltip = 'Убил!';
                makeUnhitable(currentShip, 2);
                shipName = currentShip[0].getAttribute('name')[1] + currentShip[0].getAttribute('name')[2];
                addShip = document.querySelectorAll('.battleground #ground2 .addShips .addS[name=addShip2' + shipName + ']');
                $(addShip).removeClass('red').addClass('hit');
            } else {
                tooltip = 'Ранил!';
            }
            $('.tooltip').html(tooltip).show();

            if (drownedPCShips == 20) {
                endGame(1);
                return;
            }
        } else if (!$(el).hasClass('hit')) {
            $(el).removeClass('hitable').addClass('miss');
        }

        $('.battleground .turn').html('Ход компьютера');
        pcFire()
    }
}

function pcFire() {
    setTimeout(function () {
        $('.tooltip').hide();

        if (woundedX != '' && woundedY != '') {


            if (woundedDirection > 0) {
                rCell = woundedDirection;
            } else {
                rCell = Math.floor(Math.random() * 4) + 1;
            }

            c = 0;p=1;
            while (c < 1) {
                c = 1;

                if(woundedX == 1 && rCell == 4) {
                    while (rCell == 4) {
                        rCell = Math.floor(Math.random() * 4) + 1;
                    }
                }
                if(woundedX == 10 && rCell == 2) {
                    while (rCell == 2) {
                        rCell = Math.floor(Math.random() * 4) + 1;
                    }
                }
                if(woundedY == 1 && rCell == 1) {
                    while (rCell == 1) {
                        rCell = Math.floor(Math.random() * 4) + 1;
                    }
                }
                if(woundedY == 10 && rCell == 3) {
                    while (rCell == 3) {
                        rCell = Math.floor(Math.random() * 4) + 1;
                    }
                }

                if (rCell == 1 && $('.cell#c1' + woundedX + (parseInt(woundedY) - 1)).hasClass('hitable')) {
                    cell = $('.cell#c1' + woundedX + (parseInt(woundedY) - 1))[0];
                } else if (rCell == 2 && $('.cell#c1' + (parseInt(woundedX) + 1) + woundedY).hasClass('hitable')) {
                    cell = $('.cell#c1' + (parseInt(woundedX) + 1) + woundedY)[0];
                } else if (rCell == 3 && $('.cell#c1' + woundedX + (parseInt(woundedY) + 1)).hasClass('hitable')) {
                    cell = $('.cell#c1' + woundedX + (parseInt(woundedY) + 1))[0];
                } else if (rCell == 4 && $('.cell#c1' + (parseInt(woundedX) - 1) + woundedY).hasClass('hitable')) {
                    cell = $('.cell#c1' + (parseInt(woundedX) - 1) + woundedY)[0];
                } else {
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
                if (p>2) {
                    rCell = woundedDirection = Math.floor(Math.random() * 4) + 1;
                }
                if (p>5) break;
            }
        } else {
            cells = document.querySelectorAll('.battleground #ground1' + ' #field1' + ' .cell.hitable');
            cell = cells[Math.floor(Math.random() * cells.length)];
        }

        if ($(cell).hasClass('red')) {
            $(cell).removeClass('red hitable').addClass('hit');
            drownedPlayerShips++;

            if (woundedX != '' && woundedY != '') {
                switch (rCell) {
                    case 1:
                    case 3:
                        $('.cell#c1' + (parseInt(woundedX) - 1) + woundedY).removeClass('hitable');
                        $('.cell#c1' + (parseInt(woundedX) + 1) + woundedY).removeClass('hitable');
                        break;
                    case 2:
                    case 4:
                        $('.cell#c1' + woundedX + (parseInt(woundedY) - 1)).removeClass('hitable');
                        $('.cell#c1' + woundedX + (parseInt(woundedY) + 1)).removeClass('hitable');
                        break;
                }

                $('.cell#c1' + (parseInt(woundedX) + 1) + (parseInt(woundedY) + 1)).removeClass('hitable');
                $('.cell#c1' + (parseInt(woundedX) - 1) + (parseInt(woundedY) + 1)).removeClass('hitable');
                $('.cell#c1' + (parseInt(woundedX) + 1) + (parseInt(woundedY) - 1)).removeClass('hitable');
                $('.cell#c1' + (parseInt(woundedX) - 1) + (parseInt(woundedY) - 1)).removeClass('hitable');
                woundedDirection = rCell;
            }

            cellName = cell.getAttribute('name');
            shipCellsNum = cellName[1];
            currentShip = document.querySelectorAll('#field1 .cell.hit[name="' + cellName + '"]');
            if (shipCellsNum == currentShip.length) {
                shipName = currentShip[0].getAttribute('name')[1] + currentShip[0].getAttribute('name')[2];
                addShip = document.querySelectorAll('.battleground #ground1 .addShips .addS[name=addShip1' + shipName + ']');
                $(addShip).removeClass('red').addClass('hit');

                makeUnhitable(currentShip, 1);

                woundedX = '';
                woundedY = '';
                woundedFX = '';
                woundedFY = '';
            } else {
                if (woundedX == '' && woundedY == '') {
                    woundedFX = cell.getAttribute('x');
                    woundedFY = cell.getAttribute('y');
                }

                woundedX = cell.getAttribute('x');
                woundedY = cell.getAttribute('y');
            }
            if (drownedPlayerShips == 20) {
                endGame(2);
                return;
            }
        } else {
            $(cell).removeClass('white hitable').addClass('miss');
        }

        $('.battleground .turn').html('Ход игрока ' + playerName);
    }, 800);
}

function endGame(winner) {
    if (winner == 1) {
        $('.battleground .turn').html('Вы победили!').css('font-size: 72px');
    } else {
        $('.battleground .turn').html('Вы проиграли...').css('font-size: 72px');
    }

}

function makeUnhitable(aShip, id) {
    aShip.forEach(function (shipCell, i) {
        x = shipCell.getAttribute('x');
        y = shipCell.getAttribute('y');

        $('.cell#c' + id + x + (parseInt(y) - 1)).removeClass('hitable').addClass('miss');
        $('.cell#c' + id + (parseInt(x) - 1) + y).removeClass('hitable').addClass('miss');
        $('.cell#c' + id + x + (parseInt(y) + 1)).removeClass('hitable').addClass('miss');
        $('.cell#c' + id + (parseInt(x) + 1) + y).removeClass('hitable').addClass('miss');
        $('.cell#c' + id + (parseInt(x) + 1) + (parseInt(y) + 1)).removeClass('hitable').addClass('miss');
        $('.cell#c' + id + (parseInt(x) - 1) + (parseInt(y) + 1)).removeClass('hitable').addClass('miss');
        $('.cell#c' + id + (parseInt(x) + 1) + (parseInt(y) - 1)).removeClass('hitable').addClass('miss');
        $('.cell#c' + id + (parseInt(x) - 1) + (parseInt(y) - 1)).removeClass('hitable').addClass('miss');
    });

    aShip.forEach(function (shipCell, i) {
        if ($(shipCell).hasClass('grey')) $(shipCell).removeClass('miss');
    });
}
