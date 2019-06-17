// const url = 'https://www.cbr-xml-daily.ru/daily_json.js';
// const url = 'https://api.hh.ru/vacancies/?area=1898';
// const url = 'https://api.hh.ru/vacancies/?area=69&per_page=100';
// const url = 'https://api.hh.ru/vacancies/?area=';
const areaCode = 69;
const areaName = 'Орёл';
const rootEl = document.querySelector('#root');

async function getVacancies(area, page=0) {
    const perPage = 100;
    const getAll = page === -1 ? true : false;
    page = getAll ? 0 : page;

    const url = `https://api.hh.ru/vacancies/?area=${area}&page=${page}&per_page=${perPage}`;

    const response = await fetch(url);
    const data = await response.json();
    let vacancies = data.items;
    
    if (getAll) {
        const pages = data.pages;
        for (let p=1; p<pages; p++) {
            const newVacancies = await getVacancies(area, p);
            // vacancies.push(newVacancies);
            vacancies = vacancies.concat(newVacancies);
        }
    }

    return vacancies;
}

// function getVacancies(area, page=0) {
//     const perPage = 100;
//     const getAll = page === -1 ? true : false;
//     page = getAll ? 0 : page;

//     const url = `https://api.hh.ru/vacancies/?area=${area}&page=${page}&per_page=${perPage}`;
//     // let vacancies = [];

//     fetch(url)
//         .then(response => response.json())
//         // .then(data => vacancies = data.items)
//         .then(data => {
//             let vacancies = data.items;
//             if (getAll) {
//                 const pages = data.pages;
//                 for (let p=1; p<pages; p++) {
//                     vacancies.push(getVacancies(area, p));
//                 }
//             }
//             return vacancies;
//         })
//         // .then(() => {
//         //     return vacancies;
//         // })
//         .catch(err => console.log(err));
// }

function vacanciesProcessing(vacancies) {
    // console.log(vacancies.items);
    console.log(vacancies);
}

function addMarker(vac, map) {
    if (!vac.address || !(vac.address.lat && vac.address.lng))
        return;

    const lat = vac.address.lat;
    const lng = vac.address.lng;
    const empName = vac.employer.name;
    const vacName = vac.name;
    const vacUrl = vac.alternate_url;
  
    // Макеты балуна и хинта
    // let blcTemplate = '<h3><a href="{{ properties.vacUrl }}">{{ properties.empName }}</a></h3>';
    const blcTemplate = '<h3>{{properties.empName}}</h3>'
        +'<p><a href="{{properties.vacUrl}}" target="_blank">{{properties.vacName}}</a></p>';
    // if (thumbUrl) blcTemplate += '<img src="{{ properties.thumbUrl }}" />';
    const BalloonLayoutClass = ymaps.templateLayoutFactory.createClass(blcTemplate);
  
    let hlcTemplate = '<p>{{ properties.empName }}</p>';
    // if (thumbUrl) hlcTemplate += '<img src="{{ properties.thumbUrl }}" />';
    const HintLayoutClass = ymaps.templateLayoutFactory.createClass(hlcTemplate);
  
    // const clusterImg = thumbUrl ? `<img src="${thumbUrl}" />` : '';
    // const clusterImg = '<img src="'+thumbUrl+'" />';
  
    // Создание геообъекта с типом точка (метка)
    const marker = new ymaps.Placemark(
      [lat, lng],
      {
        // postId,
        vacUrl,
        empName,
        vacName,
        // thumbUrl,
        clusterCaption: empName,
        balloonContent: `<p><a href="${vacUrl}" target="_blank">${vacName}</a></p>`,
      },
      {
        // preset: 'islands#darkBlueIcon',
        // preset: 'islands#Icon',
        // iconColor: baseColor,
        balloonContentLayout: BalloonLayoutClass,
        hintContentLayout: HintLayoutClass,
      },
    );

    map.markers.push(marker);
}

function renderMap(vacancies) {
    const mapEl = document.querySelector('#map');

    const clusterer = new ymaps.Clusterer({
        // clusterIconColor: baseColor,
    });

    const map = new ymaps.Map(mapEl, {
        center: [52.967631, 36.069584],
        zoom: 12,
    });

    map.markers = [];
    vacancies.forEach(vac => addMarker(vac, map));
    clusterer.add(map.markers);
    map.geoObjects.add(clusterer);
    // console.log('map.markers.lenght = ' + map.markers.lenght);
    // console.log(map.markers);
    // center_map( map );
    if (map.markers) {
        map.setBounds(
            map.geoObjects.getBounds(),
            { checkZoomRange: true },
        ).then(() => {
            if (map.getZoom() > 16) map.setZoom(16);
        });
    }
}

function renderData(vacancies) {
    const lenght = Object.keys(vacancies.items).length;
    let vacsWithAddress = 0, vacsWithLatLng = 0;
    vacancies.items.forEach(item => {
        if (item.address != null) {
            vacsWithAddress++;
            if (item.address.lat && item.address.lng) {
                vacsWithLatLng++;
            }
        }
    });
    const dateStr = vacancies.date ? ' Дата базы вакансий: '+vacancies.date.slice(0, 10) : '';

    const markup = `
        <p>Всего загружено ${lenght} вакансий с сайта hh.ru по региону ${vacancies.areaName}.${dateStr}</p>
        <p>Из них с адресами: ${vacsWithAddress}.</p>
        <p>Из них с геолокацией: ${vacsWithLatLng}.</p>
        <button id="updateVacsBtn">Обновить базу вакансий</button>
    `;
    rootEl.insertAdjacentHTML('beforeend', markup);
    
    ymaps.ready(() => {
        renderMap(vacancies.items);
    });
}

async function updateVacancies() {
    console.log('updateVacancies');
    const vacancies = await loadVacancies();
    const vacDate = await JSON.parse(localStorage.getItem('vacDate'));

    while (rootEl.firstChild) {
        rootEl.removeChild(rootEl.firstChild);
    }
    const mapEl = document.querySelector('#map');
    while (mapEl.firstChild) {
        mapEl.removeChild(mapEl.firstChild);
    }
    renderData(vacancies, vacDate);
}

async function loadVacancies() {
    let vacancies = await JSON.parse(localStorage.getItem('vacancies'));

    if (!vacancies) {
        const items = await getVacancies(areaCode, -1);
        const date = new Date().toISOString();
        vacancies = {
            items,
            date,
            areaCode,
            areaName,
        }
        localStorage.setItem('vacancies', JSON.stringify(vacancies));
    }

    return vacancies;
}

async function main() {
    const vacancies = await loadVacancies();

    if (vacancies) {
        console.log(vacancies);
        renderData(vacancies);
        document.querySelector('#updateVacsBtn').addEventListener('click', updateVacancies);
    }
}

function main2() {
    fetch(url)
        .then(response => response.json())
        .then(vacancies => vacanciesProcessing(vacancies))
        .catch(err => console.log(err));
}

main();
