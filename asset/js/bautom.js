'use strict';

function createStorage(key) {
    const storage = JSON.parse(localStorage.getItem(key)) ?? {};
    function save() {
        localStorage.setItem(key, JSON.stringify(storage));
    }
    
    return {
        get(key) {
            return storage[key];
        },
        set(key, value) {
            storage[key] = value;
            save();
        },
        remove(key) {
            delete storage[key];
            save();
        }
    };
}

function convertDate(d) {
    let hour = d.getHours();
    let minute = d.getMinutes();
    let date = d.getDate();
    let month = d.getMonth() + 1;
    let year = d.getFullYear();
    if (hour < 10) hour = '0' + hour;
    if (minute < 10) minute = '0' + minute;
    return {
        date: `${date}/${month}/${year}`,
        time: `${hour}:${minute}`,
    }
}

const _$ = document.querySelector.bind(document);
const _$$ = document.querySelectorAll.bind(document);

const bautomStorage = createStorage('bautom');
const moneyStorage = createStorage('money');

const resultDashBoard = _$('.js-cpt-dashboard')
const navDashBoard = _$('.js-dashboard-nav')
const notifyContainer = _$('.js-notify');
const notifyText = _$('.js-notify-text');
const moneyTempElem = _$('.js-money-decrease-temp');
const myMoneyElem = _$('.js-user-money');
const mainAudio = _$('.js-main-audio');
const loseAudio = _$('.js-lose-audio');
const victoryAudio = _$('.js-victory-audio');

const app = {

    init: function() {
        this.arrHistory = bautomStorage.get('history') ?? [];
        this.arrCountResult = bautomStorage.get('countResult') ?? new Array(6).fill(0);
        this.arrCountBet = bautomStorage.get('countBet') ?? new Array(6).fill(0);
        this.bet = [];
        this.totalBetMoney = 0;
        this.timeInterval = 100;
        this.timeOut = 5500;
        this.myMoney = moneyStorage.get('value') || 999999;;
        this.myMoneyBefore = this.myMoney;
        this.result1 = 0;
        this.result2 = 0;
        this.result3 = 0;
        this.result = [
            {
                value: 0,
                img: '../asset/img/bautom/huou.png',
            },{
                value: 1,
                img: '../asset/img/bautom/bau.png',
            },{
                value: 2,
                img: '../asset/img/bautom/ga.png',
            },{
                value: 3,
                img: '../asset/img/bautom/ca.png',
            },{
                value: 4,
                img: '../asset/img/bautom/cua.png',
            },{
                value: 5,
                img: '../asset/img/bautom/tom.png',
            },
        ]
        this.renderMoney();
    },

    handleEvent: function() {

        const userNav = _$('.js-dashboard-user');

        userNav.addEventListener('click', (e) => {
            const _this = e.target
            const isBetButton = _this.closest('.js-bet-button');
            const isAllInButton = _this.closest('.js-allin-button');
            const isReturnButton = _this.closest('.js-return-button');
            const isBetFastButton = _this.closest('.js-bet-fast-button');

            //x??? l?? ?????t c?????c
            if (isBetButton) {
                const container = _this.parentNode.parentNode;
                const betInput = container.querySelector('.js-bet-input');
                const money = Math.abs(+betInput.value);
                const value = +container.getAttribute('value');
                
                if (!money) {
                    alert('Ch??a nh???p ti???n k??a b???n ey!!');
                    return;
                }
                else if (this.myMoney < money) {
                    alert('Ti???n ??t ????i hit lol th??m ?? b???n.');
                    betInput.value = this.myMoney;
                    return;
                } else if (isNaN(money)){
                    alert('dkm');
                    return;
                }

                const pos = this.bet.findIndex(i => i.value === value)
                pos !== -1
                ? this.bet[pos] = { value, money } 
                : this.bet.push({ value, money });

                _$('.js-start-button').disabled = false;
                container.classList.remove('unbet');
                container.innerHTML = this.betStep2Component(money);
                notifyContainer.classList.remove('d-none');
                notifyText.innerHTML = 'T???m th???i :';

                this.totalBetMoney = -this.bet.reduce((a, b) => a + b.money, 0);
                this.myMoney = this.myMoneyBefore + this.totalBetMoney;

                moneyTempElem.innerHTML = this.totalBetMoney;
                this.renderMoney();
            }

            //x??? l?? ?????t l???i
            else if (isReturnButton) {
                const container = _this.parentNode;
                const value = +container.getAttribute('value');
                const pos = this.bet.findIndex(i => i.value === value);
                const money = this.bet[pos].money;
                
                this.bet.splice(pos, 1);
                this.totalBetMoney += money;
                this.myMoney += money;
                moneyTempElem.innerHTML = this.totalBetMoney;
                this.renderMoney();
                container.innerHTML = this.betStep1Component(money);
                container.classList.add('unbet');
            }

            //x??? l?? ?????t nhanh
            else if (isBetFastButton) {
                const container = _this.parentNode.parentNode;
                const betInput = container.querySelector('.js-bet-input');
                const money = +_this.dataset.value;
                betInput.value = +betInput.value + money;
            }

            //x??? l?? all in
            else if (isAllInButton) {
                const container = _this.parentNode.parentNode;
                const betInput = container.querySelector('.js-bet-input');
                betInput.value = this.myMoney

            }
        })

        navDashBoard.addEventListener('click', (e) => {
            const _this = e.target;
            const isStartButton = _this.closest('.js-start-button');
            const isContinueButton = _this.closest('.js-continue-button');
            const isAgainButton = _this.closest('.js-again-button');

            //x??? l?? b???t ?????u
            if (isStartButton) {

                _this.innerHTML = '??ang x??c';
                _this.disabled = true;
                _$$('.js-bet-step-container.unbet').forEach(i => i.innerHTML = '');
                _$$('.js-return-button').forEach(i => i.disabled = true);

                this.run();
                this.save();

                //x??? l?? k???t th??c
                setTimeout(() => {
                    clearInterval(this.runInterval);
                    this.xuLiKetThuc();
                }, this.timeOut)
            }

            //x??? l?? ti???p t???c
            if (isContinueButton) {
                notifyContainer.classList.add('d-none');
                navDashBoard.innerHTML = this.navDashBoardComponent1();
                this.renderResultUnstart();
                this.bet.length = 0;
                _$$('.js-bet-step-container').forEach(i => {
                    i.innerHTML = this.betStep1Component();
                    i.classList.add('unbet');
                });
            }

            //x??? l?? o??nh l???i
            if (isAgainButton) {
                if (this.myMoney < Math.abs(this.totalBetMoney)) {
                    alert('Ti???n ??t ????i hit lol th??m ?? b???n.');
                    return;
                }

                navDashBoard.innerHTML = `<button class="btn btn-success text-uppercase" disabled>??ang x??c</button>`
                notifyText.innerHTML = 'T???m th???i :';

                this.myMoney = this.myMoneyBefore + this.totalBetMoney;
                this.renderMoney();
                moneyTempElem.innerHTML = this.totalBetMoney;
                
                this.run();
                this.save();
                
                //x??? l?? k???t th??c
                setTimeout(() => {
                    clearInterval(this.runInterval);
                    this.xuLiKetThuc();
                }, this.timeOut)

            }
            
        })

        //show history mobile
        const history = _$('.js-history');
        const closeButton = _$('.js-history-close-button');
        const overlay = _$('.js-history-overlay');
        _$('.js-history-button').addEventListener('click', () => {
            history.classList.add('is-open');
            overlay.classList.toggle('d-none');
        })

        closeButton.addEventListener('click', () => {
            overlay.classList.toggle('d-none');
            history.classList.remove('is-open');
        })

        overlay.addEventListener('click', () => {
            overlay.classList.toggle('d-none');
            history.classList.remove('is-open');
        })

    },

    xuLiKetThuc: function() {
        let inComeMoney = this.totalBetMoney;
        let moneyReturn = 0;

        this.bet.forEach(i => {
            let isCheck = false;
            if (i.value === this.result1){
                inComeMoney += i.money;
                moneyReturn += i.money;
                isCheck = true;
            }
            if (i.value === this.result2){
                inComeMoney += i.money;
                moneyReturn += i.money;
                isCheck = true;
            }
            if (i.value === this.result3){
                inComeMoney += i.money;
                moneyReturn += i.money;
                isCheck = true;
            }

            if (isCheck) {
                inComeMoney += i.money;
                moneyReturn += i.money;
            }
        })

        this.myMoney += moneyReturn;
        this.renderMoney();
        navDashBoard.innerHTML = this.navDashBoardComponent2(inComeMoney);

        if (inComeMoney > 0) {
            notifyText.innerHTML = 'Ch??c m???ng :';
            moneyTempElem.innerHTML = `+${inComeMoney}`;
            victoryAudio.play();
        } 
        else if (inComeMoney < 0) {
            notifyText.innerHTML = 'Thua r??i Hoho :';
            moneyTempElem.innerHTML = inComeMoney;
            loseAudio.play();
        } 
        else {
            notifyText.innerHTML = 'H??a r??i :';
            moneyTempElem.innerHTML = inComeMoney;
        }

        // l??u l???i l???ch s??? ch??i
        const date = new Date();
        this.arrHistory.splice(0, 0, {
            bet: [...this.bet],
            money: inComeMoney,
            time: convertDate(date).time,
            date: convertDate(date).date,
            result: [this.result1, this.result2, this.result3],
        })

        if (this.arrHistory.length > 10) this.arrHistory.length = 10;

        //l??u l???i s??? l???n ?????t c?????c
        this.bet.forEach(i => {
            this.arrCountBet[i.value]++;
        })

        //l??u l???i k???t qu??? v???a ra
        this.arrCountResult[this.result1]++;
        this.arrCountResult[this.result2]++;
        this.arrCountResult[this.result3]++;

        this.save();
        this.render();
    },

    renderMoney: function() {
        myMoneyElem.innerHTML = this.myMoney;
    },

    renderHistory: function() {
        const history = _$('.js-history-body');
        let money, logo;
        const html = this.arrHistory.map((i, index) => {
            const betImage = i.bet.map(j => {
                return `
                    <img src="${this.result[j.value].img}" alt="" class="img-fluid history-img">
                `;
            }).join('');

            const resultImage = i.result.map(j => {
                return `
                    <img src="${this.result[j].img}" alt="" class="img-fluid history-img m-auto d-block">
                `;

            }).join('');
            
            if ( i.money > 0 ){
                money = `<span style="font-size: 16px;" class="text-success">+${i.money}</span>`;
                logo = `<img src="../asset/img/bautom/win.png" alt="" class="img-fluid"></img>`;
            } else if (i.money === 0){
                money = `<span style="font-size: 16px;" class="text-success">+${i.money}</span>`;
                logo = `<img src="../asset/img/bautom/hoa.png" alt="" class="img-fluid"></img>`;
            } else {
                money = `<span style="font-size: 16px;" class="text-danger">${i.money}</span>`;
                logo = `<img src="../asset/img/bautom/lose.png" alt="" class="img-fluid"></img>`;
            }

            return `
                <div class="history-item row mt-2">
                    <div class="betted col-4">
                        ${betImage}
                        <span class="text-success d-block">???? ?????t</span>
                    </div>
                    <div class="history-result col-4">
                        <span style="font-size: 16px;">#${index + 1}</span>
                        ${logo}
                        ${money}
                        <span>${i.time}</span>
                        <span>${i.date}</span>
                    </div>
                    <div class="col-4">
                        ${resultImage}
                        <span class="text-success">K???t qu???</span>
                    </div>
                </div>
            `;
        }).join('');
        history.innerHTML = html;
    },

    renderCount: function() {
        const countResultElem = _$$('.js-count-result');
        const countBetElem = _$$('.js-count-bet');
        const countElem = _$('.js-count');
        
        countResultElem.forEach((i, index) => {
            i.innerHTML = this.arrCountResult[index];
        })
        countBetElem.forEach((i, index) => {
            i.innerHTML = this.arrCountBet[index];
        })

        countElem.innerHTML = this.arrCountResult.reduce((a, b) => a + b) / 3;
    },

    renderResultUnstart: function() {
        const random1 = this.random();
        const random2 = this.random();
        const random3 = this.random();
        const html = `
            <div class="col-4 position-relative">
                <img src="${this.result[random1].img}" alt="" class="img-fluid unbrightness">
                <img src="../asset/img/bautom/dauhoi.png" alt="" class="img-fluid img-temp">
            </div>
            <div class="col-4 position-relative">
                <img src="${this.result[random2].img}" alt="" class="img-fluid unbrightness">
                <img src="../asset/img/bautom/dauhoi.png" alt="" class="img-fluid img-temp">
            </div>
            <div class="col-4 position-relative">
                <img src="${this.result[random3].img}" alt="" class="img-fluid unbrightness">
                <img src="../asset/img/bautom/dauhoi.png" alt="" class="img-fluid img-temp">
            </div>
        `;
        resultDashBoard.innerHTML = html;
    },

    betStep1Component: function(money = '') {
        return `
            <div class="bet-input-wrapper position-relative">
                <input type="number" class="bet-input js-bet-input" value="${money}">
                <ul class="bet-fast-list">
                    <li data-value="1000000" class="bet-fast-button js-bet-fast-button text-danger fw-bold">+1000000</li>
                    <li data-value="500000" class="bet-fast-button js-bet-fast-button text-danger fw-bold">+500000</li>
                    <li data-value="100000" class="bet-fast-button js-bet-fast-button text-danger fw-bold">+100000</li>
                </ul>
            </div>
            <div class="d-flex justify-content-center mt-2">
                <button class="btn btn-success btn-sm bet-button text-uppercase js-bet-button">?????t c?????c</button>
                <button class="btn btn-danger btn-sm text-uppercase bet-button js-allin-button">all in</button>
            </div>
        `;
    },

    betStep2Component: function(money) {
        return `
            <span class="bet-money">${money}</span>
            <button class="btn btn-success return-button js-return-button">?????t l???i</button>
        `;
    },

    navDashBoardComponent1: function() {
        return `
            <button class="btn btn-success text-uppercase js-start-button" disabled>Qu???t</button>
        `;
    },

    navDashBoardComponent2: function(inComeMoney) {
        if (inComeMoney > 0) {
            return `
                <button class="btn btn-success text-uppercase js-continue-button">Ti???p t???c ??n kh??ng</button>
                <button class="btn btn-danger text-uppercase mt-2 m-auto d-block js-again-button">O??nh l???i</button>
            `;
        }
        else if (inComeMoney === 0){
            return `
                <button class="btn btn-success text-uppercase js-continue-button">Chi???n ?????u ti???p</button>
                <button class="btn btn-danger text-uppercase mt-2 m-auto d-block js-again-button">O??nh l???i</button>
            `;
        }
        else if (inComeMoney < 0){
            return `
                <button class="btn btn-success text-uppercase js-continue-button">C??n th??? c??n g???</button>
                <button class="btn btn-danger text-uppercase mt-2 m-auto d-block js-again-button">O??nh l???i</button>
            `;
        }
        
    },

    random: function() {
        return Math.floor(Math.random() * 6);
    },

    save: function() {
        bautomStorage.set('countBet', this.arrCountBet);
        bautomStorage.set('countResult', this.arrCountResult);
        bautomStorage.set('history', this.arrHistory);
        moneyStorage.set('value', this.myMoney);
        this.myMoneyBefore = this.myMoney;
    },

    render: function() {
        this.renderHistory();
        this.renderCount();
    },

    run: function() {
        mainAudio.play();
        let html = '';
        this.runInterval = setInterval(() => {
            this.result1 = this.random();
            this.result2 = this.random();
            this.result3 = this.random();
            html = ` 
                <div class="col-4 position-relative">
                    <img src="${this.result[this.result1].img}" alt="" class="img-fluid">
                </div>
                <div class="col-4 position-relative">
                    <img src="${this.result[this.result2].img}" alt="" class="img-fluid">
                </div>
                <div class="col-4 position-relative">
                    <img src="${this.result[this.result3].img}" alt="" class="img-fluid">
                </div>
            `;
            resultDashBoard.innerHTML = html;
        }, this.timeInterval)
    },

    start: function() {
        this.init();
        this.render();
        this.renderResultUnstart();
        this.handleEvent();
    },
}

app.start();