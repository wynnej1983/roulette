var jw = {
    casino: {
        games: {

        }
    }
};

//utils
Array.prototype.any = function (predicate) {
    var len = this.length;
    if (typeof predicate != "function") {
        return len > 0;
    }
    for (var i = 0; i < len; ++i) {
        if (predicate(this[i])) {
            return true;
        }
    }
    return false;
};

Array.prototype.sum = function (selector) {
    var len = this.length;
    var sum = 0;
    for (var i = 0; i < len; ++i) {
        var val = selector(this[i]) || this[i]
        sum += val;
    }

    return sum;
};

ko.bindingHandlers.enterCommand = {
    init: function (element, valueAccessor) {
        var command = valueAccessor();
        $(element).keypress(function (event) {
            var keyCode = (event.which ? event.which : event.keyCode);
            if (keyCode === 13) {
                command();
                return false;
            }
            return true;
        });
    }
};

ko.bindingHandlers.flash = {
    update: function (element, valueAccessor) {
        $(element).fadeIn(1000).fadeOut(3000);
    }
};


ko.bindingHandlers.slideBehaviour = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var binding = valueAccessor();
        $("#slider").bind("slide", function (event, ui) {
            binding(ui.value);
        });
    }
};

(function ($) {
    jw.casino.games.roulette = {
        model: {
            Bet: function (number, amount) {
                this.number = number;
                this.amount = amount;
            },
            chip: {
                TEN_UNIT: 10,
                TWENTYFIVE_UNIT: 25,
                FIFTY_UNIT: 50,
                ONEHUNDRED_UNIT: 100
            }
        },
        ViewModel: function () {
            var self = this;

            self._getAllNumsOrdered = function () {
                return jw.casino.games.roulette.ViewModel.ALL_NUMBERS.sort(function (a, b) { return a - b });
            }

            self.isPlaying = ko.observable(false);
            self.msg = ko.observable("Place your bets!");
            self.spins = ko.observable(0);
            self.speed = ko.observable(jw.casino.games.roulette.ViewModel.SPIN_SPEED);
            self.credit = ko.observable(2000);
            self.betNum = ko.observable();
            self.betAmount = ko.observable(10);
            self.bets = ko.observableArray([]);
            self.totalBetAmount = ko.computed(function () { return self.bets().sum(function (i) { return i.amount }) });
            self.lastWin = ko.observable(0);
            self.lastNumber = ko.observable();
            self.history = ko.observableArray();
            self.stats = ko.observableArray(ko.utils.arrayMap(self._getAllNumsOrdered(), function (i) {
                return { number: i, count: ko.observable(0) };
            }));
            self.currentChipValue = ko.observable(jw.casino.games.roulette.model.chip.TEN_UNIT);
            self.setChipValue = function (chipValue) {
                self.currentChipValue(chipValue);
            }
            self.numColor = function (number) {
                var color = null;
                if (number == 0) {
                    color = 'green';
                }
                else {
                    color = jw.casino.games.roulette.ViewModel.RED_NUMBERS.any(function (i) {
                        return i == number;
                    }) ? 'red' : 'black'
                }

                return color;
            };

            self.init = function () {
                self.isPlaying(true);
                //check if resetting for new game
                if (self.credit() == 0) {
                    self.msg("Place your bets!");
                    self.spins(0);
                    self.credit(2000);
                    self.betNum("");
                    self.betAmount(10);
                    self.bets.removeAll();
                    self.lastWin("");
                    self.lastNumber("");
                    self.history.removeAll(); self.stats(ko.utils.arrayMap(self._getAllNumsOrdered(),
                                                 function (i) { return { number: i, count: ko.observable(0) }; }));
                }

                function loop() {
                    if (self.credit() == 0) {
                        clearInterval(window.intervalId);
                        self.isPlaying(false);
                        alert("Game Over! No more money left!");
                        return;
                    }

                    //deduct credits
                    var balance = self.credit() - self.totalBetAmount();
                    if (balance < 0) {
                        self.bets.removeAll();
                    }
                    else {
                        self.credit(balance);
                    }

                    //game loop
                    var winningNumber = Math.floor(37 * Math.random());
                    self.lastNumber(winningNumber);
                    self.history.unshift(winningNumber);
                    if (self.history().length == jw.casino.games.roulette.ViewModel.HISTORY_LENGTH) {
                        self.history.pop();
                    }

                    //stats   
                    self.spins(self.spins() + 1);
                    var existingStat = ko.utils.arrayFirst(self.stats(), function (i) {
                        return i.number === winningNumber;
                    });
                    existingStat.count(existingStat.count() + 1);
                    self.stats(self.stats().sort(function (left, right) {
                        return right.count() - left.count();
                    }));

                    //win or lose logic?
                    if (self.bets().any(function (i) { return i.number == winningNumber })) {
                        var winningBets = ko.utils.arrayFilter(
                            self.bets(),
                            function (i) { return i.number == winningNumber });
                        var winnings = winningBets.sum(function (i) { return i.amount * 35 }); self.lastWin(winnings);
                        self.credit(self.credit() + winnings);
                        console.log("winner!" + " " + "number " + winningNumber + ", amount $" + winnings);
                        self.msg("winner!" + " " + "number " + winningNumber + ", amount $" + winnings);
                    }

                    window.timeoutId = setTimeout(loop, 100 * (jw.casino.games.roulette.ViewModel.SPIN_MAX_SPEED + jw.casino.games.roulette.ViewModel.SPIN_MIN_SPEED - self.speed()));
                }

                //start game loop
                loop();
            }

            self.stop = function () {
                clearTimeout(window.timeoutId);
                self.isPlaying(false);
            }

            self.canBet = ko.computed(function () {
                return self.betNum() && self.betAmount() && /(^[0-9]$|^[1-2][0-9]$|^[1-3][0-6]$)/.test(self.betNum()) && /^[1-9]+[0-9]*$/.test(self.betAmount())
                    && (self.totalBetAmount() + parseInt(self.betAmount()) <= self.credit())
            });

            self.bet = function () {
                if (!self.canBet())
                    return;

                var existingBet = ko.utils.arrayFirst(self.bets(), function (i) {
                    return i.number === self.betNum();
                });

                if (existingBet) {
                    self.bets.remove(existingBet);
                    existingBet.amount += parseInt(self.betAmount());
                    self.bets.push(existingBet);
                }
                else {
                    self.bets.push(new jw.casino.games.roulette.model.Bet(self.betNum(), parseInt(self.betAmount())));
                }
            }

            self.clearBets = function () {
                self.bets.removeAll();
            }

            self.increaseBet = function () {
                var current = parseInt(self.betAmount());
                var inc = parseInt(self.currentChipValue());

                self.betAmount(current + inc);
            }

            self.decreaseBet = function () {
                var current = parseInt(self.betAmount());
                var dec = parseInt(self.currentChipValue());
                self.betAmount(Math.max(0, current - dec));
            }
        }
    };

    jw.casino.games.roulette.ViewModel.SPIN_SPEED = 1;
    jw.casino.games.roulette.ViewModel.SPIN_MIN_SPEED = 1;
    jw.casino.games.roulette.ViewModel.SPIN_MAX_SPEED = 20;
    jw.casino.games.roulette.ViewModel.HISTORY_LENGTH = 50;
    jw.casino.games.roulette.ViewModel.BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
    jw.casino.games.roulette.ViewModel.RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    jw.casino.games.roulette.ViewModel.ALL_NUMBERS = jw.casino.games.roulette.ViewModel.BLACK_NUMBERS.concat(jw.casino.games.roulette.ViewModel.RED_NUMBERS).concat([0]);
})(jQuery);


//jQuery stuff
$(function () {
    $("#slider").slider(
        { min: jw.casino.games.roulette.ViewModel.SPIN_MIN_SPEED,
            max: jw.casino.games.roulette.ViewModel.SPIN_MAX_SPEED,
            value: jw.casino.games.roulette.ViewModel.SPIN_SPEED
        }
    );
});

var vm = new jw.casino.games.roulette.ViewModel();
ko.applyBindings(vm);
