class BookSelectorData {
    constructor(text, x, y, width, height, leftOffset, centerBalance, fontSize, fontColor, borderWidth, borderColor) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.leftOffset = leftOffset;
        this.centerBalance = centerBalance;
        this.fontSize = fontSize;
        this.fontColor = fontColor;
        this.borderWidth = borderWidth;
        this.borderColor = borderColor;
    }
}


class BookSelectorLabel {
    constructor(text, order_number, records_before_count) {
        this.text = text;
        this.order_number = order_number;
        this.records_before_count = records_before_count;
        this.y = (640) - (this.records_before_count * 18) - (this.order_number * 32);
    }

    get label() {
        return new BookSelectorData(`${this.text}`, 71, this.y, 0, 24, 4, 0, 11, [0.2, 0.2, 0.2], undefined, undefined);
    }
}


class BookSelectorBookRecord {
    commonData = [18, 6, 1, 10.5, [0, 0, 0], 0.3, [0, 0, 0]];

    constructor(order_number, category_number, author, book_name) {
        this.order_number = order_number;
        this.category_number = category_number;
        this.text_author = author;
        this.text_name = book_name;
        this.y = (640) - (this.category_number * 32) - (this.order_number * 18);
    }

    get record() {
        return [
            new BookSelectorData(`${this.order_number}.`, 71, this.y, 49.5, ...this.commonData),
            new BookSelectorData(`${this.text_author}`, 120.5, this.y, 170, ...this.commonData),
            new BookSelectorData(`${this.text_name}`, 290.5, this.y, 233, ...this.commonData)
        ]
    }
}


class BookSelectorInfo {
    constructor(studentName, studentClass) {
        this.name = studentName;
        this.class_ = studentClass;
    }

    get info() {
        const date = new Date();
        return [
            new BookSelectorData(this.name, 165, 712.5, 0, 18, 0, 1, 11, [0, 0, 0], undefined, undefined),
            new BookSelectorData(this.class_, 105, 691.7, 0, 18, 0, 1, 11, [0, 0, 0], undefined, undefined),
            new BookSelectorData(`${date.getFullYear() - 1}/${date.getFullYear()}`, 130, 671.3, 0, 18, 0, 1, 11, [0, 0, 0], undefined, undefined),
            new BookSelectorData(`${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString()}`,
                115, 71.8, 0, 18, 0, 1, 11, [0, 0, 0], undefined, undefined)
        ];
    }
}


class BookSelectorPDFData {
    #data;

    constructor(studentName, studentClass, data) {
        this.info = new BookSelectorInfo(studentName.trim(), studentClass.trim());
        this.#data = data;
    }

    get data() {
        let categoryCount = 0;
        let recordCount = 0;
        let outData = [];

        for (let category in this.#data) {
            categoryCount += 1;
            outData.push((new BookSelectorLabel(category, categoryCount, recordCount)).label);

            for (let record of this.#data[category]) {
                recordCount += 1;
                let recordAuthor = record['Autor']
                if (recordAuthor.length > 30) { recordAuthor = recordAuthor.slice(0, 30) + '...' }
                let recordBook = record['Název díla']
                if (recordBook.length > 40) { recordBook = recordBook.slice(0, 40) + '...' }

                outData.push(...(new BookSelectorBookRecord(recordCount, categoryCount, recordAuthor, recordBook).record));
            }
        }

        outData.push(...this.info.info);

        return outData;
    }
}


async function bookSelectorGeneratePDF(pdfBytes, fontBytes, data) {
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    pdfDoc.registerFontkit(fontkit);
    let font = await pdfDoc.embedFont(fontBytes, { subset: false });

    for (item of data) {
        if (item.borderWidth && item.borderColor) {
            firstPage.drawRectangle({
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height,
                borderColor: PDFLib.rgb(item.borderColor[0], item.borderColor[1], item.borderColor[2]),
                borderWidth: item.borderWidth
            });
        }

        firstPage.drawText(item.text, {
            x: item.x + item.leftOffset,
            y: item.y + (item.height / 2) - (item.fontSize / 2) + item.centerBalance,
            size: item.fontSize,
            font: font,
            color: PDFLib.rgb(item.fontColor[0], item.fontColor[1], item.fontColor[2])
        });
    }

    return await pdfDoc.save();
}


async function bookSelectorDownloadPDF(templateUrl, fontUrl, data) {
    const [pdfResponse, fontResponse] = await Promise.all([
        fetch(templateUrl),
        fetch(fontUrl)
    ]);

    const pdfBytes = await pdfResponse.arrayBuffer();
    const fontBytes = await fontResponse.arrayBuffer();

    const modifiedPdfBytes = await bookSelectorGeneratePDF(pdfBytes, fontBytes, data);

    const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Seznam četby.pdf';
    link.click();
}