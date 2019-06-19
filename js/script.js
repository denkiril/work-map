// const url = 'https://www.cbr-xml-daily.ru/daily_json.js';
// const url = 'https://api.hh.ru/vacancies/?area=1898';
// const url = 'https://api.hh.ru/vacancies/?area=69&per_page=100';
// const url = 'https://api.hh.ru/vacancies/?area=';
let oldAreaCode = 69;
let areaCode = oldAreaCode;
let oldAreaName = 'Орёл';
let areaName = oldAreaName;
let choosenEl;
const headerContainer = document.querySelector('#header-container');
const areasListContainer = document.querySelector('#areas-list-container');
const middleContainer = document.querySelector('#middle-container');
const updateVacsBtn = document.querySelector('#update-vacs-btn');
const newArea = document.querySelector('#new-area');
const spinnerEl = document.querySelector('#spinner');
const mapEl = document.querySelector('#map');
const selectedAreas = document.querySelector('#selected-areas');
const apiUrl = 'https://api.hh.ru/';

// async function getItemsFromHH(uri, area=null, page=0) {
//     const perPage = 100;
//     const getAll = page === -1 ? true : false;
//     page = getAll ? 0 : page;

//     let url = `${apiUrl}${uri}/?page=${page}&per_page=${perPage}`;
//     if (area) {
//         url += `&area=${area}`;
//     }

//     const response = await fetch(url);
//     const data = await response.json();
//     let vacancies = data.items;
    
//     if (getAll) {
//         const pages = data.pages;
//         for (let p=1; p<pages; p++) {
//             const newVacancies = await getVacancies(area, p);
//             vacancies = vacancies.concat(newVacancies);
//         }
//     }

//     return vacancies;
// }

async function getAreas() {
    // const perPage = 100;
    // const getAll = page === -1 ? true : false;
    // page = getAll ? 0 : page;

    // const url = `https://api.hh.ru/areas/?page=${page}&per_page=${perPage}`;
    const url = `https://api.hh.ru/areas`;

    const response = await fetch(url);
    const data = await response.json();
    // let areas = data.items;
    
    // if (getAll) {
    //     const pages = data.pages;
    //     for (let p=1; p<pages; p++) {
    //         const newVacancies = await getVacancies(area, p);
    //         // vacancies.push(newVacancies);
    //         vacancies = vacancies.concat(newVacancies);
    //     }
    // }

    return data;
}

async function getVacancies(area, page=0, found=null) {
    const perPage = 100;
    const getAll = page === -1 ? true : false;
    page = getAll ? 0 : page;

    const url = `https://api.hh.ru/vacancies/?area=${area}&page=${page}&per_page=${perPage}`;

    const response = await fetch(url);
    const data = await response.json();
    let vacancies = data.items;
    
    if (getAll) {
        console.log('getAll');
        console.log(data);
        if (found) found.val = data.found;

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
    // console.log(map.markers);
    // center_map( map );
    const markersLenght = Object.keys(map.markers).length;
    if (markersLenght) {
        map.setBounds(
            map.geoObjects.getBounds(),
            { checkZoomRange: true },
        ).then(() => {
            if (map.getZoom() > 16) map.setZoom(16);
        });
    }
}

function addAreaList(areas, listsMarkup) {
    // const areasList = document.createElement('ul');
    listsMarkup.val += '<ul>';
    areas.forEach(area => {
        listsMarkup.val += `<li data-id="${area.id}" data-name="${area.name}">${area.name}`;
        if (area.areas.length) addAreaList(area.areas, listsMarkup);
        listsMarkup.val += '</li>';
    });
    listsMarkup.val += '</ul>';
}

function renderAreaList(areas) {
    // const listElMarkup = '<div class="areasListContainer"><ul id="areasList"></ul></div>';
    areasListContainer.innerHTML = '';
    // const listContainer = document.createElement('div');
    // listContainer.className = 'areasListContainer';
    const headMarkup = '<p>Выберите интересующий вас регион и нажмите кнопку «Обновить базу вакансий».</p>';
    areasListContainer.insertAdjacentHTML('beforeend', headMarkup);
    // rootEl.appendChild(areasListContainer);

    const listsMarkup = {
        val: '',
    }

    addAreaList(areas, listsMarkup);

    areasListContainer.insertAdjacentHTML('beforeend', listsMarkup.val);
    // rootEl.appendChild(areasListContainer);
}

function renderData(vacancies, areas, update=false) {
    if (update) {
        headerContainer.innerHTML = '';
        middleContainer.innerHTML = '';
        mapEl.innerHTML = '';
    }
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

    const markup1 = `<p>Регион: ${vacancies.areaName}.${dateStr}</p>`;
    headerContainer.insertAdjacentHTML('beforeend', markup1);

    if (!update) renderAreaList(areas);

    const markup2 = `
        <p>Всего найдено ${vacancies.found.val} вакансий.</p>
        <p>Загружено: ${lenght} вакансий.</p>
        <p>Из них с адресами: ${vacsWithAddress}.</p>
        <p>Из них с геолокацией: ${vacsWithLatLng}.</p>
    `;
    middleContainer.insertAdjacentHTML('beforeend', markup2);
    
    ymaps.ready(() => {
        renderMap(vacancies.items);
    });
}

async function loadVacancies(update=false) {
    let vacancies = null;
    spinnerEl.style.display = 'inline';

    if (!update) {
        vacancies = await JSON.parse(localStorage.getItem('vacancies'));
    }

    if (!vacancies) {
        const found = { val: 0 };
        const items = await getVacancies(areaCode, -1, found);
        const date = new Date().toISOString();
        vacancies = {
            items,
            date,
            areaCode,
            areaName,
            found,
        }
        localStorage.setItem('vacancies', JSON.stringify(vacancies));
    }
    console.log(vacancies);
    areaCode = oldAreaCode = vacancies.areaCode;
    areaName = oldAreaName = vacancies.areaName;
    // console.log('oldAreaCode: '+oldAreaCode);
    
    spinnerEl.style.display = 'none';
    return vacancies;
}

async function main() {
    const areas = await getAreas();
    console.log(areas);

    const vacancies = await loadVacancies();

    if (vacancies) {
        renderData(vacancies, areas);
        updateVacsBtn.addEventListener('click', async function() {
            console.log('updateVacancies');
            const vacancies = await loadVacancies(true);
            renderData(vacancies, areas, true);
        });
        // document.querySelector('#areas-list-container > ul').addEventListener('click', function(e) {
        areasListContainer.addEventListener('click', function(e) {
            if (e.target.tagName == 'LI') {
                e.target.classList.toggle('choosen');
                if (choosenEl && choosenEl.classList.contains('choosen')) {
                    choosenEl.classList.remove('choosen');
                }
                choosenEl = e.target;
                if (e.target.classList.contains('choosen')) {
                    areaCode = e.target.dataset.id;
                    areaName = e.target.dataset.name;
                } else {
                    areaCode = oldAreaCode;
                    areaName = oldAreaName;
                }
                newArea.innerHTML = 'Обновить базу по региону '+areaName+'?';
                // console.log(areaCode+' '+areaName);
            }
        });
        selectedAreas.addEventListener('click', function(e) {
            if (e.target.matches('span[data-area]')) {
                areaCode = e.target.dataset.area;
                areaName = e.target.innerHTML;
                newArea.innerHTML = 'Обновить базу по региону '+areaName+'?';
                // console.log(areaCode+' '+areaName);
            }
        });
    }
}

function main2() {
    fetch(url)
        .then(response => response.json())
        .then(vacancies => vacanciesProcessing(vacancies))
        .catch(err => console.log(err));
}

main();
