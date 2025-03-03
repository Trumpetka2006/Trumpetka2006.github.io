const BOOK_SELECTOR_INFO_TEMPLATE = `<div id="book-selector-info" class="book-selector-info book-selector-info-nok"></div>`;
const BOOK_SELECTOR_INFO_CONTENT = `
<div class="book-selector-info-data">
    <div class="book-selector-info-key">$KEY$</div>
    <div class="book-selector-info-value">$VALUE$</div>
</div>`;
const BOOK_SELECTOR_CONTAINER_TEMPLATE = `
<div class="book-selector-container">
    <div class="book-selector-header">
        <div class="book-selector-triangle-open"></div>
        <div class="book-selector-header-text">$CATEGORY_TITLE$</div>
    </div>
$RECORDS_DATA$
</div>`;
const BOOK_SELECTOR_RECORD_TEMPLATE = `
<div class="book-selector-record" $RECORD_IDENTIFICATION$>$RECORD_CONTENT$</div>`;
const BOOK_SELECTOR_RECORD_DATA_TEMPLATE = `
<div class="book-selector-data">
    <div class="book-selector-key">$KEY$</div>
    <div class="book-selector-value">$VALUE$</div>
</div>`;

const DATA_CONDITIONS = {
    'Kategorie': {
        'Světová a česká literatura do konce 18. století': {
            start: 0,
            end: 2
        },
        'Světová a česká literatura do konce 19. století': {
            start: 0,
            end: 3
        },
        'Světová literatura 20. a 21. století': {
            start: 0,
            end: 4
        },
        'Česká literatura do konce 20. a 21. století': {
            start: 0,
            end: 5
        }
    },

    'Autor': {
        start: 0,
        max: 2
    },

    'Literární druh': {
        'próza': {
            start: 0,
            end: 2
        },
        'poezie': {
            start: 0,
            end: 2
        },
        'drama': {
            start: 0,
            end: 2
        },
    }
};

const CATEGORY_ID = {
    1: 'Světová a česká literatura do konce 18. století',
    2: 'Světová a česká literatura do konce 19. století',
    3: 'Světová literatura 20. a 21. století',
    4: 'Česká literatura do konce 20. a 21. století'
};

const REQUIRED_COUNT = 20;

class RECORD_TEMPLATE {
    data = ['Kategorie', 'Autor', 'Název díla', 'Literární druh'];
    'Autor';
    'Název díla';
    'Literární druh';

    get length() {
        return 3;
    }
}


class BookSelectorBookList {
    constructor(rawData) {
        this.data = {};
        this.processData(rawData);
    }

    processData(rawData) {
        let i = 0;
        let requiredLength = (new RECORD_TEMPLATE).length + 1;

        for (let categoryKey in CATEGORY_ID) {
            this.data[CATEGORY_ID[categoryKey]] = [];
        }

        for (let record of rawData.split('\n')) {
            i++;

            if (record == '') { continue }
            if (record.trim()[0] == '#') { continue }

            let recordData = record.split(';');
            if (recordData.length != requiredLength) { throw new Error(`Record in file at row ${i} doesn\'t have enought information (has ${recordData.length}, ${requiredLength} required).`) }
            if (!(recordData[0].trim() in CATEGORY_ID)) { throw new Error(`Record in file at row ${i} has invalid caterory id (has ${recordData[0].trim()}, possible ids are ${Object.keys(CATEGORY_ID)}).`) }

            (this.data[CATEGORY_ID[parseInt(recordData[0])]] ??= []).push(new RECORD_TEMPLATE());

            for (let j = 1; j < requiredLength; j++) {
                this.data[CATEGORY_ID[parseInt(recordData[0])]][this.data[CATEGORY_ID[parseInt(recordData[0])]].length - 1][
                    this.data[CATEGORY_ID[parseInt(recordData[0])]][this.data[CATEGORY_ID[parseInt(recordData[0])]].length - 1].data[j]
                ] = recordData[j].trim();
            }
        }
    }

    selectionStatus(selectedRecords) {
        let statusOk = [];
        let status = {
            'Celkem vybráno': 0,
            'Kategorie': {},
            'Autor': {},
            'Literární druh': {}
        };

        for (let categoryName in DATA_CONDITIONS['Kategorie']) {
            status['Kategorie'][categoryName] = DATA_CONDITIONS['Kategorie'][categoryName].start;
        }

        for (let typeName in DATA_CONDITIONS['Literární druh']) {
            status['Literární druh'][typeName] = DATA_CONDITIONS['Literární druh'][typeName].start;
        }

        for (let categoryNum in selectedRecords) {
            let categoryName = CATEGORY_ID[parseInt(categoryNum)];
            status['Kategorie'][categoryName] = selectedRecords[categoryNum].length;

            for (let recordNum of selectedRecords[parseInt(categoryNum)]) {
                if (status['Autor'][this.data[categoryName][recordNum]['Autor']] == undefined) {
                    status['Autor'][this.data[categoryName][recordNum]['Autor']] = 0;
                }
                status['Autor'][this.data[categoryName][recordNum]['Autor']]++;

                if (status['Literární druh'][this.data[categoryName][recordNum]['Literární druh']] == undefined) {
                    status['Literární druh'][this.data[categoryName][recordNum]['Literární druh']] = 0;
                }
                status['Literární druh'][this.data[categoryName][recordNum]['Literární druh']]++;
                status['Celkem vybráno'] += 1;
            }
        }

        if (status['Celkem vybráno'] == REQUIRED_COUNT) {
            statusOk.push(true);
        } else {
            statusOk.push(false);
        }

        for (let categoryName in status['Kategorie']) {
            if (status['Kategorie'][categoryName] >= DATA_CONDITIONS['Kategorie'][categoryName].end) {
                statusOk.push(true);
                status['Kategorie'][categoryName] = `ok`;
            } else {
                statusOk.push(false);
                status['Kategorie'][categoryName] = `${status['Kategorie'][categoryName]}/${DATA_CONDITIONS['Kategorie'][categoryName].end}`;
            }
        }

        let authorCorrect = [];
        for (let authorName in status['Autor']) {
            if (status['Autor'][authorName] > DATA_CONDITIONS['Autor'].max) {
                authorCorrect.push(false);
            } else {
                authorCorrect.push(true);
            }
        }

        if (authorCorrect.every(v => v === true)) {
            statusOk.push(true);
            status['Autor'] = 'ok';
        } else {
            statusOk.push(false);
            status['Autor'] = `max ${DATA_CONDITIONS['Autor'].max} knihy od autora`;
        }

        let typeStatus = [];
        for (let typeName in status['Literární druh']) {
            if (status['Literární druh'][typeName] >= DATA_CONDITIONS['Literární druh'][typeName].end) {
                typeStatus.push(true);
            } else {
                typeStatus.push(false);
            }
        }

        if (typeStatus.every(v => v === true)) {
            statusOk.push(true);
            status['Literární druh'] = 'ok';
        } else {
            statusOk.push(false);
            status['Literární druh'] = `min 2 od každého`;
        }

        status['Celkem vybráno'] = `${status['Celkem vybráno']}/${REQUIRED_COUNT}`;
        for (let categoryName in status['Kategorie']) {
            status[categoryName] = `${status['Kategorie'][categoryName]}`;
        }
        delete status['Kategorie'];


        if (statusOk.length > 0 && statusOk.every(v => v === true)) {
            statusOk = true;
        } else {
            statusOk = false;
        }

        return { 'status': status, 'statusOk': statusOk };
    }
}


async function bookSelectorGenerateHTMLContent(booklistUrl) {

    const [bookListPromise] = await Promise.all([fetch(booklistUrl)]);
    const bookListRawData = await bookListPromise.text();

    let booklist = new BookSelectorBookList(bookListRawData);
    let data = booklist.data;

    let newContent = '';
    let categoryData = '';
    let recordContent = '';

    let i = 1;
    let j = 0;

    for (let categoryName in data) {
        categoryData = '';
        j = 0;

        for (let recordData of data[categoryName]) {
            recordContent = '';
            for (let recordItem of (new RECORD_TEMPLATE).data.splice(1, 3)) {
                recordContent += BOOK_SELECTOR_RECORD_DATA_TEMPLATE;
                recordContent = recordContent.replace('$KEY$', recordItem);
                recordContent = recordContent.replace('$VALUE$', recordData[recordItem]);
            }

            categoryData += BOOK_SELECTOR_RECORD_TEMPLATE;
            categoryData = categoryData.replace('$RECORD_CONTENT$', recordContent);
            categoryData = categoryData.replace('$RECORD_IDENTIFICATION$',
                `data-book-selector-record-category="${i}" data-book-selector-record-number="${j}"`);
            j++;
        }

        newContent += BOOK_SELECTOR_CONTAINER_TEMPLATE;
        newContent = newContent.replace('$CATEGORY_TITLE$', categoryName);
        newContent = newContent.replace('$RECORDS_DATA$', categoryData);
        i++;
    }

    document.getElementById('book-selector-main').innerHTML = BOOK_SELECTOR_INFO_TEMPLATE + newContent;
    return booklist;
}


function showHideCategory(element) {
    let children = element.querySelectorAll('.book-selector-record');
    let isVisible = children[0].style.display != 'none';

    children.forEach(childerElement => {
        if (isVisible) {
            childerElement.style.display = 'none';
        } else {
            childerElement.style.display = 'flex';
        }
    });

    if (isVisible) {
        let triangle = element.querySelector('.book-selector-triangle-open')
        triangle.classList = 'book-selector-triangle-close';
    } else {
        let triangle = element.querySelector('.book-selector-triangle-close')
        triangle.classList = 'book-selector-triangle-open';
    }
}


function selectUnselectRecord(element) {
    if (element.classList.contains('book-selector-record-selected') == false) {
        element.classList = 'book-selector-record book-selector-record-selected';
    } else {
        element.classList = 'book-selector-record';
    }
}


function updateInfo(booklist) {
    let recordElements = document.querySelectorAll('.book-selector-record-selected[data-book-selector-record-category][data-book-selector-record-number]');
    let selectedRecords = {}

    recordElements.forEach(element => {
        (selectedRecords[element.getAttribute('data-book-selector-record-category')] ??= []).push(element.getAttribute('data-book-selector-record-number'));
    });

    let status = booklist.selectionStatus(selectedRecords);
    let content = '';

    for (let key in status['status']) {
        content += BOOK_SELECTOR_INFO_CONTENT;
        content = content.replace('$KEY$', `${key}`);
        content = content.replace('$VALUE$', `${status['status'][key]}`);
    }

    let infoElement = document.getElementById('book-selector-info');
    infoElement.innerHTML = content;

    if (status['statusOk']) {
        infoElement.classList = 'book-selector-info';
        document.getElementById('book-selector-generate-pdf-button').disabled = false;
    } else {
        infoElement.classList = 'book-selector-info book-selector-info-nok';
        document.getElementById('book-selector-generate-pdf-button').disabled = true;
    }

    return status;
}


function validateAndDownload(event, booklist) {
    event.preventDefault();

    if (!updateInfo(booklist)['statusOk']) { alert('Prosím vyberte knihy podle zadaných kritérií.'); return }

    let form = document.getElementById("book-selector-submit-form");

    if (!form.reportValidity()) { return }

    let data = {};
    let recordElements = document.querySelectorAll('.book-selector-record-selected[data-book-selector-record-category][data-book-selector-record-number]');
    let selectedRecords = {}

    recordElements.forEach(element => {
        (selectedRecords[element.getAttribute('data-book-selector-record-category')] ??= []).push(element.getAttribute('data-book-selector-record-number'));
    });

    for (let categoryNum in selectedRecords) {
        for (let recordNum of selectedRecords[parseInt(categoryNum)]) {
            (data[CATEGORY_ID[categoryNum]] ??= []).push(booklist.data[CATEGORY_ID[categoryNum]][recordNum]);
        }
    }

    pdf = new BookSelectorPDFData(
        form.querySelector('[name="book-selector-user-name"]').value,
        form.querySelector('[name="book-selector-user-class"]').value,
        data
    );

    bookSelectorDownloadPDF('src/template.pdf', 'src/OpenSans-Regular.ttf', pdf.data);
}