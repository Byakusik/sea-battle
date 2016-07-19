/**
 * Created by Timur on 14.07.2016.
 */

var drownedPCShips = 0;
var drownedPlayerShips = 0;
var playerName = '';

$(document).ready(function () {


    $('#startBtn').on('click', function () {
        playerName = $('.login-form input').val();
        if (playerName == '') {
            $('.login-form input').css('border', '1px solid #FF0000');
            $('.error').html('Вы должны ввести имя!').show();
            return;
        }

        drawField(1);
        drawField(2);
        drawShips(1);
        drawShips(2);
        $('.battleground .turn').html('Ход игрока ' + playerName);
        $('.login-form').hide();
        $('.battleground').show();
    });

    function drawField(id) {
        id == 1 ? $('.battleground #ground' + id + ' .name').html(playerName) : $('.battleground #ground' + id + ' .name').html('Компьютер');

        for (y = 1; y <= 10; y++) {
            for (x = 1; x <= 10; x++) {
                $('.battleground #ground' + id + ' #field' + id).append('<div class="cell white hitable" id="c' + id + x + y + '" x=' + x + ' y=' + y + ' onclick="fire(this);"></div>');
            }
            $('.battleground #ground' + id + ' #field' + id).append('<br>');
        }
    }

    function drawShips(id) {
        var ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

        ships.forEach(function (ship, i) {
            shipCells = [];
            cells = document.querySelectorAll('.battleground #ground' + id + ' #field' + id + ' .cell.white');

            while (shipCells.length < ship) {

                cell = cells[Math.floor(Math.random() * cells.length)];

                direction = [1, 2][Math.floor(Math.random() * 2)];
                offset = (direction == 1) ? 'x' : 'y';
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

    function getShipCells(cells, cell, offset, ship, id) {
        shipCells = [];

        for (i = 0; i < ship; i++) {
            x = parseInt(cell.getAttribute('x')) + i;
            y = parseInt(cell.getAttribute('y')) + i;

            if (offset == 'x') {
                y = cell.getAttribute('y');
            } else {
                x = cell.getAttribute('x');
            }

            if ($.inArray($('.cell#c' + id + x + y), cells)) {
                if (checkNearCells(x, y, id))
                    shipCells.push($('.cell#c' + id + x + y));
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
            console.log(drownedPCShips);
            cellName = el.getAttribute('name');
            shipCellsNum = cellName[1];
            currentShip = document.querySelectorAll('#field2 .cell.hit[name="' + cellName + '"]');
            if (shipCellsNum == currentShip.length) {
                tooltip = 'Убил!';
                shipName = currentShip[0].getAttribute('name')[1] + currentShip[0].getAttribute('name')[2];
                addShip = document.querySelectorAll('.battleground #ground2 .addShips .addS[name=addShip2' + shipName + ']');
                console.log(shipName);
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

        cells = document.querySelectorAll('.battleground #ground1' + ' #field1' + ' .cell.hitable');
        cell = cells[Math.floor(Math.random() * cells.length)];

        if ($(cell).hasClass('red')) {
            $(cell).removeClass('red hitable').addClass('hit');
            drownedPlayerShips++;
console.log(drownedPlayerShips);
            cellName = cell.getAttribute('name');
            shipCellsNum = cellName[1];
            currentShip = document.querySelectorAll('#field1 .cell.hit[name="' + cellName + '"]');
            if (shipCellsNum == currentShip.length) {
                shipName = currentShip[0].getAttribute('name')[1] + currentShip[0].getAttribute('name')[2];
                addShip = document.querySelectorAll('.battleground #ground1 .addShips .addS[name=addShip1' + shipName + ']');
                console.log(shipName);
                $(addShip).removeClass('red').addClass('hit');
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

